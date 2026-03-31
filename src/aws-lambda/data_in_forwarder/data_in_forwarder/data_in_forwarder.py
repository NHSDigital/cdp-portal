"""Lambda function to validate and forward a file being imported into the SDE"""

import json
import os
from pathlib import Path
import re
from http import HTTPStatus
from typing import Union

import boto3
from aws_lambda_powertools.logging import Logger
from aws_lambda_powertools.utilities.data_classes import S3Event
from aws_lambda_powertools.utilities.streaming.s3_object import S3Object
from aws_lambda_powertools.utilities.typing import LambdaContext
from botocore.exceptions import ClientError
from utils.data import DataInForwarderOutput, S3ObjectInfo
from utils.exceptions import ObjectValidationException, S3ObjectMoveException
from jinja2 import Environment, FileSystemLoader, select_autoescape

IMPORT_DATA_PENDING_BUCKET_NAME = os.getenv("IMPORT_DATA_PENDING_BUCKET_NAME", "")
IMPORT_DATA_REJECTED_BUCKET_NAME = os.getenv("IMPORT_DATA_REJECTED_BUCKET_NAME", "")
SOURCE_EMAIL_ADDRESS = os.getenv("SOURCE_EMAIL_ADDRESS", "")
MAX_DATA_SIZE_IN_BYTES = int(os.getenv("MAX_DATA_SIZE_IN_BYTES", "5368709120"))
MAX_ROWS = int(os.getenv("MAX_ROWS", "1048576"))
MAX_COLUMNS = int(os.getenv("MAX_COLUMNS", "16384"))
AWS_REGION = os.getenv("AWS_REGION", "eu-west-2")
CHARSET = "UTF-8"

logger = Logger()
s3 = boto3.client("s3", region_name=AWS_REGION)
ses = boto3.client("ses", region_name=AWS_REGION)

env = Environment(
    loader=FileSystemLoader(Path(__file__).parent / "templates"),
    autoescape=select_autoescape(),
)
validation_success_template = env.get_template("success.html")
validation_failure_template = env.get_template("failure.html")


@logger.inject_lambda_context(clear_state=True)
def lambda_handler(event: dict, _: LambdaContext) -> DataInForwarderOutput:
    """Main lambda handler"""

    # Validate input event
    invoke_event = S3Event(event)
    try:
        bucket = invoke_event.bucket_name
    except KeyError:
        message = "Request must contain a bucket"
        return {
            "statusCode": HTTPStatus.BAD_REQUEST,
            "body": json.dumps({"message": message}),
        }
    try:
        key = invoke_event.object_key
    except KeyError:
        message = "Request must contain a key"
        logger.exception(message)
        return {
            "statusCode": HTTPStatus.BAD_REQUEST,
            "body": json.dumps({"message": message}),
        }
    try:
        size = invoke_event.record["s3"]["object"]["size"]
    except KeyError:
        message = "Request must contain a size"
        logger.exception(message)
        return {
            "statusCode": HTTPStatus.BAD_REQUEST,
            "body": json.dumps({"message": message}),
        }

    import_object = S3ObjectInfo(bucket, key, size)

    if not import_object.agreement or not import_object.user:
        message = "Imported object key must have the format <agreement>/<email>/<file>."
        return {
            "statusCode": HTTPStatus.BAD_REQUEST,
            "body": json.dumps({"message": message}),
        }

    # Validate imported object
    try:
        _validate_imported_object(import_object)
    except ObjectValidationException as err:
        message = f"Imported data {import_object.s3_uri} failed validation"
        logger.exception(message)
        try:
            _send_email(
                destination=[import_object.user],
                subject=f"There is a technical error with your reference data file {import_object.file}",
                html_message=validation_failure_template.render(
                    agreement=import_object.agreement,
                    file=import_object.file,
                    reason=err.args[0],
                ),
                source=SOURCE_EMAIL_ADDRESS,
            )
        except ClientError:
            message = "Failed to send validation failure notification email to user."
            logger.exception(message)
            return {
                "statusCode": HTTPStatus.INTERNAL_SERVER_ERROR,
                "body": json.dumps({"message": message}),
            }
        try:
            _move_s3_object(import_object, IMPORT_DATA_REJECTED_BUCKET_NAME)
        except (ClientError, S3ObjectMoveException):
            message = (
                f"Failed to move data object {import_object.s3_uri} to rejected bucket"
            )
            logger.exception(message)
            return {
                "statusCode": HTTPStatus.INTERNAL_SERVER_ERROR,
                "body": json.dumps({"message": message}),
            }
        return {
            "statusCode": HTTPStatus.INTERNAL_SERVER_ERROR,
            "body": json.dumps({"message": message}),
        }

    # Move the S3 object to the target bucket
    try:
        _move_s3_object(import_object, IMPORT_DATA_PENDING_BUCKET_NAME)
    except (ClientError, S3ObjectMoveException):
        message = f"Failed to move data object {import_object.s3_uri} to pending bucket"
        logger.exception(message)
        return {
            "statusCode": HTTPStatus.INTERNAL_SERVER_ERROR,
            "body": json.dumps({"message": message}),
        }

    # Notify the user that automated checks have passed
    try:
        _send_email(
            destination=[import_object.user],
            subject=f"We have received your reference data file {import_object.file}",
            html_message=validation_success_template.render(
                agreement=import_object.agreement, file=import_object.file
            ),
            source=SOURCE_EMAIL_ADDRESS,
        )
    except ClientError:
        message = "Failed to send validation success notification email to user."
        logger.exception(message)
        return {
            "statusCode": HTTPStatus.INTERNAL_SERVER_ERROR,
            "body": json.dumps({"message": message}),
        }

    return {
        "statusCode": HTTPStatus.OK,
        "body": f"Object {import_object.s3_uri} forwarded successfully",
    }


def _validate_imported_object(s3_object_info: S3ObjectInfo) -> bool:
    """Helper function for performing validation of an S3 object"""

    _validate_file_size(s3_object_info)
    _validate_file_extension(s3_object_info)
    _check_duplicate_pending_file(s3_object_info)
    s3_file = _stream_file_data(s3_object_info)

    try:
        _validate_csv_content(s3_file)
    except ObjectValidationException as err:
        if hasattr(s3_file, "raw_stream"):
            s3_file.raw_stream.close()
        raise ObjectValidationException(err.args[0])

    if hasattr(s3_file, "raw_stream"):
        s3_file.raw_stream.close()

    return True


def _validate_file_size(s3_object_info: S3ObjectInfo) -> bool:
    """Helper function to check object size between accepted range"""
    if s3_object_info.size < 3:  # Allow for single character header and data row
        raise ObjectValidationException(
            f"File is too small/empty ({s3_object_info.size} bytes)"
        )
    if s3_object_info.size > MAX_DATA_SIZE_IN_BYTES:
        raise ObjectValidationException(
            f"File is too large ({s3_object_info.size} bytes)"
        )
    return True


def _validate_file_extension(s3_object_info: S3ObjectInfo) -> bool:
    """Helper function to check file has .csv extension"""
    if not s3_object_info.key.endswith(".csv"):
        ext_info = (
            f" (.{s3_object_info.key.split('.')[-1]})"
            if "." in s3_object_info.key
            else ""
        )
        raise ObjectValidationException(
            f"File doesn't have required '.csv' extension{ext_info}"
        )
    return True


def _check_duplicate_pending_file(s3_object_info: S3ObjectInfo) -> bool:
    """Helper function to check file key does not already exist in pending"""
    try:
        existing_objects_response = s3.list_objects_v2(
            Bucket=IMPORT_DATA_PENDING_BUCKET_NAME, Prefix=s3_object_info.key
        )
    except ClientError as err:
        raise ObjectValidationException(
            "Unable to check if file already exists"
        ) from err
    existing_objects = [
        obj["Key"] for obj in existing_objects_response.get("Contents", [])
    ]
    if s3_object_info.key in existing_objects:
        raise ObjectValidationException(
            "A file with the same name is still being processed.\n\n"
            "Please email england.sde.input-checks@nhs.net if you would like the new file to replace "
            "the one being processed."
        )
    return True


def _stream_file_data(s3_object_info: S3ObjectInfo) -> S3Object:
    """Helper function to stream data file"""
    try:
        s3_file = S3Object(
            bucket=s3_object_info.bucket, key=s3_object_info.key, is_csv=True
        )
    except ClientError as err:
        message = "Unable to read object for validation"
        logger.exception(message)
        raise ObjectValidationException(message) from err
    return s3_file


def _validate_csv_content(csv_data: S3Object) -> bool:
    """Helper function for performing validation of rows & headers of an S3 object"""
    rows_in_file = 0

    # Validations per row of csv file
    try:
        for row_data in csv_data:
            rows_in_file += 1
            if rows_in_file == 1:
                # calculate num_header_cols inc none/'' headers so can use position in error message
                num_header_cols = len(row_data)
                _validate_headers_not_empty(row_data, num_header_cols)
                _validate_header_characters(row_data)
            _validate_column_number_for_row(row_data, rows_in_file, num_header_cols)
            _validate_row_line_breaks(row_data)

    # Validate file is valid csv file
    except UnicodeDecodeError as err:
        raise ObjectValidationException("File is not a valid CSV file") from err

    # Validations per file
    _validate_above_min_row_limit(rows_in_file)
    _validate_under_max_row_limit(rows_in_file)
    _validate_under_max_columns_limit(num_header_cols)

    return True


def _validate_header_characters(row_data: dict[str, str]) -> bool:
    """Helper function to check headers match naming convention for dbx"""
    for headers in row_data.keys():
        if re.search(r"[^a-zA-Z0-9_]", headers):
            raise ObjectValidationException(
                "Headers within the file contain spaces or special characters"
            )
    return True


def _validate_column_number_for_row(
    row_data: dict[str, str], rows_in_file: int, num_header_cols: int
) -> bool:
    """Helper function to check each row has the right amount of columns"""
    # S3Object returns dict of key pairs for each row
    # rows with missing separators will have end pairs with col key but None value
    # (if placeholder ',' was used in csv then value is '' not None)
    cols = len([x for x in row_data.values() if x is not None])
    if cols != num_header_cols:
        raise ObjectValidationException(
            f"Line {rows_in_file + 1} has {cols} columns, but the header row has {num_header_cols}"
        )
    return True


def _validate_headers_not_empty(row_data: dict[str, str], num_header_cols: int) -> bool:
    """Helper function to check for empty headers"""
    for header_index, header in enumerate(row_data.keys(), start=1):
        if header == "" or header is None:
            raise ObjectValidationException(
                f"There are {num_header_cols} headers, but the header at column {header_index} is empty"
            )
    return True


def _validate_row_line_breaks(row_data: dict[str, str]) -> bool:
    """Helper function to check for line breaks in a row"""
    for col_data in row_data.values():
        if "\n" in col_data:
            raise ObjectValidationException("Data within the file contains line break")
    return True


def _validate_above_min_row_limit(rows_in_file: int) -> bool:
    """Helper function to check at least 1 row of data"""
    if rows_in_file < 1:
        # rows_in_file doesn't include header row so + 1
        raise ObjectValidationException(f"File has too few rows ({rows_in_file + 1})")
    return True


def _validate_under_max_row_limit(rows_in_file: int) -> bool:
    """Helper function to check at rows don't exceed LibreOffice max limit"""
    if rows_in_file >= MAX_ROWS:
        # rows_in_file doesn't include header row so + 1 in exception message
        raise ObjectValidationException(
            f"File has too many rows ({rows_in_file + 1}). The limit is {MAX_ROWS}"
        )
    return True


def _validate_under_max_columns_limit(num_header_cols: int) -> bool:
    """Helper function to check at columns don't exceed LibreOffice max limit"""
    if num_header_cols > MAX_COLUMNS:
        raise ObjectValidationException(
            f"File has too many columns ({num_header_cols}). The limit is {MAX_COLUMNS}"
        )
    return True


def _move_s3_object(s3_object_info: S3ObjectInfo, target_bucket: str) -> None:
    """Helper function for moving objects in S3"""
    # Copy object to new location
    copy_response = s3.copy_object(
        Bucket=target_bucket,
        Key=s3_object_info.key,
        CopySource=s3_object_info.object_location,
        ACL="bucket-owner-full-control",
    )
    if not copy_response.get("CopyObjectResult", {}).get("ETag"):
        raise S3ObjectMoveException("Data copy failed due to unknown error.")
    # Remove object from original location
    s3.delete_object(Bucket=s3_object_info.bucket, Key=s3_object_info.key)


def _send_email(
    destination: list[Union[str, None]], html_message: str, source: str, subject: str
) -> None:
    """Helper function for sending email using AWS SES service"""
    ses.send_email(
        Destination={"ToAddresses": destination},
        Message={
            "Body": {"Html": {"Charset": CHARSET, "Data": html_message}},
            "Subject": {"Charset": CHARSET, "Data": subject},
        },
        Source=source,
    )
