import time

import dateparser
import inquirer
import datetime

from portal_banner.clear_outputs import clear


def get_notification(notification: str) -> str:
    """
    Allows a user to generate a notification if none is provided.

    Parameters
    ----------
    notification: string
        Can be a string provided of markdown text or none depending on whether
        the variable has been given.

    Returns
    -------
    notification: string
        A string of markdown text that can be converted to html.

    """

    while notification is None:
        print("What would you like the portal banner to say?")
        notification = input()

        print(
            f"\nThis was the banner provided: \n\n'{notification}' \n\n Is this correct?(y/n/esc)"
        )
        check_notification = input().lower()
        if check_notification != "y":
            notification = None
            clear()

    clear()

    return notification


def get_colour(colour: str) -> str:
    """
    Allows a user to pick a colour if none is provided.

    Parameters
    ----------
    colour: string
        A string of the colour the user would like the banner to be
        or none depending on whether the variable has been given.

    Returns
    -------
    colour: string
        A string of a valid colour given in the colour list.

    """
    colour_list = ["blue", "red", "yellow"]

    if (colour not in colour_list) and (colour is not None):
        print("The colour given is not valid, please pick a new colour!")
        colour = None

    if colour is None:
        colour_inquire = [
            inquirer.List(
                "colour",
                message="What colour do you want the banner?",
                choices=colour_list,
            )
        ]
        colour_response = inquirer.prompt(colour_inquire)

        colour = colour_response.get("colour")

    clear()

    return colour


def get_start_period(start_period: str) -> int:
    """
    User supplies a string and this can be given in a date format and this
    is converted into epochs.

    Parameters
    ----------
    start_period: string
        A string to represent a date of when we want the notification displayed from.

    Returns
    -------
    start_period: integer
        A number that represents the epoch for when the notification needs to be displayed from.

    """

    if start_period is not None:
        current_time = datetime.datetime.now()
        start_period = dateparser.parse(start_period, languages=["en"])

    if start_period is not None:
        if start_period <= current_time:
            print("The start date provided occurs before the current time")
            start_period = None

    while start_period is None:
        print("When would you like the notification to start being displayed?")
        current_time = datetime.datetime.now()
        start_period = dateparser.parse(input(), languages=["en"])

        if start_period is None:
            print("This could not be converted into a date by the dateparser package")
        elif start_period <= current_time:
            clear()
            print("The start date provided occurs before the current time")
            start_period = None
        else:
            print(
                f"\nThis was the start date provided: \n\n'{start_period}' \n\n Is this correct?(y/n)"
            )
            check_start_date = input().lower()
            if check_start_date != "y":
                start_period = None
                clear()

    start_period = int(time.mktime(start_period.timetuple()))

    clear()

    return start_period


def get_expiry_period(start_period: int, expiry_period: str) -> int:
    """
    Allows a user to generate an expiry period if none is provided.

    Parameters
    ----------
    start_period: integer
        A number that represents the epoch for when the notification needs to be displayed from.
    expiry_period: str
        A string of a date to be converted into an epoch integer.

    Returns
    -------
    expiry_period: integer
        A number that represents the epoch for when the notification needs to be removed.

    """
    start_date = datetime.datetime.fromtimestamp(start_period)

    if expiry_period is not None:
        expiry_period = dateparser.parse(expiry_period, languages=["en"])

    if expiry_period is not None:
        if expiry_period <= start_date:
            print("Please give an expiry date that occurs after the start date.")
            expiry_period = None

    while expiry_period is None:
        print("When would you like the notification removed?")
        expiry_period = dateparser.parse(input(), languages=["en"])

        if expiry_period is None:
            print("This could not be converted into a date by the dateparser package")
        elif expiry_period <= start_date:
            clear()
            print("Please give an expiry date that occurs after the start date.")
            print(f"\n\n'{start_date} - {expiry_period}'\n\n")
            expiry_period = None
        else:
            print(
                f"\nThis banner will be displayed from: \n\n'{start_date} - {expiry_period}' \n\n Is this correct?(y/n)"
            )
            check_expiry_date = input().lower()
            if check_expiry_date != "y":
                expiry_period = None
                clear()

    expiry_period = int(time.mktime(expiry_period.timetuple()))

    clear()

    return expiry_period
