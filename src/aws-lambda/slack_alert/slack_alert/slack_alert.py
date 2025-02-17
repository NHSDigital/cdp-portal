import json
import os
from datetime import timedelta, datetime
from json import JSONDecodeError
from typing import Dict, Any

import boto3
import urllib3
from aws_lambda_powertools import Logger
from aws_lambda_powertools.utilities.data_classes import event_source, SNSEvent
from aws_lambda_powertools.utilities.typing import LambdaContext

INITIAL_MESSAGE = "Successfully validated SNS topic for Amazon SES event publishing."

SLACK_HOOK_URL = os.getenv("SLACK_HOOK_URL")
AWS_REGION = os.getenv("AWS_REGION", "eu-west-2")
ERROR_EVENT_TIME_WINDOW = 30
MAX_SLACK_CONTENT_BLOCKS = 50

logger = Logger()
http = urllib3.PoolManager()
cloudwatch = boto3.client("logs", region_name="eu-west-2")


def create_markdown_text_section(markdown_text: str):
    return {"type": "section", "text": {"type": "mrkdwn", "text": markdown_text}}


@event_source(data_class=SNSEvent)
@logger.inject_lambda_context(clear_state=True)
def lambda_handler(event: SNSEvent, context: LambdaContext) -> Dict[str, Any]:
    sns_message = json.loads(event.sns_message)
    logger.append_keys(sns_message=sns_message)

    if sns_message == INITIAL_MESSAGE:
        logger.info("Sns validation event, no action required.")
        return {"message": "Sns validation event, no action required."}

    logger.info("Sending error details to slack")

    content = create_message_content(sns_message)
    if len(content) > MAX_SLACK_CONTENT_BLOCKS:
        max_minus_one = MAX_SLACK_CONTENT_BLOCKS - 1
        content = content[:max_minus_one]
        content.append(create_markdown_text_section(f"Exceeded max message length"))

    post_content = {"blocks": content}
    logger.info("Posting message to Slack")

    response = http.request(
        method="POST", url=SLACK_HOOK_URL, body=json.dumps(post_content)
    )
    logger.append_keys(slack_response_status=response.status)

    if response.status != 200:
        logger.info("Unexpected response from slack, bailing")
        raise Exception("Post to slack failed")

    logger.info("Successfully notified slack")

    return {"status": response.status}


def create_message_content(sns_message):
    if sns_message.get("detail-type") == "ECS Task State Change":
        return create_ecs_state_change_message(sns_message)

    logger.info("Getting metric filter details")
    trigger = sns_message.get("Trigger", {})
    try:
        metric_filter_descriptions = cloudwatch.describe_metric_filters(
            metricNamespace=trigger.get("Namespace"),
            metricName=trigger.get("MetricName"),
        )
        metric_filters = metric_filter_descriptions.get("metricFilters")
    except Exception:
        logger.info("Found no metric filters, continuing for now...")
        metric_filters = []

    if not metric_filters:
        logger.info(f"Could not find metric filter for trigger {trigger}")
        alarm_name = sns_message.get("AlarmName")
        alarm_description = sns_message.get("AlarmDescription")
        time = sns_message.get("StateChangeTime")
        reason = sns_message.get("NewStateReason")

        content = [
            create_markdown_text_section(f"*Alarm name:* {alarm_name}"),
            create_markdown_text_section(f"*Alarm description:* {alarm_description}"),
            create_markdown_text_section(f"*Time:* {time}"),
            create_markdown_text_section(f"*Reason:* {reason}"),
        ]

        if not trigger:
            return content

        namespace = trigger.get("Namespace")
        metric_name = trigger.get("MetricName")
        dimensions = trigger.get("Dimensions")
        dimension_name = dimensions[0].get("name")
        dimension_value = dimensions[0].get("value")

        content += [
            create_markdown_text_section(f"*Namespace:* {namespace}"),
            create_markdown_text_section(f"*{dimension_name}:* {dimension_value}"),
            create_markdown_text_section(f"*Metric name:* {metric_name}"),
        ]
        return content

    metric_filter = metric_filters[0]
    log_group_name = metric_filter.get("logGroupName")
    log_group_url = f"https://{AWS_REGION}.console.aws.amazon.com/cloudwatch/home?region={AWS_REGION}#logStream:group={log_group_name}|{log_group_name}"
    content = [create_markdown_text_section(f"*Log group:* <{log_group_url}>")]

    logger.info(f"Getting log events preceding alarm")
    sns_message_time = sns_message.get("StateChangeTime")
    filter_pattern = metric_filter.get("filterPattern")
    end_time = datetime.strptime(sns_message_time, "%Y-%m-%dT%H:%M:%S.%f%z")
    start_time = end_time - timedelta(seconds=ERROR_EVENT_TIME_WINDOW)
    logger.info(
        f"Getting matching events from {log_group_name} for the last {ERROR_EVENT_TIME_WINDOW} seconds"
    )
    try:
        log_events = cloudwatch.filter_log_events(
            logGroupName=log_group_name,
            filterPattern=filter_pattern,
            startTime=int(start_time.timestamp() * 1000),
            endTime=int(end_time.timestamp() * 1000),
        )
        events = log_events.get("events", [])
    except Exception:
        logger.exception("Error getting log entries, continuing for now...")
        events = []

    if not events:
        logger.info(f"Could not find matching log entries")
        content += [
            create_markdown_text_section("*Could not find matching log entries*")
        ]
        return content

    content += [
        create_markdown_text_section(
            f"*Matching events from the last {ERROR_EVENT_TIME_WINDOW} seconds*"
        )
    ]
    for event in events[::-1][:3]:  # Get the latest 3 events
        timestamp = event.get("timestamp")
        timestamp = datetime.utcfromtimestamp(timestamp / 1000).isoformat()
        content += [
            {"type": "divider"},
            create_markdown_text_section(f"*Timestamp:* {timestamp}"),
        ]
        message = event.get("message")
        try:
            message = json.loads(message)
            content += [
                create_markdown_text_section(f"*{key}:* {value}")
                for key, value in sorted(message.items())
            ]
        except JSONDecodeError:
            content += [create_markdown_text_section(f"*Message:* {message}")]
    return content


def create_ecs_state_change_message(sns_message):
    detail_type = sns_message["detail-type"]
    group = sns_message["detail"]["group"]
    desired_status = sns_message["detail"]["desiredStatus"]
    stopped_reason = sns_message["detail"]["stoppedReason"]

    return [
        create_markdown_text_section(f"*Detail:* {detail_type}"),
        create_markdown_text_section(f"*Group:* {group}"),
        create_markdown_text_section(f"*Desired Status:* {desired_status}"),
        create_markdown_text_section(f"*Reason:* {stopped_reason}"),
    ]
