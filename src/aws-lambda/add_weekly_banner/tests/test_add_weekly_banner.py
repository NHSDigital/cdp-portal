import pytest
from moto import mock_dynamodb
import boto3
from boto3.dynamodb.types import TypeDeserializer
import add_weekly_banner.add_weekly_banner as main
from dataclasses import dataclass
from freezegun import freeze_time
from decimal import Decimal
from datetime import datetime, timezone

deserializer = TypeDeserializer()


@dataclass
class LambdaContext:
    function_name: str = "test"
    memory_limit_in_mb: int = 128
    invoked_function_arn: str = (
        "arn:aws:lambda:eu-west-2:809313241:function:test"  # NOSONAR
    )
    aws_request_id: str = "52fdfc07-2182-154f-163f-5f0f9a621d72"


@pytest.fixture(autouse=True)
def mock_dynamo_w_agreements_db():
    with mock_dynamodb():
        boto3.client("dynamodb").create_table(
            TableName="Notices",
            KeySchema=[{"AttributeName": "noticeId", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "noticeId", "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST",
        )
        yield


@freeze_time("2024-01-23 16:00:00")
def test_lambda_handler_works():
    main.lambda_handler({}, LambdaContext())

    notices_scan = boto3.client("dynamodb").scan(TableName="Notices")

    generated_notice = deserializer.deserialize({"M": notices_scan["Items"][0]})

    assert generated_notice == {
        "noticeId": "noticeId_1706025600",
        "notification": "The Platform is currently undergoing its weekly maintenance update and is unavailable until 09:00hrs\n\nRegular weekly maintenance updates are carried out between 7am and 9am on Wednesdays",
        "startPeriod": Decimal("1706079600"),
        "expiryPeriod": Decimal("1706086800"),
        "colour": "yellow",
    }

    assert datetime.fromtimestamp(
        int(generated_notice["startPeriod"]), timezone.utc
    ) == datetime(2024, 1, 24, 7, 0, tzinfo=timezone.utc)

    assert datetime.fromtimestamp(
        int(generated_notice["expiryPeriod"]), timezone.utc
    ) == datetime(2024, 1, 24, 9, 0, tzinfo=timezone.utc)


@freeze_time("2024-06-23 16:00:00")
def test_lambda_handler_during_daylight_savings():
    main.lambda_handler({}, LambdaContext())

    notices_scan = boto3.client("dynamodb").scan(TableName="Notices")

    generated_notice = deserializer.deserialize({"M": notices_scan["Items"][0]})

    assert datetime.fromtimestamp(
        int(generated_notice["startPeriod"]), timezone.utc
    ) == datetime(2024, 6, 26, 6, 0, tzinfo=timezone.utc)

    assert datetime.fromtimestamp(
        int(generated_notice["expiryPeriod"]), timezone.utc
    ) == datetime(2024, 6, 26, 8, 0, tzinfo=timezone.utc)
