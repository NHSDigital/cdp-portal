import inquirer
import datetime

from portal_banner.clear_outputs import clear


def check_output(
    notification: str, colour: str, start_period: int, expiry_period: int
) -> str:
    """
    Asks the users if the output is correct and returns true.

    Parameters
    ----------
    notification: string
        Can be a string provided of markdown text or none depending on whether
        the variable has been given.
    colour: string
        A string of the colour the user would like the banner to be
        or none depending on whether the variable has been given.
    start_period: integer
        A number that represents the epoch for when the notification needs to be displayed from.
    expiry_period: str
        A number that represents the epoch for when you want the notification removed.

    Returns
    -------
    action: string
        A string that defines on whether to add the portal banner defined or update a certain value.

    """

    portal_args = {
        "notification": notification,
        "colour": colour,
        "start_period": datetime.datetime.fromtimestamp(start_period),
        "expiry_period": datetime.datetime.fromtimestamp(expiry_period),
    }

    print(f"This is the output we received: \n\n{portal_args}\n\n")

    action_options = [
        "Add banner to DynamoDB",
        "Skip this banner",
        "Update notification",
        "Update colour",
        "Update start_period",
        "Update expiry_period",
    ]

    action_inquire = [
        inquirer.List(
            "action", message="What would you like to do:", choices=action_options
        )
    ]
    action_response = inquirer.prompt(action_inquire)
    action = action_response.get("action")

    clear()

    return action
