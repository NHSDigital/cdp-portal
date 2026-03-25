import boto3
import os

from boto3 import Session
from boto3.dynamodb.types import TypeDeserializer, TypeSerializer
from botocore.credentials import DeferredRefreshableCredentials
from botocore.session import get_session
from utils import logger

OUTPUTS_TABLE_NAME = os.environ["DYNAMODB_OUTPUTS_TABLE_NAME"]
DYNAMODB_OUTPUTS_ROLE_ARN = os.environ["DYNAMODB_OUTPUTS_ROLE_ARN"]
IMPORTS_TABLE_NAME = os.environ["DYNAMODB_IMPORTS_TABLE_NAME"]
ENVIRONMENT = os.environ["ENVIRONMENT"]
IMPORTS_S3_BUCKET = os.environ["IMPORTS_S3_BUCKET"]
DYNAMODB_CLIENT = None
BOTO3_SESSION = None


def _create_session() -> Session:
    session_credentials = DeferredRefreshableCredentials(
        refresh_using=assume_role,
        method="sts-assume-role",
    )
    botocore_session = get_session()
    botocore_session._credentials = session_credentials
    logger.info("Created session with pending credentials")
    return boto3.Session(botocore_session=botocore_session)


def _create_client():
    global BOTO3_SESSION
    dynamodb_client = BOTO3_SESSION.client(
        "dynamodb",
        region_name=os.environ["AWS_REGION"],
    )
    logger.info(
        f"Dynamodb Client Created Successfully for region: {dynamodb_client.meta.region_name}"
    )
    return dynamodb_client


def _get_sts_client():
    return boto3.client(
        "sts",
        region_name=os.environ["AWS_REGION"],
        endpoint_url=f"https://sts.{os.environ['AWS_REGION']}.amazonaws.com",
    )


def assume_role():
    role_arn = os.environ["DYNAMODB_OUTPUTS_ROLE_ARN"]
    sts_client = _get_sts_client()

    sts_session = sts_client.assume_role(
        RoleArn=role_arn,
        RoleSessionName=os.environ["AWS_LAMBDA_FUNCTION_NAME"],
    )
    credentials = sts_session.get("Credentials")
    logger.info(f"Credentials refreshed to expire by {credentials.get('Expiration')}")
    return {
        "access_key": credentials.get("AccessKeyId"),
        "secret_key": credentials.get("SecretAccessKey"),
        "token": credentials.get("SessionToken"),
        "expiry_time": credentials.get("Expiration").isoformat(),
    }


def get_client():
    global BOTO3_SESSION
    global DYNAMODB_CLIENT
    if BOTO3_SESSION is None:
        BOTO3_SESSION = _create_session()
    DYNAMODB_CLIENT = _create_client()
    return DYNAMODB_CLIENT


def get_client_imports():
    return boto3.client("dynamodb", region_name=os.environ["AWS_REGION"])


def to_dynamodb_item(python_obj: dict) -> dict:
    serializer = TypeSerializer()
    return {k: serializer.serialize(v) for k, v in python_obj.items()}
