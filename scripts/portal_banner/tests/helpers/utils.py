import sys
import io
import json

import boto3

from moto import mock_dynamodb


@mock_dynamodb
def create_mock_dynamodb_table():
    ddb_client = boto3.client("dynamodb", region_name="eu-west-2")

    ddb_client.create_table(
        TableName="Notices",
        KeySchema=[{"AttributeName": "noticeId", "KeyType": "HASH"}],
        AttributeDefinitions=[{"AttributeName": "noticeId", "AttributeType": "S"}],
        BillingMode="PAY_PER_REQUEST",
        SSESpecification={
            "Enabled": True,
            "SSEType": "KMS",
            "KMSMasterKeyId": "string",
        },
    )

    return ddb_client


def capture_outputs(func, args, line_num):
    captured_output = io.StringIO()
    sys.stdout = captured_output
    func(*args)
    sys.stdout = sys.__stdout__
    value = captured_output.getvalue().split("\n")
    return value[line_num]


def create_temp_json_with_notice(tmpdir, input):
    f = tmpdir.mkdir("json_folder").join("notice.json")

    json_object = json.dumps(input, indent=4)

    f.write(json_object)

    return f
