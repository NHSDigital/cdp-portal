import os
import boto3
import pytest
from moto import mock_aws


IMPORT_DATA_PENDING_BUCKET_NAME = "mock-pending-data-bucket"
IMPORT_DATA_REJECTED_BUCKET_NAME = "mock-rejected-data-bucket"
SOURCE_EMAIL_ADDRESS = "noreply@email.com"
MAX_DATA_SIZE_IN_BYTES = "100"
MAX_ROWS = "5"
MAX_COLUMNS = "4"

AWS_REGION = "eu-west-2"
CHARSET = "UTF-8"

# mock environs for lambda
os.environ["IMPORT_DATA_PENDING_BUCKET_NAME"] = IMPORT_DATA_PENDING_BUCKET_NAME
os.environ["IMPORT_DATA_REJECTED_BUCKET_NAME"] = IMPORT_DATA_REJECTED_BUCKET_NAME
os.environ["SOURCE_EMAIL_ADDRESS"] = SOURCE_EMAIL_ADDRESS
os.environ["MAX_DATA_SIZE_IN_BYTES"] = MAX_DATA_SIZE_IN_BYTES
os.environ["MAX_ROWS"] = MAX_ROWS
os.environ["MAX_COLUMNS"] = MAX_COLUMNS
os.environ["AWS_REGION"] = AWS_REGION


@pytest.fixture(autouse=True)
def aws_credentials():
    """Mocked AWS Credentials for moto."""
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"
    os.environ["AWS_DEFAULT_REGION"] = AWS_REGION


@pytest.fixture(autouse=True)
def mock_s3_buckets(aws_credentials):
    """Return a mocked S3 client"""
    with mock_aws():
        s3_client = boto3.client("s3")
        s3_client.create_bucket(
            Bucket=IMPORT_DATA_PENDING_BUCKET_NAME,
            CreateBucketConfiguration={"LocationConstraint": AWS_REGION},
        )
        s3_client.create_bucket(
            Bucket=IMPORT_DATA_REJECTED_BUCKET_NAME,
            CreateBucketConfiguration={"LocationConstraint": AWS_REGION},
        )
        s3_client.create_bucket(
            Bucket="test", CreateBucketConfiguration={"LocationConstraint": AWS_REGION}
        )
        yield


@pytest.fixture(autouse=True)
def mock_ses_client(aws_credentials):
    """Return a mocked ses client"""
    with mock_aws():
        # boto3.setup_default_session()
        ses_client = boto3.client("ses", region_name=AWS_REGION)
        yield ses_client
