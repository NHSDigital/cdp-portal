import json
from dataclasses import dataclass
from http import HTTPStatus
from io import BytesIO
from typing import Union
from unittest.mock import Mock

import pytest
from botocore.exceptions import ClientError
from botocore.response import StreamingBody
from data_in_forwarder.utils.data import S3ObjectInfo

IMPORT_DATA_PENDING_BUCKET_NAME = "pending-data-bucket"
IMPORT_DATA_REJECTED_BUCKET_NAME = "rejected-data-bucket"
SOURCE_EMAIL_ADDRESS = "noreply@email.com"
MAX_DATA_SIZE_IN_BYTES = 100
AWS_REGION = "eu-west-2"
CHARSET = "UTF-8"


@pytest.fixture
def lambda_context():
    @dataclass
    class LambdaContext:
        function_name: str = "test"
        memory_limit_in_mb: int = 128
        invoked_function_arn: str = "arn:aws:lambda:eu-west-2:809313241:function:test"
        aws_request_id: str = "52fdfc07-2182-154f-163f-5f0f9a621d72"

    return LambdaContext()


@pytest.fixture(autouse=True)
def env_vars(monkeypatch):
    _vars = {
        "IMPORT_DATA_PENDING_BUCKET_NAME": IMPORT_DATA_PENDING_BUCKET_NAME,
        "IMPORT_DATA_REJECTED_BUCKET_NAME": IMPORT_DATA_REJECTED_BUCKET_NAME,
        "SOURCE_EMAIL_ADDRESS": SOURCE_EMAIL_ADDRESS,
        "MAX_DATA_SIZE_IN_BYTES": MAX_DATA_SIZE_IN_BYTES,
        "AWS_REGION": AWS_REGION,
    }

    for k, v in _vars.items():
        monkeypatch.setattr(f"data_in_forwarder.data_in_forwarder.{k}", v)


def set_up_mock(monkeypatch, address) -> Mock:
    mock = Mock()
    monkeypatch.setattr(address, mock)
    return mock


@pytest.fixture(autouse=True)
def mock_s3(monkeypatch) -> Mock:
    mock = set_up_mock(monkeypatch, "data_in_forwarder.data_in_forwarder.s3")
    mock.list_objects_v2.return_value = {"Contents": []}
    mock.get_object.return_value = {"Body": create_s3_object_body("valid.csv")}
    return mock


@pytest.fixture(autouse=True)
def mock_ses(monkeypatch) -> Mock:
    mock = set_up_mock(monkeypatch, "data_in_forwarder.data_in_forwarder.ses")

    return mock


def test_no_bucket_in_event_returns_bad_request(lambda_context):
    event = {"Records": [{"s3": {"object": {"key": "test"}}}]}
    import data_in_forwarder.data_in_forwarder as main

    resp = main.lambda_handler(event, lambda_context)  # type: ignore

    assert resp["statusCode"] == HTTPStatus.BAD_REQUEST
    assert resp["body"] == json.dumps({"message": "Request must contain a bucket"})


def test_no_key_in_event_returns_bad_request(lambda_context):
    event = {"Records": [{"s3": {"bucket": {"name": "test"}}}]}
    import data_in_forwarder.data_in_forwarder as main

    resp = main.lambda_handler(event, lambda_context)  # type: ignore

    assert resp["statusCode"] == HTTPStatus.BAD_REQUEST
    assert resp["body"] == json.dumps({"message": "Request must contain a key"})


def test_no_size_in_event_returns_bad_request(lambda_context):
    event = {
        "Records": [{"s3": {"bucket": {"name": "test"}, "object": {"key": "test"}}}]
    }
    import data_in_forwarder.data_in_forwarder as main

    resp = main.lambda_handler(event, lambda_context)  # type: ignore

    assert resp["statusCode"] == HTTPStatus.BAD_REQUEST
    assert resp["body"] == json.dumps({"message": "Request must contain a size"})


def test_no_incorrect_key_format_returns_bad_request(lambda_context):
    event = {
        "Records": [
            {"s3": {"bucket": {"name": "test"}, "object": {"key": "test", "size": 100}}}
        ]
    }
    import data_in_forwarder.data_in_forwarder as main

    resp = main.lambda_handler(event, lambda_context)  # type: ignore

    assert resp["statusCode"] == HTTPStatus.BAD_REQUEST
    assert resp["body"] == json.dumps(
        {
            "message": "Imported object key must have the format <agreement>/<email>/<file>."
        }
    )


def test_object_size_lt_3_returns_validation_error(lambda_context, mock_ses, mock_s3):
    event, object_info = _build_trigger_event(size=2)

    import data_in_forwarder.data_in_forwarder as main

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

    import data_in_forwarder.data_in_forwarder as main

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

    import data_in_forwarder.data_in_forwarder as main

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

    import data_in_forwarder.data_in_forwarder as main

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

    import data_in_forwarder.data_in_forwarder as main

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
    lambda_context, mock_ses, mock_s3
):
    event, object_info = _build_trigger_event()

    mock_s3.get_object.side_effect = ClientError({}, {})

    import data_in_forwarder.data_in_forwarder as main

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

    mock_s3.get_object.return_value = {"Body": create_s3_object_body("zip_file.csv")}

    import data_in_forwarder.data_in_forwarder as main

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

    mock_s3.get_object.return_value = {"Body": create_s3_object_body("xlsx.csv")}

    import data_in_forwarder.data_in_forwarder as main

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

    mock_s3.get_object.return_value = {
        "Body": create_s3_object_body("not_enough_rows.csv")
    }

    import data_in_forwarder.data_in_forwarder as main

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

    mock_s3.get_object.return_value = {
        "Body": create_s3_object_body("invalid_headers.csv")
    }

    import data_in_forwarder.data_in_forwarder as main

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
                reason="Headers within the file contain spaces or special characters.",
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

    mock_s3.get_object.return_value = {
        "Body": create_s3_object_body("inconsistent_column_count.csv")
    }

    import data_in_forwarder.data_in_forwarder as main

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


def test_empty_header_returns_validation_error(lambda_context, mock_ses, mock_s3):
    event, object_info = _build_trigger_event()

    mock_s3.get_object.return_value = {
        "Body": create_s3_object_body("empty_header_check.csv")
    }

    import data_in_forwarder.data_in_forwarder as main

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
                reason="There are 2 headers, but the header at column 2 is empty.",
            ),
            source=SOURCE_EMAIL_ADDRESS,
        )
    )


def test_newlines_in_data_returns_validation_error(lambda_context, mock_ses, mock_s3):
    event, object_info = _build_trigger_event()

    mock_s3.get_object.return_value = {
        "Body": create_s3_object_body("newlines_in_data.csv")
    }

    import data_in_forwarder.data_in_forwarder as main

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


def test_send_failure_email_failure_returns_error(lambda_context, mock_ses, mock_s3):
    event, object_info = _build_trigger_event()

    mock_s3.get_object.return_value = {
        "Body": create_s3_object_body("not_enough_rows.csv")
    }

    mock_ses.send_email.side_effect = ClientError({}, {})

    import data_in_forwarder.data_in_forwarder as main

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

    mock_s3.get_object.return_value = {
        "Body": create_s3_object_body("not_enough_rows.csv")
    }

    mock_s3.copy_object.side_effect = ClientError({}, {})

    import data_in_forwarder.data_in_forwarder as main

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

    mock_ses.send_email.side_effect = ClientError({}, {})

    import data_in_forwarder.data_in_forwarder as main

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

    mock_s3.copy_object.return_value = {}

    import data_in_forwarder.data_in_forwarder as main

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

    import data_in_forwarder.data_in_forwarder as main

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
        S3ObjectInfo(bucket, key, size),
    )


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


def create_s3_object_body(test_file: str) -> StreamingBody:
    with open(f"tests/test_data/{test_file}", "rb") as f:
        data = f.read()
    return StreamingBody(BytesIO(data), len(data))
