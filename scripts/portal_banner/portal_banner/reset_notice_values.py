import datetime


def reset_notice_values(
    arg_name: str, notification: str, colour: str, start_period: int, expiry_period: int
) -> list:
    """
    Resets notification, colour, start_period, or expiry_period to none depending on
    the string given in the arg name.

    Parameters
    ----------
    arg_name: string
        The name of the argument we want to reset to none.
    notification: string
        Can be a string provided of markdown text or none depending on whether
        the variable has been given.
    colour: string
        A string of the colour the user would like the banner to be
        or none depending on whether the variable has been given.
    start_period: integer
        A number that represents the epoch for when the notification needs to be displayed from.
    expiry_period: integer
        A number that represents the epoch for when you want the notification removed.

    Returns
    -------
    list
        A list of the values given to notification, colour, start_period, and expiry_period.


    """

    if arg_name == "notification":
        notification = None
        start_period = str(datetime.datetime.fromtimestamp(start_period))
        expiry_period = str(datetime.datetime.fromtimestamp(expiry_period))
    elif arg_name == "colour":
        colour = None
        start_period = str(datetime.datetime.fromtimestamp(start_period))
        expiry_period = str(datetime.datetime.fromtimestamp(expiry_period))
    elif arg_name == "start_period":
        start_period = None
        expiry_period = str(datetime.datetime.fromtimestamp(expiry_period))
    elif arg_name == "expiry_period":
        expiry_period = None
        start_period = str(datetime.datetime.fromtimestamp(start_period))
    else:
        pass

    return [notification, colour, start_period, expiry_period]
