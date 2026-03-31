import os
import boto3
import pytest
from moto import mock_aws
from unittest.mock import patch
from imports_to_outputs_ddb_table.metadata_store import output_write
from imports_to_outputs_ddb_table.metadata_store.metadata_item import MetadataItem


@pytest.fixture
def dynamodb_mock():
    with mock_aws():
        client = boto3.client("dynamodb", region_name="eu-west-2")
        client.create_table(
            TableName="Outputs",
            KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST",
        )
        items = [
            {"id": {"S": "latest-id"}, "nextId": {"N": "10"}},
            {"id": {"S": "789"}, "requestType": {"S": "IMPORT"}},
        ]
        for item in items:
            client.put_item(TableName="Outputs", Item=item)

        client.create_table(
            TableName="Imports",
            KeySchema=[{"AttributeName": "requestId", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "requestId", "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST",
        )
        client.put_item(
            TableName="Imports",
            Item={"requestId": {"S": "123"}, "outputsId": {"S": "789"}},
        )

        yield client


def test_insert_and_update_item_metadata(dynamodb_mock):
    metadata = MetadataItem(
        id="123",
        request_type="IMPORT",
        data_sharing_agreement="dsa-000000-qad01",
        description="test file",
        fast_track=False,
        fast_track_justification="",
        file_name="test.csv",
        request_timestamp="123445",
        requestor_email="user1@nhs.net",
        sub_request_type="Reference Data",
        auto_validation_status="PENDING",
    )

    with patch(
        "imports_to_outputs_ddb_table.metadata_store.dynamodb.get_client",
        return_value=dynamodb_mock,
    ):
        output_write.insert_outputs_table(metadata)

        result = dynamodb_mock.get_item(TableName="Outputs", Key={"id": {"S": "123"}})
        assert result["Item"]["id"]["S"] == "123"

        metadata.request_type = "IMPORT"
        output_write.update_outputs_table(metadata)

        result2 = dynamodb_mock.get_item(TableName="Outputs", Key={"id": {"S": "123"}})
        assert result2["Item"]["requestType"]["S"] == "IMPORT"


def test_update_imports_table(dynamodb_mock):
    metadata = MetadataItem(
        id="123",
        request_type="IMPORT",
        data_sharing_agreement="dsa-000000-qad01",
        description="test file",
        fast_track=False,
        fast_track_justification="",
        file_name="test.csv",
        request_timestamp="123445",
        requestor_email="user1@nhs.net",
        sub_request_type="Reference Data",
        auto_validation_status="PENDING",
    )

    with patch(
        "imports_to_outputs_ddb_table.metadata_store.dynamodb.get_client",
        return_value=dynamodb_mock,
    ):
        output_write.update_imports_table("123", "789")

        result = dynamodb_mock.get_item(TableName="Outputs", Key={"id": {"S": "789"}})

        assert result["Item"]["id"]["S"] == "789"
