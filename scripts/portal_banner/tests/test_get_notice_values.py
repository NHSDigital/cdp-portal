import pytest
import unittest.mock as mock

from freezegun import freeze_time

import portal_banner.get_notice_values as notice
from tests.helpers.utils import capture_outputs


class TestGetNotification:
    expected_output = "Test Notification"

    def test_takes_notification_argument(self):
        input = "Test Notification"
        assert notice.get_notification(input) == self.expected_output

    def test_takes_notification_from_console(self):
        console_inputs = ["Test Notification", "y"]
        with mock.patch("builtins.input", side_effect=console_inputs):
            assert notice.get_notification(None) == self.expected_output

    def test_change_initial_console_input_with_another_console_input(self):
        console_inputs = ["Test Notificaaation", "n", "Test Notification", "y"]

        with mock.patch("builtins.input", side_effect=console_inputs):
            assert notice.get_notification(None) == self.expected_output


class TestGetColour:
    @pytest.mark.parametrize(
        "colour_input, expected",
        [("red", "red"), ("blue", "blue"), ("yellow", "yellow")],
    )
    def test_takes_valid_colour_argument(self, colour_input, expected):
        assert notice.get_colour(colour_input) == expected

    @pytest.mark.parametrize(
        "colour_input, expected",
        [("red", "red"), ("blue", "blue"), ("yellow", "yellow")],
    )
    def test_takes_colour_from_console(self, colour_input, expected):
        with mock.patch(
            "portal_banner.get_notice_values.inquirer.prompt",
            return_value={"colour": colour_input},
        ):
            assert notice.get_colour(None) == expected

    def test_takes_colour_from_console_when_given_invalid_colour(self):
        with mock.patch(
            "portal_banner.get_notice_values.inquirer.prompt",
            return_value={"colour": "red"},
        ):
            assert notice.get_colour("green") == "red"


class TestGetStartPeriod:
    valid_input = "2023-06-15 15:00:00"
    expected_valid_output = 1686837600
    invalid_input = "tea"
    time_invalid_input = "2023-06-15 08:30:00"

    @freeze_time("2023-06-15 09:30:00")
    def test_takes_start_period_argument(self):
        assert notice.get_start_period(self.valid_input) == self.expected_valid_output

    @freeze_time("2023-06-15 09:30:00")
    def test_takes_start_period_from_console(self):
        console_inputs = [self.valid_input, "y"]
        with mock.patch("builtins.input", side_effect=console_inputs):
            assert notice.get_start_period(None) == self.expected_valid_output

    @freeze_time("2023-06-15 09:30:00")
    def test_error_if_start_period_is_non_parsable(self):
        console_inputs = [self.invalid_input, self.valid_input, "y"]
        with mock.patch("builtins.input", side_effect=console_inputs):
            args = [None]
            captured_output = capture_outputs(notice.get_start_period, args, 1)
            assert (
                captured_output
                == "This could not be converted into a date by the dateparser package"
            )

    @freeze_time("2023-06-15 09:30:00")
    def test_error_if_start_period_is_before_current_time(self):
        console_inputs = [self.time_invalid_input, self.valid_input, "y"]
        with mock.patch("builtins.input", side_effect=console_inputs):
            args = [None]
            captured_output = capture_outputs(notice.get_start_period, args, 1)
            assert (
                captured_output
                == "The start date provided occurs before the current time"
            )


class TestGetExpiryPeriod:
    start_period = 1686837600
    valid_input = "2023-06-15 17:00:00"
    expected_valid_output = 1686844800
    invalid_input = "tea"
    time_invalid_input = "2023-06-15 08:30:00"

    @freeze_time("2023-06-15 09:30:00")
    def test_expiry_period_argument_input(self):
        assert (
            notice.get_expiry_period(self.start_period, self.valid_input)
            == self.expected_valid_output
        )

    @freeze_time("2023-06-15 09:30:00")
    def test_expiry_period_console_input(self):
        console_inputs = ["2023-06-15 17:22:00", "n", self.valid_input, "y"]
        with mock.patch("builtins.input", side_effect=console_inputs):
            assert (
                notice.get_expiry_period(self.start_period, None)
                == self.expected_valid_output
            )

    @freeze_time("2023-06-15 09:30:00")
    def test_error_if_expiry_period_is_non_parsable(self):
        console_inputs = [self.invalid_input, self.valid_input, "y"]
        with mock.patch("builtins.input", side_effect=console_inputs):
            args = [self.start_period, None]
            captured_output = capture_outputs(notice.get_expiry_period, args, 1)
            assert (
                captured_output
                == "This could not be converted into a date by the dateparser package"
            )

    @freeze_time("2023-06-15 09:30:00")
    def test_error_if_expiry_period_is_before_start_period(self):
        console_inputs = [self.time_invalid_input, self.valid_input, "y"]
        with mock.patch("builtins.input", side_effect=console_inputs):
            args = [self.start_period, None]
            captured_output = capture_outputs(notice.get_expiry_period, args, 1)
            assert (
                captured_output
                == "Please give an expiry date that occurs after the start date."
            )
