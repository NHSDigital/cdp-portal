import pytest

from portal_banner.reset_notice_values import reset_notice_values


@pytest.mark.parametrize(
    "action_input, expected_output",
    [
        ("notification", [None, "red", "2023-06-15 15:00:00", "2023-06-15 17:00:00"]),
        (
            "colour",
            ["Test Notification", None, "2023-06-15 15:00:00", "2023-06-15 17:00:00"],
        ),
        ("start_period", ["Test Notification", "red", None, "2023-06-15 17:00:00"]),
        ("expiry_period", ["Test Notification", "red", "2023-06-15 15:00:00", None]),
    ],
)
def test_reset_notice_values(action_input, expected_output):
    notification = "Test Notification"
    colour = "red"
    start_period = 1686837600
    expiry_period = 1686844800

    outputs = reset_notice_values(
        action_input, notification, colour, start_period, expiry_period
    )

    assert outputs == expected_output
