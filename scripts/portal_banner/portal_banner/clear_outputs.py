from os import system, name


def clear():
    """
    Clears outputs in the terminal
    """
    system_is_windows = name == "nt"
    if system_is_windows:
        system("cls")

    # Mac and Linux
    else:
        system("clear")
