import json
import sys
from os import path
import time

import boto3

from portal_banner.clear_outputs import clear
from portal_banner.check_output_with_user import check_output
from portal_banner.reset_notice_values import reset_notice_values
from portal_banner.check_dynamodb_permissions import check_dynamodb_permissions
from portal_banner.get_notice_values import (
    get_notification,
    get_colour,
    get_expiry_period,
    get_start_period,
)


def add_portal_banner_notification(portal_args: dict) -> None:
    """
    Adds a notification item to the Notices DyanamoDB with information on the markdown text
    to be used, start period, expiry period, and colour.

    Parameters
    ----------
    portal_args: dict
        A dictionary containing the values for start_period, expiry_period, colour, and
        notification.

    """

    ddb = boto3.client("dynamodb", region_name="eu-west-2")

    check_dynamodb_permissions(ddb)

    notification = portal_args.get("notification")
    colour = portal_args.get("colour")
    start_period = portal_args.get("start_period")
    expiry_period = portal_args.get("expiry_period")
    action = None
    notice_id = f"noticeId_{int(round(time.time()))}"

    clear()

    while (
        notification is None
        or colour is None
        or start_period is None
        or expiry_period is None
        or action is None
    ):
        notification = get_notification(notification)
        colour = get_colour(colour)
        start_period = get_start_period(start_period)
        expiry_period = get_expiry_period(start_period, expiry_period)
        action = check_output(notification, colour, start_period, expiry_period)

        if action.startswith("Update"):
            arg_name = action.split()[1]
            (notification, colour, start_period, expiry_period) = reset_notice_values(
                arg_name, notification, colour, start_period, expiry_period
            )
        elif action.startswith("Add"):
            ddb.put_item(
                TableName="Notices",
                Item={
                    "noticeId": {"S": notice_id},
                    "notification": {"S": notification},
                    "startPeriod": {"N": str(start_period)},
                    "expiryPeriod": {"N": str(expiry_period)},
                    "colour": {"S": colour},
                },
            )
        else:
            pass


def load_notices_from_json(json_path):
    """
    Get's a list of JSON objects for each portal banner
    you want to add.
    """
    notice_list = []

    if path.exists(json_path):
        with open(json_path, "r") as f:
            notice_list = json.load(f)

    return notice_list


def main(json_path):
    """
    Generates a list of notice objects and obtains these from a .json and
    interactively using the user interface. Then these are iteratively added to
    a dynamodb.
    """

    notice_list = load_notices_from_json(json_path)

    if len(notice_list) == 0:
        notice_list.append({})

    for notice in notice_list:
        add_portal_banner_notification(notice)


if __name__ == "__main__":
    json_path = f"{path.dirname(__file__)}/notice.json"
    main(json_path)
