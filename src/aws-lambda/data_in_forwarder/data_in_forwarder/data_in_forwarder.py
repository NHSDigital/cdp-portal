"""Lambda function to validate and forward a file being imported into the SDE"""

import codecs
import csv
import json
import os
from pathlib import Path
import re
from http import HTTPStatus
from typing import Union

import boto3
from aws_lambda_powertools.logging import Logger
from aws_lambda_powertools.utilities.data_classes import S3Event
from aws_lambda_powertools.utilities.typing import LambdaContext
from botocore.exceptions import ClientError
from utils.data import DataInForwarderOutput, S3ObjectInfo
from utils.exceptions import ObjectValidationException, S3ObjectMoveException
from jinja2 import Environment, FileSystemLoader, select_autoescape

IMPORT_DATA_PENDING_BUCKET_NAME = os.getenv("IMPORT_DATA_PENDING_BUCKET_NAME", "")
IMPORT_DATA_REJECTED_BUCKET_NAME = os.getenv("IMPORT_DATA_REJECTED_BUCKET_NAME", "")
SOURCE_EMAIL_ADDRESS = os.getenv("SOURCE_EMAIL_ADDRESS", "")
MAX_DATA_SIZE_IN_BYTES = int(os.getenv("MAX_DATA_SIZE", "1048576"))
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


def _validate_imported_object(s3_object_info: S3ObjectInfo) -> None:
    """Helper function for performing validation of an S3 object"""
    # Validate object size
    if s3_object_info.size < 3:  # Allow for single character header and data row
        raise ObjectValidationException(
            f"File is too small/empty ({s3_object_info.size} bytes)"
        )
    if s3_object_info.size > MAX_DATA_SIZE_IN_BYTES:
        raise ObjectValidationException(
            f"File is too large ({s3_object_info.size} bytes)"
        )
    # Check file extension
    if not s3_object_info.key.endswith(".csv"):
        ext_info = (
            f" (.{s3_object_info.key.split('.')[-1]})"
            if "." in s3_object_info.key
            else ""
        )
        raise ObjectValidationException(
            f"File doesn't have required '.csv' extension{ext_info}"
        )
    # Validate that an object with the same key doesn't already exist in pending
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
    # Read the object into memory for remaining validation
    try:
        s3_object_get_response = s3.get_object(**s3_object_info.object_location)
    except ClientError as err:
        message = "Unable to read object for validation"
        logger.exception(message)
        raise ObjectValidationException(message) from err

    s3_object_data = codecs.getreader(CHARSET)(s3_object_get_response["Body"])
    # Validate valid CSV

    try:
        csv_data = [row for row in csv.reader(s3_object_data) if row]
    except (csv.Error, UnicodeDecodeError) as err:
        raise ObjectValidationException("File is not a valid CSV file") from err

    # Check number of rows (expect more than 1)
    rows_in_file = len(csv_data)
    if rows_in_file < 2:
        raise ObjectValidationException(f"File has too few rows ({rows_in_file})")

    # Validate headers match naming convention for dbx
    for headers in csv_data[0]:
        if re.search(r"[^a-zA-Z0-9_]", headers):
            raise ObjectValidationException(
                "Headers within the file contain spaces or special characters."
            )

    num_header_cols = len(csv_data[0])
    for row_num, row_data in enumerate(csv_data):
        # Check each row has the right amount of columns
        cols = len(row_data)
        if cols != num_header_cols:
            raise ObjectValidationException(
                f"Line {row_num + 1} has {cols} columns, but the header row has {num_header_cols}"
            )
    # Checks for line breaks in csv
    for row_num, row_data in enumerate(csv_data):
        for col_num, col_data in enumerate(row_data):
            if "\n" in col_data:
                raise ObjectValidationException(
                    "Data within the file contains line break"
                )

    # validate empty header
    for header_index, header in enumerate(csv_data[0], start=1):
        if header == "":
            raise ObjectValidationException(
                f"There are {num_header_cols} headers, but the header at column {header_index} is empty."
            )


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
    ses.send_email(
        Destination={"ToAddresses": destination},
        Message={
            "Body": {"Html": {"Charset": CHARSET, "Data": html_message}},
            "Subject": {"Charset": CHARSET, "Data": subject},
        },
        Source=source,
    )
