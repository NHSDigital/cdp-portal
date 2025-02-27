import json
import os
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass
from unittest.mock import Mock

import pytest
from aws_lambda_powertools.utilities.data_classes import SNSEvent
from moto import mock_logs
from urllib3 import HTTPResponse

AWS_REGION = os.getenv("AWS_REGION", "eu-west-2")
test_slack_hook_url = "https://test.slack.hook"
alarm_name = "blah_blah_blah"
alarm_description = "This is an alarm"
time = "2022-06-06T13:39:29.654+0000"
reason = (
    "Threshold Crossed: 1 out of the last 1 datapoints was greater than the threshold"
)
metric_namespace = "vdi/namespace"
metric_name = "metric"
dimension_name = "Fleet"
dimension_value = "test_fleet"

# A recent timestamp is required on the log messages, or they will not be returned by filter_log_events
sns_message_time = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f%z")
request_id = "52fdfc07-2182-154f-163f-5f0f9a621d72"
function_arn = f"arn:aws:lambda:{AWS_REGION}:809313241:function:test"
error_log_line = {
    "level": "ERROR",
    "location": "lambda_handler:30",
    "message": "Something not so bad happened",
    "timestamp": "2022-05-19 08:43:17,942+0100",
    "service": "service_undefined",
    "cold_start": True,
    "function_name": "test",
    "function_memory_size": 128,
    "function_arn": function_arn,
    "function_request_id": request_id,
}
exception_log_line = {
    "level": "ERROR",
    "location": "lambda_handler:69",
    "message": "Something bad happened",
    "timestamp": "2022-05-19 09:21:38,299+0100",
    "service": "service_undefined",
    "cold_start": True,
    "function_name": "test",
    "function_memory_size": 128,
    "function_arn": function_arn,
    "function_request_id": request_id,
    "stack_name": "test_stack",
    "user_name": "test_user",
    "exception": 'Traceback (most recent call last):\n  File "/home/gareth-somerville/Projects/NHS/vdi/src/aws-lambda/get_session_info/get_session_info/get_session_info.py", line 34, in lambda_handler\n    just_for_a_stack_trace()\n  File "/home/gareth-somerville/Projects/NHS/vdi/src/aws-lambda/get_session_info/get_session_info/get_session_info.py", line 25, in just_for_a_stack_trace\n    raise Exception("Oh, how unexpected!")\nException: Oh, how unexpected!',
    "exception_name": "Exception",
}


def log_event_timestamp(offset_seconds: int):
    initial_timestamp = datetime.strptime(sns_message_time, "%Y-%m-%dT%H:%M:%S.%f%z")
    return int(
        (initial_timestamp + timedelta(seconds=offset_seconds)).timestamp() * 1000
    )


def slack_message_timestamp(offset_seconds: int):
    return datetime.utcfromtimestamp(
        log_event_timestamp(offset_seconds) / 1000
    ).isoformat()


@pytest.fixture
def lambda_context():
    @dataclass
    class LambdaContext:
        function_name: str = "test"
        memory_limit_in_mb: int = 128
        invoked_function_arn: str = function_arn
        aws_request_id: str = request_id

    return LambdaContext()


@mock_logs
def test_do_nothing_for_sns_setup_message(monkeypatch, lambda_context):
    monkeypatch.setenv("SLACK_HOOK_URL", test_slack_hook_url)
    import slack_alert.slack_alert as main

    mock_http = Mock()
    monkeypatch.setattr(main, "http", mock_http)
    test_message = "Successfully validated SNS topic for Amazon SES event publishing."
    event = {"Records": [{"Sns": {"Message": json.dumps(test_message)}}]}

    result = main.lambda_handler(SNSEvent(event), lambda_context)

    assert result == {"message": "Sns validation event, no action required."}
    mock_http.request.assert_not_called()


@mock_logs
def test_simple_message_for_stopped_ecs_task(monkeypatch, lambda_context):
    monkeypatch.setenv("SLACK_HOOK_URL", test_slack_hook_url)
    import slack_alert.slack_alert as main

    mock_http = Mock()
    monkeypatch.setattr(main, "http", mock_http)

    # Most fields removed for brevity
    test_message = {
        "detail-type": "ECS Task State Change",
        "detail": {
            "desiredStatus": "STOPPED",
            "group": "service:keycloak",
            "stoppedReason": "Scaling activity initiated by (deployment ecs-svc/6524458012816012998)",
        },
    }
    expected_status = 200
    mock_http.request.return_value = HTTPResponse(status=expected_status)
    event = {"Records": [{"Sns": {"Message": json.dumps(test_message)}}]}

    result = main.lambda_handler(SNSEvent(event), lambda_context)

    assert result == {"status": expected_status}

    mock_http.request.assert_called_once_with(
        method="POST",
        url=test_slack_hook_url,
        body=json.dumps(
            {
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*Detail:* {test_message['detail-type']}",
                        },
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*Group:* {test_message['detail']['group']}",
                        },
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*Desired Status:* {test_message['detail']['desiredStatus']}",
                        },
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*Reason:* {test_message['detail']['stoppedReason']}",
                        },
                    },
                ]
            }
        ),
    )


@mock_logs
def test_message_when_metric_filter_not_found(monkeypatch, lambda_context):
    monkeypatch.setenv("SLACK_HOOK_URL", test_slack_hook_url)
    import slack_alert.slack_alert as main

    mock_http = Mock()
    monkeypatch.setattr(main, "SLACK_HOOK_URL", test_slack_hook_url)
    monkeypatch.setattr(main, "http", mock_http)
    test_message = {
        "Trigger": {
            "MetricName": metric_name,
            "Namespace": metric_namespace,
            "Dimensions": [{"value": dimension_value, "name": dimension_name}],
        },
        "AlarmName": alarm_name,
        "AlarmDescription": alarm_description,
        "StateChangeTime": time,
        "NewStateReason": reason,
    }
    expected_status = 200
    mock_http.request.return_value = HTTPResponse(status=expected_status)
    event = {"Records": [{"Sns": {"Message": json.dumps(test_message)}}]}

    result = main.lambda_handler(SNSEvent(event), lambda_context)

    assert result == {"status": expected_status}
    mock_http.request.assert_called_once_with(
        method="POST",
        url=test_slack_hook_url,
        body=json.dumps(
            {
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": "*Alarm name:* blah_blah_blah",
                        },
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": "*Alarm description:* This is an alarm",
                        },
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": "*Time:* 2022-06-06T13:39:29.654+0000",
                        },
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": "*Reason:* Threshold Crossed: 1 out of the last 1 datapoints was greater than the threshold",
                        },
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": "*Namespace:* vdi/namespace",
                        },
                    },
                    {
                        "type": "section",
                        "text": {"type": "mrkdwn", "text": "*Fleet:* test_fleet"},
                    },
                    {
                        "type": "section",
                        "text": {"type": "mrkdwn", "text": "*Metric name:* metric"},
                    },
                ]
            }
        ),
    )


@mock_logs
def test_message_when_no_log_entries(monkeypatch, lambda_context):
    monkeypatch.setenv("SLACK_HOOK_URL", test_slack_hook_url)
    import slack_alert.slack_alert as main

    mock_http = Mock()
    monkeypatch.setattr(main, "http", mock_http)
    test_message = {
        "Trigger": {"MetricName": metric_name, "Namespace": metric_namespace},
        "AlarmName": alarm_name,
        "StateChangeTime": sns_message_time,
    }
    expected_status = 200
    mock_http.request.return_value = HTTPResponse(status=expected_status)
    event = {"Records": [{"Sns": {"Message": json.dumps(test_message)}}]}
    log_group_name = "log_group"
    main.cloudwatch.put_metric_filter(
        logGroupName=log_group_name,
        filterName="bob",
        filterPattern="",
        metricTransformations=[
            {
                "metricName": metric_name,
                "metricNamespace": metric_namespace,
                "metricValue": "jim",
            }
        ],
    )
    main.cloudwatch.create_log_group(logGroupName=log_group_name)

    result = main.lambda_handler(SNSEvent(event), lambda_context)

    assert result == {"status": expected_status}
    mock_http.request.assert_called_once_with(
        method="POST",
        url=test_slack_hook_url,
        body=json.dumps(
            {
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*Log group:* <https://eu-west-2.console.aws.amazon.com/cloudwatch/home?region=eu-west-2#logStream:group={log_group_name}|{log_group_name}>",
                        },
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*Could not find matching log entries*",
                        },
                    },
                ]
            }
        ),
    )


@mock_logs
def test_message_when_there_is_a_matching_string_log_entry(monkeypatch, lambda_context):
    monkeypatch.setenv("SLACK_HOOK_URL", test_slack_hook_url)
    import slack_alert.slack_alert as main

    mock_http = Mock()
    monkeypatch.setattr(main, "http", mock_http)
    test_message = {
        "Trigger": {"MetricName": metric_name, "Namespace": metric_namespace},
        "AlarmName": alarm_name,
        "StateChangeTime": sns_message_time,
    }
    expected_status = 200
    mock_http.request.return_value = HTTPResponse(status=expected_status)
    event = {"Records": [{"Sns": {"Message": json.dumps(test_message)}}]}
    log_group_name = "log_group"
    main.cloudwatch.put_metric_filter(
        logGroupName=log_group_name,
        filterName="bob",
        filterPattern="",
        metricTransformations=[
            {
                "metricName": metric_name,
                "metricNamespace": metric_namespace,
                "metricValue": "jim",
            }
        ],
    )
    main.cloudwatch.create_log_group(logGroupName=log_group_name)
    main.cloudwatch.create_log_stream(
        logGroupName=log_group_name, logStreamName=log_group_name
    )
    main.cloudwatch.put_log_events(
        logGroupName=log_group_name,
        logStreamName=log_group_name,
        logEvents=[{"timestamp": log_event_timestamp(-1), "message": "blah"}],
    )

    result = main.lambda_handler(SNSEvent(event), lambda_context)

    assert result == {"status": expected_status}
    mock_http.request.assert_called_once_with(
        method="POST",
        url=test_slack_hook_url,
        body=json.dumps(
            {
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*Log group:* <https://eu-west-2.console.aws.amazon.com/cloudwatch/home?region=eu-west-2#logStream:group={log_group_name}|{log_group_name}>",
                        },
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*Matching events from the last {main.ERROR_EVENT_TIME_WINDOW} seconds*",
                        },
                    },
                    {"type": "divider"},
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*Timestamp:* {slack_message_timestamp(-1)}",
                        },
                    },
                    {
                        "type": "section",
                        "text": {"type": "mrkdwn", "text": f"*Message:* blah"},
                    },
                ]
            }
        ),
    )


@mock_logs
def test_message_when_there_is_a_matching_json_log_entry(monkeypatch, lambda_context):
    monkeypatch.setenv("SLACK_HOOK_URL", test_slack_hook_url)
    import slack_alert.slack_alert as main

    mock_http = Mock()
    monkeypatch.setattr(main, "http", mock_http)
    test_message = {
        "Trigger": {"MetricName": metric_name, "Namespace": metric_namespace},
        "AlarmName": alarm_name,
        "StateChangeTime": sns_message_time,
    }
    expected_status = 200
    mock_http.request.return_value = HTTPResponse(status=expected_status)
    event = {"Records": [{"Sns": {"Message": json.dumps(test_message)}}]}
    log_group_name = "log_group"
    main.cloudwatch.put_metric_filter(
        logGroupName=log_group_name,
        filterName="bob",
        filterPattern="",
        metricTransformations=[
            {
                "metricName": metric_name,
                "metricNamespace": metric_namespace,
                "metricValue": "jim",
            }
        ],
    )
    main.cloudwatch.create_log_group(logGroupName=log_group_name)
    main.cloudwatch.create_log_stream(
        logGroupName=log_group_name, logStreamName=log_group_name
    )
    main.cloudwatch.put_log_events(
        logGroupName=log_group_name,
        logStreamName=log_group_name,
        logEvents=[
            {
                "timestamp": log_event_timestamp(-1),
                "message": json.dumps(error_log_line),
            }
        ],
    )

    result = main.lambda_handler(SNSEvent(event), lambda_context)

    assert result == {"status": expected_status}
    extra_keys = sorted(list(error_log_line.keys()))
    expected_content_blocks = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Log group:* <https://eu-west-2.console.aws.amazon.com/cloudwatch/home?region=eu-west-2#logStream:group={log_group_name}|{log_group_name}>",
            },
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Matching events from the last {main.ERROR_EVENT_TIME_WINDOW} seconds*",
            },
        },
        {"type": "divider"},
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Timestamp:* {slack_message_timestamp(-1)}",
            },
        },
    ]
    for key in extra_keys:
        expected_content_blocks.append(
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*{key}:* {error_log_line.get(key)}",
                },
            }
        )
    mock_http.request.assert_called_once_with(
        method="POST",
        url=test_slack_hook_url,
        body=json.dumps({"blocks": expected_content_blocks}),
    )


@mock_logs
def test_message_when_there_is_a_big_matching_json_log_entry(
    monkeypatch, lambda_context
):
    monkeypatch.setenv("SLACK_HOOK_URL", test_slack_hook_url)
    import slack_alert.slack_alert as main

    mock_http = Mock()
    monkeypatch.setattr(main, "http", mock_http)
    test_message = {
        "Trigger": {"MetricName": metric_name, "Namespace": metric_namespace},
        "AlarmName": alarm_name,
        "StateChangeTime": sns_message_time,
    }
    expected_status = 200
    mock_http.request.return_value = HTTPResponse(status=expected_status)
    event = {"Records": [{"Sns": {"Message": json.dumps(test_message)}}]}
    log_group_name = "log_group"
    main.cloudwatch.put_metric_filter(
        logGroupName=log_group_name,
        filterName="bob",
        filterPattern="",
        metricTransformations=[
            {
                "metricName": metric_name,
                "metricNamespace": metric_namespace,
                "metricValue": "jim",
            }
        ],
    )
    main.cloudwatch.create_log_group(logGroupName=log_group_name)
    main.cloudwatch.create_log_stream(
        logGroupName=log_group_name, logStreamName=log_group_name
    )

    big_error_log_line = {**error_log_line}
    for i in range(50):
        big_error_log_line[str(i)] = "blah"

    main.cloudwatch.put_log_events(
        logGroupName=log_group_name,
        logStreamName=log_group_name,
        logEvents=[
            {
                "timestamp": log_event_timestamp(-1),
                "message": json.dumps(big_error_log_line),
            }
        ],
    )

    result = main.lambda_handler(SNSEvent(event), lambda_context)

    assert result == {"status": expected_status}
    extra_keys = sorted(list(big_error_log_line.keys()))
    expected_content_blocks = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Log group:* <https://eu-west-2.console.aws.amazon.com/cloudwatch/home?region=eu-west-2#logStream:group={log_group_name}|{log_group_name}>",
            },
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Matching events from the last {main.ERROR_EVENT_TIME_WINDOW} seconds*",
            },
        },
        {"type": "divider"},
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Timestamp:* {slack_message_timestamp(-1)}",
            },
        },
    ]
    for key in extra_keys:
        expected_content_blocks.append(
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*{key}:* {big_error_log_line.get(key)}",
                },
            }
        )
    if len(expected_content_blocks) > main.MAX_SLACK_CONTENT_BLOCKS:
        max_minus_one = main.MAX_SLACK_CONTENT_BLOCKS - 1
        expected_content_blocks = expected_content_blocks[:max_minus_one]
        expected_content_blocks.append(
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": "Exceeded max message length"},
            }
        )

    mock_http.request.assert_called_once_with(
        method="POST",
        url=test_slack_hook_url,
        body=json.dumps({"blocks": expected_content_blocks}),
    )


@mock_logs
def test_message_when_there_is_a_matching_json_exception_log_entry(
    monkeypatch, lambda_context
):
    monkeypatch.setenv("SLACK_HOOK_URL", test_slack_hook_url)
    import slack_alert.slack_alert as main

    mock_http = Mock()
    monkeypatch.setattr(main, "http", mock_http)
    test_message = {
        "Trigger": {"MetricName": metric_name, "Namespace": metric_namespace},
        "AlarmName": alarm_name,
        "StateChangeTime": sns_message_time,
    }
    expected_status = 200
    mock_http.request.return_value = HTTPResponse(status=expected_status)
    event = {"Records": [{"Sns": {"Message": json.dumps(test_message)}}]}
    log_group_name = "log_group"
    main.cloudwatch.put_metric_filter(
        logGroupName=log_group_name,
        filterName="bob",
        filterPattern="",
        metricTransformations=[
            {
                "metricName": metric_name,
                "metricNamespace": metric_namespace,
                "metricValue": "jim",
            }
        ],
    )
    main.cloudwatch.create_log_group(logGroupName=log_group_name)
    main.cloudwatch.create_log_stream(
        logGroupName=log_group_name, logStreamName=log_group_name
    )
    main.cloudwatch.put_log_events(
        logGroupName=log_group_name,
        logStreamName=log_group_name,
        logEvents=[
            {
                "timestamp": log_event_timestamp(-1),
                "message": json.dumps(exception_log_line),
            }
        ],
    )

    result = main.lambda_handler(SNSEvent(event), lambda_context)

    assert result == {"status": expected_status}
    extra_keys = sorted(list(exception_log_line.keys()))
    expected_content_blocks = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Log group:* <https://eu-west-2.console.aws.amazon.com/cloudwatch/home?region=eu-west-2#logStream:group={log_group_name}|{log_group_name}>",
            },
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Matching events from the last {main.ERROR_EVENT_TIME_WINDOW} seconds*",
            },
        },
        {"type": "divider"},
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Timestamp:* {slack_message_timestamp(-1)}",
            },
        },
    ]
    for key in extra_keys:
        expected_content_blocks.append(
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*{key}:* {exception_log_line.get(key)}",
                },
            }
        )
    mock_http.request.assert_called_once_with(
        method="POST",
        url=test_slack_hook_url,
        body=json.dumps({"blocks": expected_content_blocks}),
    )


@mock_logs
def test_message_when_there_are_multiple_matching_log_entries(
    monkeypatch, lambda_context
):
    monkeypatch.setenv("SLACK_HOOK_URL", test_slack_hook_url)
    import slack_alert.slack_alert as main

    mock_http = Mock()
    monkeypatch.setattr(main, "http", mock_http)
    test_message = {
        "Trigger": {"MetricName": metric_name, "Namespace": metric_namespace},
        "AlarmName": alarm_name,
        "StateChangeTime": sns_message_time,
    }
    expected_status = 200
    mock_http.request.return_value = HTTPResponse(status=expected_status)
    event = {"Records": [{"Sns": {"Message": json.dumps(test_message)}}]}
    log_group_name = "log_group"
    main.cloudwatch.put_metric_filter(
        logGroupName=log_group_name,
        filterName="bob",
        filterPattern="",
        metricTransformations=[
            {
                "metricName": metric_name,
                "metricNamespace": metric_namespace,
                "metricValue": "jim",
            }
        ],
    )
    main.cloudwatch.create_log_group(logGroupName=log_group_name)
    main.cloudwatch.create_log_stream(
        logGroupName=log_group_name, logStreamName=log_group_name
    )
    main.cloudwatch.put_log_events(
        logGroupName=log_group_name,
        logStreamName=log_group_name,
        logEvents=[
            {"timestamp": log_event_timestamp(-4), "message": "blah4"},
            {"timestamp": log_event_timestamp(-3), "message": "blah3"},
            {"timestamp": log_event_timestamp(-2), "message": "blah2"},
            {"timestamp": log_event_timestamp(-1), "message": "blah1"},
        ],
    )

    result = main.lambda_handler(SNSEvent(event), lambda_context)

    assert result == {"status": expected_status}
    mock_http.request.assert_called_once_with(
        method="POST",
        url=test_slack_hook_url,
        body=json.dumps(
            {
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*Log group:* <https://eu-west-2.console.aws.amazon.com/cloudwatch/home?region=eu-west-2#logStream:group={log_group_name}|{log_group_name}>",
                        },
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*Matching events from the last {main.ERROR_EVENT_TIME_WINDOW} seconds*",
                        },
                    },
                    {"type": "divider"},
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*Timestamp:* {slack_message_timestamp(-1)}",
                        },
                    },
                    {
                        "type": "section",
                        "text": {"type": "mrkdwn", "text": f"*Message:* blah1"},
                    },
                    {"type": "divider"},
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*Timestamp:* {slack_message_timestamp(-2)}",
                        },
                    },
                    {
                        "type": "section",
                        "text": {"type": "mrkdwn", "text": f"*Message:* blah2"},
                    },
                    {"type": "divider"},
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*Timestamp:* {slack_message_timestamp(-3)}",
                        },
                    },
                    {
                        "type": "section",
                        "text": {"type": "mrkdwn", "text": f"*Message:* blah3"},
                    },
                ]
            }
        ),
    )


@mock_logs
def test_message_does_not_get_events_outside_range(monkeypatch, lambda_context):
    monkeypatch.setenv("SLACK_HOOK_URL", test_slack_hook_url)
    import slack_alert.slack_alert as main

    mock_http = Mock()
    monkeypatch.setattr(main, "http", mock_http)
    test_message = {
        "Trigger": {"MetricName": metric_name, "Namespace": metric_namespace},
        "AlarmName": alarm_name,
        "StateChangeTime": sns_message_time,
    }
    expected_status = 200
    mock_http.request.return_value = HTTPResponse(status=expected_status)
    event = {"Records": [{"Sns": {"Message": json.dumps(test_message)}}]}
    log_group_name = "log_group"
    main.cloudwatch.put_metric_filter(
        logGroupName=log_group_name,
        filterName="bob",
        filterPattern="",
        metricTransformations=[
            {
                "metricName": metric_name,
                "metricNamespace": metric_namespace,
                "metricValue": "jim",
            }
        ],
    )
    main.cloudwatch.create_log_group(logGroupName=log_group_name)
    main.cloudwatch.create_log_stream(
        logGroupName=log_group_name, logStreamName=log_group_name
    )
    main.cloudwatch.put_log_events(
        logGroupName=log_group_name,
        logStreamName=log_group_name,
        logEvents=[
            {
                "timestamp": log_event_timestamp(
                    (main.ERROR_EVENT_TIME_WINDOW + 1) * -1
                ),
                "message": "blah1",
            },
            {"timestamp": log_event_timestamp(0), "message": "blah2"},
            {"timestamp": log_event_timestamp(1), "message": "blah3"},
        ],
    )

    result = main.lambda_handler(SNSEvent(event), lambda_context)

    assert result == {"status": expected_status}
    mock_http.request.assert_called_once_with(
        method="POST",
        url=test_slack_hook_url,
        body=json.dumps(
            {
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*Log group:* <https://eu-west-2.console.aws.amazon.com/cloudwatch/home?region=eu-west-2#logStream:group={log_group_name}|{log_group_name}>",
                        },
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*Matching events from the last {main.ERROR_EVENT_TIME_WINDOW} seconds*",
                        },
                    },
                    {"type": "divider"},
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*Timestamp:* {slack_message_timestamp(0)}",
                        },
                    },
                    {
                        "type": "section",
                        "text": {"type": "mrkdwn", "text": f"*Message:* blah2"},
                    },
                ]
            }
        ),
    )
