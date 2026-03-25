from . import dynamodb
from .metadata_item import MetadataItem
from boto3.dynamodb.conditions import Attr
from utils import logger
from utils.exceptions import ItemCreationException


def insert_outputs_table(metadata: MetadataItem):
    logger.info("Inserting output store details into dynamodb")
    dynamodb.get_client().put_item(
        TableName=dynamodb.OUTPUTS_TABLE_NAME,
        Item=to_item(metadata),
        ConditionExpression="attribute_not_exists(id)",
    )
    logger.info("Successfully inserted output store details into dynamodb")


def update_outputs_table(metadata: MetadataItem):
    logger.info("Updating output store details into dynamodb")
    dynamodb.get_client().put_item(
        TableName=dynamodb.OUTPUTS_TABLE_NAME,
        Item=to_item(metadata),
        ConditionExpression="id = :id",
        ExpressionAttributeValues={":id": {"S": metadata.id}},
    )
    logger.info("Successfully inserted output store details into dynamodb")


def get_next_id() -> str:
    result = dynamodb.get_client().update_item(
        TableName=dynamodb.OUTPUTS_TABLE_NAME,
        Key={"id": {"S": "latest-id"}},
        UpdateExpression="SET #nextId = #nextId + :incr",
        ExpressionAttributeNames={"#nextId": "nextId"},
        ExpressionAttributeValues={":incr": {"N": "1"}},
        ReturnValues="UPDATED_NEW",
        ConditionExpression="attribute_exists(id)",
    )

    next_id = result.get("Attributes", {}).get("nextId", {}).get("N")
    if not next_id:
        raise ItemCreationException("Could not create new Id")
    return str(next_id)


def update_imports_table(imports_id: str, outputs_id: str):
    logger.info("Updating imports table")
    dynamodb.get_client_imports().update_item(
        TableName=dynamodb.IMPORTS_TABLE_NAME,
        Key={"requestId": {"S": imports_id}},
        UpdateExpression="SET outputsId = :outputs_id",
        ConditionExpression="requestId = :requestId",
        ExpressionAttributeValues={
            ":requestId": {"S": imports_id},
            ":outputs_id": {"S": outputs_id},
        },
    )

    logger.info("Successfully updated imports table")


def to_item(metadata: MetadataItem) -> dict:
    json_item = metadata.to_dict()
    return dynamodb.to_dynamodb_item(json_item)
