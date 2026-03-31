import csv
import json
from dataclasses import dataclass
from http import HTTPStatus
from io import BytesIO
from typing import Union
from unittest.mock import Mock

import boto3
import pytest
from aws_lambda_powertools.utilities.streaming.s3_object import S3Object
from botocore.exceptions import ClientError

import data_in_forwarder.data_in_forwarder as main
from data_in_forwarder.utils import *  # using to import custom exceptions for pytest.raise
from data_in_forwarder.utils.data import S3ObjectInfo

from .conftest import (
    CHARSET,
    IMPORT_DATA_PENDING_BUCKET_NAME,
    IMPORT_DATA_REJECTED_BUCKET_NAME,
    MAX_COLUMNS,
    MAX_DATA_SIZE_IN_BYTES,
    MAX_ROWS,
    SOURCE_EMAIL_ADDRESS,
)


@pytest.fixture
def lambda_context():
    @dataclass
    class LambdaContext:
        function_name: str = "test"
        memory_limit_in_mb: int = 128
        invoked_function_arn: str = "arn:aws:lambda:eu-west-2:809313241:function:test"
        aws_request_id: str = "52fdfc07-2182-154f-163f-5f0f9a621d72"

    return LambdaContext()


def create_test_file(mock_s3, bucket_name, file_key, file_name):
    file_path = "tests/test_data/" + file_name
    mock_s3.upload_file(file_path, bucket_name, file_key)


def set_up_mock(monkeypatch, address) -> Mock:
    mock = Mock()
    monkeypatch.setattr(address, mock)
    return mock


@pytest.fixture(autouse=True)
def mock_s3(monkeypatch) -> Mock:
    mock = set_up_mock(monkeypatch, "data_in_forwarder.data_in_forwarder.s3")
    mock.list_objects_v2.return_value = {"Contents": []}
    return mock


@pytest.fixture(autouse=True)
def mock_ses(monkeypatch) -> Mock:
    mock = set_up_mock(monkeypatch, "data_in_forwarder.data_in_forwarder.ses")
    return mock


def test_no_bucket_in_event_returns_bad_request(lambda_context):
    event = {"Records": [{"s3": {"object": {"key": "test"}}}]}

    resp = main.lambda_handler(event, lambda_context)

    assert resp["statusCode"] == HTTPStatus.BAD_REQUEST
    assert resp["body"] == json.dumps({"message": "Request must contain a bucket"})


def test_no_key_in_event_returns_bad_request(lambda_context):
    event = {"Records": [{"s3": {"bucket": {"name": "test"}}}]}

    resp = main.lambda_handler(event, lambda_context)

    assert resp["statusCode"] == HTTPStatus.BAD_REQUEST
    assert resp["body"] == json.dumps({"message": "Request must contain a key"})


def test_no_size_in_event_returns_bad_request(lambda_context):
    event = {
        "Records": [{"s3": {"bucket": {"name": "test"}, "object": {"key": "test"}}}]
    }

    resp = main.lambda_handler(event, lambda_context)

    assert resp["statusCode"] == HTTPStatus.BAD_REQUEST
    assert resp["body"] == json.dumps({"message": "Request must contain a size"})


def test_no_incorrect_key_format_returns_bad_request(lambda_context):
    event = {
        "Records": [
            {"s3": {"bucket": {"name": "test"}, "object": {"key": "test", "size": 100}}}
        ]
    }

    resp = main.lambda_handler(event, lambda_context)

    assert resp["statusCode"] == HTTPStatus.BAD_REQUEST
    assert resp["body"] == json.dumps(
        {
            "message": "Imported object key must have the format <agreement>/<email>/<file>."
        }
    )


def test_object_size_lt_3_returns_validation_error(lambda_context, mock_ses, mock_s3):
    event, object_info = _build_trigger_event(size=2)

    resp = main.lambda_handler(event, lambda_context)

    assert resp["statusCode"] == HTTPStatus.INTERNAL_SERVER_ERROR
    assert resp["body"] == json.dumps(
        {"message": f"Imported data {object_info.s3_uri} failed validation"}
    )
    mock_ses.send_email.assert_called_once_with(
        **_build_email_request(
            destination=object_info.user,
            subject=f"There is a technical error with your reference data file {object_info.file}",
            html_message=main.validation_failure_template.render(
                agreement=object_info.agreement,
                file=object_info.file,
                reason="File is too small/empty (2 bytes)",
            ),
            source=SOURCE_EMAIL_ADDRESS,
        )
    )
    mock_s3.copy_object.assert_called_once_with(
        Bucket=IMPORT_DATA_REJECTED_BUCKET_NAME,
        Key=object_info.key,
        CopySource=object_info.object_location,
        ACL="bucket-owner-full-control",
    )


def test_object_size_gt_limit_returns_validation_error(
    lambda_context, mock_ses, mock_s3
):
    event, object_info = _build_trigger_event(size=101)

    resp = main.lambda_handler(event, lambda_context)

    assert resp["statusCode"] == HTTPStatus.INTERNAL_SERVER_ERROR
    assert resp["body"] == json.dumps(
        {"message": f"Imported data {object_info.s3_uri} failed validation"}
    )
    mock_ses.send_email.assert_called_once_with(
        **_build_email_request(
            destination=object_info.user,
            subject=f"There is a technical error with your reference data file {object_info.file}",
            html_message=main.validation_failure_template.render(
                agreement=object_info.agreement,
                file=object_info.file,
                reason="File is too large (101 bytes)",
            ),
            source=SOURCE_EMAIL_ADDRESS,
        )
    )
    mock_s3.copy_object.assert_called_once_with(
        Bucket=IMPORT_DATA_REJECTED_BUCKET_NAME,
        Key=object_info.key,
        CopySource=object_info.object_location,
        ACL="bucket-owner-full-control",
    )


def test_object_key_no_csv_ext_returns_validation_error(
    lambda_context, mock_ses, mock_s3
):
    event, object_info = _build_trigger_event(file_name="test.zip")

    resp = main.lambda_handler(event, lambda_context)

    assert resp["statusCode"] == HTTPStatus.INTERNAL_SERVER_ERROR
    assert resp["body"] == json.dumps(
        {"message": f"Imported data {object_info.s3_uri} failed validation"}
    )
    mock_ses.send_email.assert_called_once_with(
        **_build_email_request(
            destination=object_info.user,
            subject=f"There is a technical error with your reference data file {object_info.file}",
            html_message=main.validation_failure_template.render(
                agreement=object_info.agreement,
                file=object_info.file,
                reason="File doesn't have required '.csv' extension (.zip)",
            ),
            source=SOURCE_EMAIL_ADDRESS,
        )
    )
    mock_s3.copy_object.assert_called_once_with(
        Bucket=IMPORT_DATA_REJECTED_BUCKET_NAME,
        Key=object_info.key,
        CopySource=object_info.object_location,
        ACL="bucket-owner-full-control",
    )


def test_failure_to_check_pending_bucket_returns_validation_error(
    lambda_context, mock_ses, mock_s3
):
    event, object_info = _build_trigger_event()

    mock_s3.list_objects_v2.side_effect = ClientError({}, {})

    resp = main.lambda_handler(event, lambda_context)

    assert resp["statusCode"] == HTTPStatus.INTERNAL_SERVER_ERROR
    assert resp["body"] == json.dumps(
        {"message": f"Imported data {object_info.s3_uri} failed validation"}
    )
    mock_ses.send_email.assert_called_once_with(
        **_build_email_request(
            destination=object_info.user,
            subject=f"There is a technical error with your reference data file {object_info.file}",
            html_message=main.validation_failure_template.render(
                agreement=object_info.agreement,
                file=object_info.file,
                reason="Unable to check if file already exists",
            ),
            source=SOURCE_EMAIL_ADDRESS,
        )
    )
    mock_s3.copy_object.assert_called_once_with(
        Bucket=IMPORT_DATA_REJECTED_BUCKET_NAME,
        Key=object_info.key,
        CopySource=object_info.object_location,
        ACL="bucket-owner-full-control",
    )


def test_object_exists_in_pending_returns_validation_error(
    lambda_context, mock_ses, mock_s3
):
    event, object_info = _build_trigger_event()

    mock_s3.list_objects_v2.return_value = {"Contents": [{"Key": object_info.key}]}

    resp = main.lambda_handler(event, lambda_context)

    assert resp["statusCode"] == HTTPStatus.INTERNAL_SERVER_ERROR
    assert resp["body"] == json.dumps(
        {"message": f"Imported data {object_info.s3_uri} failed validation"}
    )
    mock_ses.send_email.assert_called_once_with(
        **_build_email_request(
            destination=object_info.user,
            subject=f"There is a technical error with your reference data file {object_info.file}",
            html_message=main.validation_failure_template.render(
                agreement=object_info.agreement,
                file=object_info.file,
                reason="A file with the same name is still being processed.\n\n"
                "Please email england.sde.input-checks@nhs.net if you would like the new file to replace "
                "the one being processed.",
            ),
            source=SOURCE_EMAIL_ADDRESS,
        )
    )
    mock_s3.copy_object.assert_called_once_with(
        Bucket=IMPORT_DATA_REJECTED_BUCKET_NAME,
        Key=object_info.key,
        CopySource=object_info.object_location,
        ACL="bucket-owner-full-control",
    )


def test_unable_to_read_object_from_s3_returns_validation_error(
    monkeypatch, lambda_context, mock_ses, mock_s3
):
    event, object_info = _build_trigger_event()

    mock_s3_object = set_up_mock(
        monkeypatch, "data_in_forwarder.data_in_forwarder.S3Object"
    )
    mock_s3_object.side_effect = ClientError({}, {})

    resp = main.lambda_handler(event, lambda_context)

    assert resp["statusCode"] == HTTPStatus.INTERNAL_SERVER_ERROR
    assert resp["body"] == json.dumps(
        {"message": f"Imported data {object_info.s3_uri} failed validation"}
    )
    mock_ses.send_email.assert_called_once_with(
        **_build_email_request(
            destination=object_info.user,
            subject=f"There is a technical error with your reference data file {object_info.file}",
            html_message=main.validation_failure_template.render(
                agreement=object_info.agreement,
                file=object_info.file,
                reason="Unable to read object for validation",
            ),
            source=SOURCE_EMAIL_ADDRESS,
        )
    )
    mock_s3.copy_object.assert_called_once_with(
        Bucket=IMPORT_DATA_REJECTED_BUCKET_NAME,
        Key=object_info.key,
        CopySource=object_info.object_location,
        ACL="bucket-owner-full-control",
    )


def test_invalid_csv_returns_validation_error(lambda_context, mock_ses, mock_s3):
    event, object_info = _build_trigger_event()
    test_client = boto3.client("s3")
    create_test_file(test_client, "test", object_info.key, "zip_file.csv")

    resp = main.lambda_handler(event, lambda_context)

    assert resp["statusCode"] == HTTPStatus.INTERNAL_SERVER_ERROR
    assert resp["body"] == json.dumps(
        {"message": f"Imported data {object_info.s3_uri} failed validation"}
    )
    mock_ses.send_email.assert_called_once_with(
        **_build_email_request(
            destination=object_info.user,
            subject=f"There is a technical error with your reference data file {object_info.file}",
            html_message=main.validation_failure_template.render(
                agreement=object_info.agreement,
                file=object_info.file,
                reason="File is not a valid CSV file",
            ),
            source=SOURCE_EMAIL_ADDRESS,
        )
    )
    mock_s3.copy_object.assert_called_once_with(
        Bucket=IMPORT_DATA_REJECTED_BUCKET_NAME,
        Key=object_info.key,
        CopySource=object_info.object_location,
        ACL="bucket-owner-full-control",
    )


def test_excel_file_returns_validation_error(lambda_context, mock_ses, mock_s3):
    event, object_info = _build_trigger_event()
    test_client = boto3.client("s3")
    create_test_file(test_client, "test", object_info.key, "xlsx.csv")

    resp = main.lambda_handler(event, lambda_context)

    assert resp["statusCode"] == HTTPStatus.INTERNAL_SERVER_ERROR
    assert resp["body"] == json.dumps(
        {"message": f"Imported data {object_info.s3_uri} failed validation"}
    )
    mock_ses.send_email.assert_called_once_with(
        **_build_email_request(
            destination=object_info.user,
            subject=f"There is a technical error with your reference data file {object_info.file}",
            html_message=main.validation_failure_template.render(
                agreement=object_info.agreement,
                file=object_info.file,
                reason="File is not a valid CSV file",
            ),
            source=SOURCE_EMAIL_ADDRESS,
        )
    )
    mock_s3.copy_object.assert_called_once_with(
        Bucket=IMPORT_DATA_REJECTED_BUCKET_NAME,
        Key=object_info.key,
        CopySource=object_info.object_location,
        ACL="bucket-owner-full-control",
    )


def test_too_few_rows_returns_validation_error(lambda_context, mock_ses, mock_s3):
    event, object_info = _build_trigger_event()
    test_client = boto3.client("s3")
    create_test_file(test_client, "test", object_info.key, "not_enough_rows.csv")

    resp = main.lambda_handler(event, lambda_context)

    assert resp["statusCode"] == HTTPStatus.INTERNAL_SERVER_ERROR
    assert resp["body"] == json.dumps(
        {"message": f"Imported data {object_info.s3_uri} failed validation"}
    )
    mock_ses.send_email.assert_called_once_with(
        **_build_email_request(
            destination=object_info.user,
            subject=f"There is a technical error with your reference data file {object_info.file}",
            html_message=main.validation_failure_template.render(
                agreement=object_info.agreement,
                file=object_info.file,
                reason="File has too few rows (1)",
            ),
            source=SOURCE_EMAIL_ADDRESS,
        )
    )
    mock_s3.copy_object.assert_called_once_with(
        Bucket=IMPORT_DATA_REJECTED_BUCKET_NAME,
        Key=object_info.key,
        CopySource=object_info.object_location,
        ACL="bucket-owner-full-control",
    )


def test_invalid_column_names_returns_validation_error(
    lambda_context, mock_ses, mock_s3
):
    event, object_info = _build_trigger_event()
    test_client = boto3.client("s3")
    create_test_file(test_client, "test", object_info.key, "invalid_headers.csv")

    resp = main.lambda_handler(event, lambda_context)

    assert resp["statusCode"] == HTTPStatus.INTERNAL_SERVER_ERROR
    assert resp["body"] == json.dumps(
        {"message": f"Imported data {object_info.s3_uri} failed validation"}
    )
    mock_ses.send_email.assert_called_once_with(
        **_build_email_request(
            destination=object_info.user,
            subject=f"There is a technical error with your reference data file {object_info.file}",
            html_message=main.validation_failure_template.render(
                agreement=object_info.agreement,
                file=object_info.file,
                reason="Headers within the file contain spaces or special characters",
            ),
            source=SOURCE_EMAIL_ADDRESS,
        )
    )
    mock_s3.copy_object.assert_called_once_with(
        Bucket=IMPORT_DATA_REJECTED_BUCKET_NAME,
        Key=object_info.key,
        CopySource=object_info.object_location,
        ACL="bucket-owner-full-control",
    )


def test_inconsistent_column_count_returns_validation_error(
    lambda_context, mock_ses, mock_s3
):
    event, object_info = _build_trigger_event()
    test_client = boto3.client("s3")
    create_test_file(test_client, "test", object_info.key, "inconsistent_column_count.csv")  # type: ignore

    resp = main.lambda_handler(event, lambda_context)

    assert resp["statusCode"] == HTTPStatus.INTERNAL_SERVER_ERROR
    assert resp["body"] == json.dumps(
        {"message": f"Imported data {object_info.s3_uri} failed validation"}
    )
    mock_ses.send_email.assert_called_once_with(
        **_build_email_request(
            destination=object_info.user,
            subject=f"There is a technical error with your reference data file {object_info.file}",
            html_message=main.validation_failure_template.render(
                agreement=object_info.agreement,
                file=object_info.file,
                reason="Line 3 has 3 columns, but the header row has 4",
            ),
            source=SOURCE_EMAIL_ADDRESS,
        )
    )
    mock_s3.copy_object.assert_called_once_with(
        Bucket=IMPORT_DATA_REJECTED_BUCKET_NAME,
        Key=object_info.key,
        CopySource=object_info.object_location,
        ACL="bucket-owner-full-control",
    )


@pytest.mark.parametrize(
    "input_csv,fail_reason",
    [
        (
            "none_header_check_first_row.csv",
            "There are 4 headers, but the header at column 4 is empty",
        ),
        (
            "empty_string_header_check_first_row.csv",
            "There are 2 headers, but the header at column 2 is empty",
        ),
    ],
)
def test_empty_header_returns_validation_error(
    lambda_context, mock_ses, mock_s3, input_csv, fail_reason
):
    event, object_info = _build_trigger_event()
    test_client = boto3.client("s3")
    create_test_file(test_client, "test", object_info.key, input_csv)

    resp = main.lambda_handler(event, lambda_context)

    assert resp["statusCode"] == HTTPStatus.INTERNAL_SERVER_ERROR
    assert resp["body"] == json.dumps(
        {"message": f"Imported data {object_info.s3_uri} failed validation"}
    )
    mock_ses.send_email.assert_called_once_with(
        **_build_email_request(
            destination=object_info.user,
            subject=f"There is a technical error with your reference data file {object_info.file}",
            html_message=main.validation_failure_template.render(
                agreement=object_info.agreement,
                file=object_info.file,
                reason=fail_reason,
            ),
            source=SOURCE_EMAIL_ADDRESS,
        )
    )


def test_newlines_in_data_returns_validation_error(lambda_context, mock_ses, mock_s3):
    event, object_info = _build_trigger_event()

    test_client = boto3.client("s3")
    create_test_file(test_client, "test", object_info.key, "newlines_in_data.csv")

    resp = main.lambda_handler(event, lambda_context)

    assert resp["statusCode"] == HTTPStatus.INTERNAL_SERVER_ERROR
    assert resp["body"] == json.dumps(
        {"message": f"Imported data {object_info.s3_uri} failed validation"}
    )
    mock_ses.send_email.assert_called_once_with(
        **_build_email_request(
            destination=object_info.user,
            subject=f"There is a technical error with your reference data file {object_info.file}",
            html_message=main.validation_failure_template.render(
                agreement=object_info.agreement,
                file=object_info.file,
                reason="Data within the file contains line break",
            ),
            source=SOURCE_EMAIL_ADDRESS,
        )
    )


def test_too_many_rows_returns_validation_error(lambda_context, mock_ses, mock_s3):
    event, object_info = _build_trigger_event()
    test_client = boto3.client("s3")
    create_test_file(test_client, "test", object_info.key, "too_many_rows.csv")

    resp = main.lambda_handler(event, lambda_context)

    assert resp["statusCode"] == HTTPStatus.INTERNAL_SERVER_ERROR
    assert resp["body"] == json.dumps(
        {"message": f"Imported data {object_info.s3_uri} failed validation"}
    )
    mock_ses.send_email.assert_called_once_with(
        **_build_email_request(
            destination=object_info.user,
            subject=f"There is a technical error with your reference data file {object_info.file}",
            html_message=main.validation_failure_template.render(
                agreement=object_info.agreement,
                file=object_info.file,
                reason=f"File has too many rows (6). The limit is {MAX_ROWS}",
            ),
            source=SOURCE_EMAIL_ADDRESS,
        )
    )
    mock_s3.copy_object.assert_called_once_with(
        Bucket=IMPORT_DATA_REJECTED_BUCKET_NAME,
        Key=object_info.key,
        CopySource=object_info.object_location,
        ACL="bucket-owner-full-control",
    )


def test_too_many_cols_returns_validation_error(lambda_context, mock_ses, mock_s3):
    event, object_info = _build_trigger_event()
    test_client = boto3.client("s3")
    create_test_file(test_client, "test", object_info.key, "too_many_columns.csv")

    resp = main.lambda_handler(event, lambda_context)

    assert resp["statusCode"] == HTTPStatus.INTERNAL_SERVER_ERROR
    assert resp["body"] == json.dumps(
        {"message": f"Imported data {object_info.s3_uri} failed validation"}
    )
    mock_ses.send_email.assert_called_once_with(
        **_build_email_request(
            destination=object_info.user,
            subject=f"There is a technical error with your reference data file {object_info.file}",
            html_message=main.validation_failure_template.render(
                agreement=object_info.agreement,
                file=object_info.file,
                reason=f"File has too many columns (5). The limit is {MAX_COLUMNS}",
            ),
            source=SOURCE_EMAIL_ADDRESS,
        )
    )
    mock_s3.copy_object.assert_called_once_with(
        Bucket=IMPORT_DATA_REJECTED_BUCKET_NAME,
        Key=object_info.key,
        CopySource=object_info.object_location,
        ACL="bucket-owner-full-control",
    )


def test_send_failure_email_failure_returns_error(lambda_context, mock_ses, mock_s3):
    event, object_info = _build_trigger_event()

    test_client = boto3.client("s3")
    create_test_file(test_client, "test", object_info.key, "not_enough_rows.csv")

    mock_ses.send_email.side_effect = ClientError({}, {})

    resp = main.lambda_handler(event, lambda_context)

    assert resp["statusCode"] == HTTPStatus.INTERNAL_SERVER_ERROR
    assert resp["body"] == json.dumps(
        {"message": "Failed to send validation failure notification email to user."}
    )
    mock_ses.send_email.assert_called_once_with(
        **_build_email_request(
            destination=object_info.user,
            subject=f"There is a technical error with your reference data file {object_info.file}",
            html_message=main.validation_failure_template.render(
                agreement=object_info.agreement,
                file=object_info.file,
                reason="File has too few rows (1)",
            ),
            source=SOURCE_EMAIL_ADDRESS,
        )
    )


def test_failure_to_move_object_on_validation_failure_returns_error(
    lambda_context, mock_ses, mock_s3
):
    event, object_info = _build_trigger_event()

    test_client = boto3.client("s3")
    create_test_file(test_client, "test", object_info.key, "not_enough_rows.csv")

    mock_s3.copy_object.side_effect = ClientError({}, {})

    resp = main.lambda_handler(event, lambda_context)

    assert resp["statusCode"] == HTTPStatus.INTERNAL_SERVER_ERROR
    assert resp["body"] == json.dumps(
        {
            "message": f"Failed to move data object {object_info.s3_uri} to rejected bucket"
        }
    )
    mock_ses.send_email.assert_called_once_with(
        **_build_email_request(
            destination=object_info.user,
            subject=f"There is a technical error with your reference data file {object_info.file}",
            html_message=main.validation_failure_template.render(
                agreement=object_info.agreement,
                file=object_info.file,
                reason="File has too few rows (1)",
            ),
            source=SOURCE_EMAIL_ADDRESS,
        )
    )
    mock_s3.copy_object.assert_called_once_with(
        Bucket=IMPORT_DATA_REJECTED_BUCKET_NAME,
        Key=object_info.key,
        CopySource=object_info.object_location,
        ACL="bucket-owner-full-control",
    )


def test_send_success_email_failure_returns_error(lambda_context, mock_ses, mock_s3):
    event, object_info = _build_trigger_event()

    test_client = boto3.client("s3")
    create_test_file(test_client, "test", object_info.key, "valid.csv")

    mock_ses.send_email.side_effect = ClientError({}, {})

    resp = main.lambda_handler(event, lambda_context)

    assert resp["statusCode"] == HTTPStatus.INTERNAL_SERVER_ERROR
    assert resp["body"] == json.dumps(
        {"message": "Failed to send validation success notification email to user."}
    )
    mock_ses.send_email.assert_called_once_with(
        **_build_email_request(
            destination=object_info.user,
            subject=f"We have received your reference data file {object_info.file}",
            html_message=main.validation_success_template.render(
                agreement=object_info.agreement, file=object_info.file
            ),
            source=SOURCE_EMAIL_ADDRESS,
        )
    )
    mock_s3.copy_object.assert_called_once_with(
        Bucket=IMPORT_DATA_PENDING_BUCKET_NAME,
        Key=object_info.key,
        CopySource=object_info.object_location,
        ACL="bucket-owner-full-control",
    )


def test_failure_to_move_object_on_validation_success_returns_error(
    lambda_context, mock_ses, mock_s3
):
    event, object_info = _build_trigger_event()

    test_client = boto3.client("s3")
    create_test_file(test_client, "test", object_info.key, "valid.csv")

    mock_s3.copy_object.return_value = {}

    resp = main.lambda_handler(event, lambda_context)

    assert resp["statusCode"] == HTTPStatus.INTERNAL_SERVER_ERROR
    assert resp["body"] == json.dumps(
        {
            "message": f"Failed to move data object {object_info.s3_uri} to pending bucket"
        }
    )
    mock_s3.copy_object.assert_called_once_with(
        Bucket=IMPORT_DATA_PENDING_BUCKET_NAME,
        Key=object_info.key,
        CopySource=object_info.object_location,
        ACL="bucket-owner-full-control",
    )
    mock_ses.send_email.assert_not_called()


def test_valid_file_returns_success(lambda_context, mock_ses, mock_s3):
    event, object_info = _build_trigger_event()

    test_client = boto3.client("s3")
    create_test_file(test_client, "test", object_info.key, "valid.csv")

    resp = main.lambda_handler(event, lambda_context)

    assert resp["statusCode"] == HTTPStatus.OK
    assert resp["body"] == f"Object {object_info.s3_uri} forwarded successfully"

    mock_ses.send_email.assert_called_once_with(
        **_build_email_request(
            destination=object_info.user,
            subject=f"We have received your reference data file {object_info.file}",
            html_message=main.validation_success_template.render(
                agreement=object_info.agreement, file=object_info.file
            ),
            source=SOURCE_EMAIL_ADDRESS,
        )
    )
    mock_s3.copy_object.assert_called_once_with(
        Bucket=IMPORT_DATA_PENDING_BUCKET_NAME,
        Key=object_info.key,
        CopySource=object_info.object_location,
        ACL="bucket-owner-full-control",
    )


def _build_trigger_event(
    bucket: str = "test",
    agreement: str = "dsa-000000-test",
    user_id: str = "user@email.com",
    file_name: str = "test.csv",
    size: int = int(MAX_DATA_SIZE_IN_BYTES),
) -> tuple[dict, S3ObjectInfo]:
    key = f"{agreement}/{user_id}/{file_name}"
    return (
        {
            "Records": [
                {
                    "s3": {
                        "bucket": {"name": bucket},
                        "object": {"key": key, "size": size},
                    }
                }
            ]
        },
        _build_s3_object_info(bucket=bucket, key=key, size=size),
    )


def _build_s3_object_info(
    bucket: str = "test",
    agreement: str = "dsa-000000-test",
    user_id: str = "user@email.com",
    file_name: str = "test.csv",
    size: int = int(MAX_DATA_SIZE_IN_BYTES),
    key: str = None,
):
    if key is None:
        key = f"{agreement}/{user_id}/{file_name}"
    return S3ObjectInfo(bucket, key, size)


def _build_email_request(
    destination: Union[str, None], html_message: str, source: str, subject: str
) -> dict:
    return {
        "Destination": {"ToAddresses": [destination]},
        "Message": {
            "Body": {"Html": {"Charset": CHARSET, "Data": html_message}},
            "Subject": {"Charset": CHARSET, "Data": subject},
        },
        "Source": source,
    }


def mock_s3_object_stream(test_file: str) -> list[dict[str, str]]:
    with open(f"tests/test_data/{test_file}", "rt") as f:
        reader = csv.DictReader(f)
        s3_dict = [row for row in reader]
        print(f"mock s3 stream: {s3_dict}")
    return s3_dict


# test helper functions
def test_validate_file_size_too_small_returns_error():
    s3_object_info = _build_s3_object_info(size=2)

    with pytest.raises(ObjectValidationException) as excinfo:
        main._validate_file_size(s3_object_info)
    assert str(excinfo.value) == "File is too small/empty (2 bytes)"


def test_validate_file_size_too_large_returns_error():
    s3_object_info = _build_s3_object_info(size=101)

    with pytest.raises(ObjectValidationException) as excinfo:
        main._validate_file_size(s3_object_info)
    assert str(excinfo.value) == "File is too large (101 bytes)"


def test_validate_file_size_returns_success():
    s3_object_info = _build_s3_object_info()
    result = main._validate_file_size(s3_object_info)
    assert result


def test_validate_file_extension_returns_error():
    s3_object_info = _build_s3_object_info(file_name="test.zip")

    with pytest.raises(ObjectValidationException) as excinfo:
        main._validate_file_extension(s3_object_info)
    assert str(excinfo.value) == "File doesn't have required '.csv' extension (.zip)"


def test_validate_file_extension_returns_success():
    s3_object_info = _build_s3_object_info()
    result = main._validate_file_extension(s3_object_info)
    assert result


def test_check_duplicate_pending_file_unable_to_check_returns_error(mock_s3):
    s3_object_info = _build_s3_object_info()

    mock_s3.list_objects_v2.side_effect = ClientError({}, {})

    with pytest.raises(ObjectValidationException) as excinfo:
        main._check_duplicate_pending_file(s3_object_info)
    assert str(excinfo.value) == "Unable to check if file already exists"


def test_check_duplicate_pending_file_already_exists_returns_error(mock_s3):
    s3_object_info = _build_s3_object_info()

    mock_s3.list_objects_v2.return_value = {"Contents": [{"Key": s3_object_info.key}]}

    with pytest.raises(ObjectValidationException) as excinfo:
        main._check_duplicate_pending_file(s3_object_info)
    assert str(excinfo.value) == (
        "A file with the same name is still being processed.\n\n"
        "Please email england.sde.input-checks@nhs.net if you would like the new file to replace "
        "the one being processed."
    )


def test_check_duplicate_pending_file_returns_success(mock_s3):
    s3_object_info = _build_s3_object_info()
    mock_s3.list_objects_v2.return_value = {"Contents": []}

    result = main._check_duplicate_pending_file(s3_object_info)
    assert result


def test_stream_file_data_returns_error(monkeypatch):
    s3_object_info = _build_s3_object_info()

    mock_s3_object = set_up_mock(
        monkeypatch, "data_in_forwarder.data_in_forwarder.S3Object"
    )
    mock_s3_object.side_effect = ClientError({}, {})

    with pytest.raises(ObjectValidationException) as excinfo:
        main._stream_file_data(s3_object_info)
    assert str(excinfo.value) == "Unable to read object for validation"


def test_stream_file_data_returns_success():
    s3_object_info = _build_s3_object_info()
    test_client = boto3.client("s3")
    create_test_file(test_client, "test", s3_object_info.key, "valid.csv")
    expected = mock_s3_object_stream("valid.csv")

    result = main._stream_file_data(s3_object_info)
    content = [row_data for row_data in result]
    result.raw_stream.close()  # closes the raw_stream as caused warning on test run
    assert type(result) is S3Object
    assert content == expected


# returns errors tests for _validate_csv_content covered by other helper function tests below
def test_validate_csv_content_returns_success():
    s3_file = mock_s3_object_stream("valid.csv")
    result = main._validate_csv_content(s3_file)
    assert result


def test_validate_header_characters_returns_error():
    s3_file = mock_s3_object_stream("invalid_headers.csv")
    first_row = s3_file[0]

    with pytest.raises(ObjectValidationException) as excinfo:
        main._validate_header_characters(first_row)
    assert (
        str(excinfo.value)
        == "Headers within the file contain spaces or special characters"
    )


def test_validate_header_characters_returns_success():
    s3_file = mock_s3_object_stream("valid.csv")
    first_row = s3_file[0]

    result = main._validate_header_characters(first_row)
    assert result


def test_validate_column_number_for_row_returns_error():
    s3_file = mock_s3_object_stream("inconsistent_column_count.csv")
    num_header_cols = len(s3_file[0])
    row_index_with_issue = 1
    row_counter = row_index_with_issue + 1
    row_data = s3_file[row_index_with_issue]

    with pytest.raises(ObjectValidationException) as excinfo:
        main._validate_column_number_for_row(row_data, row_counter, num_header_cols)
    assert str(excinfo.value) == "Line 3 has 3 columns, but the header row has 4"


def test_validate_column_number_for_row_returns_success():
    s3_file = mock_s3_object_stream("valid.csv")
    num_header_cols = len(s3_file[0])
    row_counter = 2
    row_data = s3_file[1]

    result = main._validate_column_number_for_row(
        row_data, row_counter, num_header_cols
    )
    assert result


@pytest.mark.parametrize(
    "input_csv,error_message",
    [
        (
            "none_header_check_first_row.csv",
            "There are 4 headers, but the header at column 4 is empty",
        ),
        (
            "empty_string_header_check_first_row.csv",
            "There are 2 headers, but the header at column 2 is empty",
        ),
    ],
)
def test_validate_headers_not_empty_returns_error(input_csv, error_message):
    s3_file = mock_s3_object_stream(input_csv)
    row_data = s3_file[0]
    num_header_cols = len(row_data)

    with pytest.raises(ObjectValidationException) as excinfo:
        main._validate_headers_not_empty(row_data, num_header_cols)
    assert str(excinfo.value) == error_message


def test_validate_headers_not_empty_returns_success():
    s3_file = mock_s3_object_stream("valid.csv")
    first_row = s3_file[0]
    num_header_cols = len(first_row)

    result = main._validate_headers_not_empty(first_row, num_header_cols)
    assert result


def test_validate_row_line_breaks_returns_error():
    s3_file = mock_s3_object_stream("newlines_in_data.csv")
    row_index_with_issue = 1
    row_data = s3_file[row_index_with_issue]

    with pytest.raises(ObjectValidationException) as excinfo:
        main._validate_row_line_breaks(row_data)
    assert str(excinfo.value) == "Data within the file contains line break"


def test_validate_row_line_breaks_returns_success():
    s3_file = mock_s3_object_stream("valid.csv")
    row_data = s3_file[1]

    result = main._validate_row_line_breaks(row_data)
    assert result


def test_validate_above_min_row_limit_returns_error():
    s3_file = mock_s3_object_stream("not_enough_rows.csv")
    rows_in_file = len(s3_file)

    with pytest.raises(ObjectValidationException) as excinfo:
        main._validate_above_min_row_limit(rows_in_file)
    assert str(excinfo.value) == "File has too few rows (1)"


def test_validate_above_min_row_limit_returns_success():
    rows_in_file = 1
    result = main._validate_above_min_row_limit(rows_in_file)
    assert result


def test_validate_under_max_row_limit_returns_error():
    s3_file = mock_s3_object_stream("too_many_rows.csv")
    rows_in_file = len(s3_file)

    with pytest.raises(ObjectValidationException) as excinfo:
        main._validate_under_max_row_limit(rows_in_file)
    assert str(excinfo.value) == "File has too many rows (6). The limit is 5"


def test_validate_under_max_row_limit_returns_success():
    s3_file = mock_s3_object_stream("valid.csv")
    rows_in_file = len(s3_file)

    result = main._validate_under_max_row_limit(rows_in_file)
    assert result


def test_validate_under_max_columns_limit_returns_error():
    s3_file = mock_s3_object_stream("too_many_rows.csv")
    rows_in_file = len(s3_file)

    with pytest.raises(ObjectValidationException) as excinfo:
        main._validate_under_max_columns_limit(rows_in_file)
    assert str(excinfo.value) == "File has too many columns (5). The limit is 4"


def test_validate_under_max_columns_limit_returns_success():
    s3_file = mock_s3_object_stream("valid.csv")
    rows_in_file = len(s3_file)

    result = main._validate_under_max_columns_limit(rows_in_file)
    assert result


@pytest.mark.parametrize(
    "input_csv,expected_error_message",
    [
        (
            # test file with row with extra data (with placeholder comma)
            # error not on first row
            "empty_string_header_check.csv",
            "There are 2 headers, but the header at column 2 is empty",
        ),
        (
            # test file with missing header (with placeholder comma)
            # error on first row
            "empty_string_header_check_first_row.csv",
            "There are 2 headers, but the header at column 2 is empty",
        ),
        (
            # test if too few columns in data rows
            # (too many columns is covered in mising headers tests)
            "inconsistent_column_count.csv",
            "Line 3 has 3 columns, but the header row has 4",
        ),
        (
            "invalid_headers.csv",
            "Headers within the file contain spaces or special characters",
        ),
        (
            "missing_middle_header_check.csv",
            "There are 3 headers, but the header at column 2 is empty",
        ),
        (
            # if file is missing a header (without comma) & invalid header
            "multi_issues.csv",
            "There are 4 headers, but the header at column 4 is empty",
        ),
        (
            "newlines_in_data.csv",
            "Data within the file contains line break",
        ),
        (
            # test file with missing header (without comma)
            # error on first row
            "none_header_check_first_row.csv",
            "There are 4 headers, but the header at column 4 is empty",
        ),
        (
            # test file with row with extra data (without comma)
            # error not on first row
            "none_header_check.csv",
            "Line 4 has 2 columns, but the header row has 1",
        ),
        (
            "not_enough_rows.csv",
            "File has too few rows (1)",
        ),
        (
            "too_many_columns.csv",
            f"File has too many columns (5). The limit is {MAX_COLUMNS}",
        ),
        (
            "too_many_rows.csv",
            f"File has too many rows (6). The limit is {MAX_ROWS}",
        ),
    ],
)
def test_validate_csv_content_returns_error(input_csv, expected_error_message):
    """Test _validate_csv_content function fails at expected point"""
    s3_file = mock_s3_object_stream(input_csv)

    with pytest.raises(ObjectValidationException) as excinfo:
        main._validate_csv_content(s3_file)
    assert str(excinfo.value) == expected_error_message
