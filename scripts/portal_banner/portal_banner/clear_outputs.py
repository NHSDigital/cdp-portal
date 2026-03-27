from os import name, system


def clear():
    """
    Clears outputs in the terminal
    """
    system_is_windows = name == "nt"
    if system_is_windows:
        # Only ever ran by dev locally so not security concern
        system("cls")  # nosec

    # Mac and Linux
    else:
        # Only ever ran by dev locally so not security concern
        system("clear")  # nosec
