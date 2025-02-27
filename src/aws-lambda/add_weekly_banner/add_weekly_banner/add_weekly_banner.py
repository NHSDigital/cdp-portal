import boto3
from datetime import datetime, timedelta, timezone
import time
import pytz
from aws_lambda_powertools.logging import Logger
import os

NOTIFICATION = """The Platform is currently undergoing its weekly maintenance update and is unavailable until 09:00hrs

Regular weekly maintenance updates are carried out between 7am and 9am on Wednesdays"""

COLOUR = "yellow"

NOTICES_TABLE = os.environ["DDB_NOTICES_TABLE_NAME"]

logger = Logger()


@logger.inject_lambda_context(clear_state=True)
def lambda_handler(event, context):
    logger.info("Creating weekly banner in Notices Table")

    # Set the timezone to Europe/London
    tz = pytz.timezone("Europe/London")

    # Get the current date and time in the specified timezone
    now = datetime.now(timezone.utc).astimezone(tz)

    # Calculate the number of days until next Wednesday
    days_until_wednesday = (2 - now.weekday()) % 7

    # Calculate the target date and time for next Wednesday
    target_date = now + timedelta(days=days_until_wednesday)

    target_start_date_time = target_date.replace(
        hour=7, minute=0, second=0, microsecond=0
    )

    target_end_date_time = target_date.replace(
        hour=9, minute=0, second=0, microsecond=0
    )

    # Convert the target date and time to the UNIX timestamp
    start_period = int(target_start_date_time.timestamp())
    expiry_period = int(target_end_date_time.timestamp())

    logger.info(
        "Calculated start_period and expiry_period",
        start_period=str(target_start_date_time),
        expiry_period=str(target_end_date_time),
    )

    notice_id = f"noticeId_{int(round(time.time()))}"

    ddb = boto3.client("dynamodb")

    ddb.put_item(
        TableName=NOTICES_TABLE,
        Item={
            "noticeId": {"S": notice_id},
            "notification": {"S": NOTIFICATION},
            "startPeriod": {"N": str(start_period)},
            "expiryPeriod": {"N": str(expiry_period)},
            "colour": {"S": COLOUR},
        },
    )

    logger.info("Successfully created weekly banner")
