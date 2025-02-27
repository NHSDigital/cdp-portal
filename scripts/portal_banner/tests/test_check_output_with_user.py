import pytest
import unittest.mock as mock
from portal_banner.check_output_with_user import check_output


@pytest.mark.parametrize(
    "action_input, expected_output",
    [
        ("Add banner to DynamoDB", "Add banner to DynamoDB"),
        ("Skip this banner", "Skip this banner"),
        ("Update notification", "Update notification"),
        ("Update colour", "Update colour"),
        ("Update start_period", "Update start_period"),
        ("Update expiry_period", "Update expiry_period"),
    ],
)
def test_check_output(action_input, expected_output):
    notification = "Test Notification"
    colour = "red"
    start_period = 1686837600
    expiry_period = 1686844800

    with mock.patch(
        "portal_banner.get_notice_values.inquirer.prompt",
        return_value={"action": action_input},
    ):
        assert (
            check_output(notification, colour, start_period, expiry_period)
            == expected_output
        )
