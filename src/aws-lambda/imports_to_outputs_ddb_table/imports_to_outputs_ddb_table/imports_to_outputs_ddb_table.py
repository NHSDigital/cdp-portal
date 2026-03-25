from boto3.dynamodb.types import TypeDeserializer
from metadata_store import (
    create_metadata,
    insert_outputs_table,
    update_imports_table,
    update_outputs_table,
)
from utils import logger

deserializer = TypeDeserializer()


def lambda_handler(event, context):
    logger.info("Received event: %s", event)
    for record in event["Records"]:
        event_name = record["eventName"]
        logger.info("Processing record for event: %s", event_name)

        if event_name == "INSERT":
            new_image = deserialize_dynamodb_image(record["dynamodb"].get("NewImage"))
            logger.info("New Image Value: %s", new_image)
            metadata = create_metadata(new_image)
            insert_outputs_table(metadata)
            update_imports_table(new_image.get("requestId"), metadata.id)
            logger.info(
                "Successfully completed processing record for event: %s", event_name
            )

        if event_name == "MODIFY":
            new_image = deserialize_dynamodb_image(record["dynamodb"].get("NewImage"))
            status = new_image.get("autoValidationStatus").upper()
            if status in ("SUCCESS", "FAILED") and "outputsId" in new_image:
                logger.info("Processing record for event status: %s", status)
                metadata = create_metadata(new_image)
                update_outputs_table(metadata)
            logger.info(
                "Successfully completed processing record for event: %s", event_name
            )

    return {"statusCode": 200}


def deserialize_dynamodb_image(image):
    if not image:
        return None
    return {k: deserializer.deserialize(v) for k, v in image.items()}
