import json

from moto import mock_dynamodb
from unittest.mock import patch, Mock
from freezegun import freeze_time

import portal_banner.add_portal_banner_notification as portal_banner
from tests.helpers.utils import create_mock_dynamodb_table, create_temp_json_with_notice


class TestAddPortalBannerNotification:
    notice = {
        "notification": "Test Notification",
        "colour": "red",
        "start_period": "2023-06-15 15:00:00",
        "expiry_period": "2023-06-15 17:00:00",
    }

    @freeze_time("2023-06-15 09:30:00")
    @mock_dynamodb
    @patch(
        "portal_banner.get_notice_values.inquirer.prompt",
        Mock(return_value={"action": "Add banner to DynamoDB"}),
    )
    def test_adding_notice_to_ddb(self):
        ddb_client = create_mock_dynamodb_table()
        portal_banner.add_portal_banner_notification(self.notice)
        response = ddb_client.scan(TableName="Notices")["Items"]
        assert len(response) == 1
        assert response[0].get("notification").get("S") == "Test Notification"

    @freeze_time("2023-06-15 09:30:00")
    @mock_dynamodb
    @patch(
        "portal_banner.get_notice_values.inquirer.prompt",
        Mock(return_value={"action": "Skip this banner"}),
    )
    def test_skips_adding_notice_to_ddb(self):
        ddb_client = create_mock_dynamodb_table()
        portal_banner.add_portal_banner_notification(self.notice)
        response = ddb_client.scan(TableName="Notices")["Items"]
        assert len(response) == 0

    @freeze_time("2023-06-15 09:30:00")
    @mock_dynamodb
    @patch(
        "portal_banner.get_notice_values.inquirer.prompt",
        Mock(
            side_effect=[
                {"action": "Update notification"},
                {"action": "Add banner to DynamoDB"},
            ]
        ),
    )
    @patch("builtins.input", Mock(side_effect=["Test Notification Two", "y"]))
    def test_update_notification_to_ddb_notice(self):
        ddb_client = create_mock_dynamodb_table()
        portal_banner.add_portal_banner_notification(self.notice)
        response = ddb_client.scan(TableName="Notices")["Items"]
        assert len(response) == 1
        assert response[0].get("notification").get("S") == "Test Notification Two"

    @freeze_time("2023-06-15 09:30:00")
    @mock_dynamodb
    @patch(
        "portal_banner.get_notice_values.inquirer.prompt",
        Mock(
            side_effect=[
                {"action": "Update colour"},
                {"colour": "blue"},
                {"action": "Add banner to DynamoDB"},
            ]
        ),
    )
    def test_update_colour_to_ddb_notice(self):
        ddb_client = create_mock_dynamodb_table()
        portal_banner.add_portal_banner_notification(self.notice)
        response = ddb_client.scan(TableName="Notices")["Items"]
        assert len(response) == 1
        assert response[0].get("colour").get("S") == "blue"

    @freeze_time("2023-06-15 09:30:00")
    @mock_dynamodb
    @patch(
        "portal_banner.get_notice_values.inquirer.prompt",
        Mock(
            side_effect=[
                {"action": "Update start_period"},
                {"action": "Add banner to DynamoDB"},
            ]
        ),
    )
    @patch("builtins.input", Mock(side_effect=["2023-06-15 13:00:00", "y"]))
    def test_update_start_period_to_ddb_notice(self):
        ddb_client = create_mock_dynamodb_table()
        portal_banner.add_portal_banner_notification(self.notice)
        response = ddb_client.scan(TableName="Notices")["Items"]
        assert len(response) == 1
        assert response[0].get("startPeriod").get("N") == "1686830400"

    @freeze_time("2023-06-15 09:30:00")
    @mock_dynamodb
    @patch(
        "portal_banner.get_notice_values.inquirer.prompt",
        Mock(
            side_effect=[
                {"action": "Update expiry_period"},
                {"action": "Add banner to DynamoDB"},
            ]
        ),
    )
    @patch("builtins.input", Mock(side_effect=["2023-06-15 18:00:00", "y"]))
    def test_update_expiry_period_to_ddb_notice(self):
        ddb_client = create_mock_dynamodb_table()
        portal_banner.add_portal_banner_notification(self.notice)
        response = ddb_client.scan(TableName="Notices")["Items"]
        assert len(response) == 1
        assert response[0].get("expiryPeriod").get("N") == "1686848400"


class TestAddsNoticesFromJson:
    notice = {
        "notification": "Test Notification",
        "colour": "red",
        "start_period": "2023-06-15 15:00:00",
        "expiry_period": "2023-06-15 17:00:00",
    }

    notice_2 = {
        "notification": "Test Notification Two",
        "colour": "blue",
        "start_period": "2023-06-15 15:00:00",
        "expiry_period": "2023-06-15 17:00:00",
    }

    def test_adds_one_notice_from_json(self, tmpdir):
        expected_output = [self.notice]

        f = tmpdir.mkdir("json_folder").join("notice.json")

        json_object = json.dumps(expected_output, indent=4)

        f.write(json_object)

        result = portal_banner.load_notices_from_json(f)

        assert result == expected_output

    def test_adds_two_notices_from_json(self, tmpdir):
        expected_output = [self.notice, self.notice_2]

        f = tmpdir.mkdir("json_folder").join("notice.json")

        json_object = json.dumps(expected_output, indent=4)

        f.write(json_object)

        result = portal_banner.load_notices_from_json(f)

        assert result == expected_output


class TestMain:
    notice = {
        "notification": "Test Notification",
        "colour": "red",
        "start_period": "2023-06-15 15:00:00",
        "expiry_period": "2023-06-15 17:00:00",
    }

    notice_output = {
        "noticeId": {"S": "noticeId_1686821400"},
        "notification": {"S": "Test Notification"},
        "startPeriod": {"N": "1686837600"},
        "expiryPeriod": {"N": "1686844800"},
        "colour": {"S": "red"},
    }

    @freeze_time("2023-06-15 09:30:00")
    @mock_dynamodb
    @patch("portal_banner.clear_outputs.system", Mock(return_value=None))
    @patch(
        "portal_banner.get_notice_values.inquirer.prompt",
        Mock(side_effect=[{"action": "Add banner to DynamoDB"}]),
    )
    def test_one_notice_adds_from_json(self, tmpdir):
        input = [self.notice]

        f = create_temp_json_with_notice(tmpdir, input)

        ddb_client = create_mock_dynamodb_table()
        portal_banner.main(f)
        result = ddb_client.scan(TableName="Notices")["Items"][0]

        assert result == self.notice_output

    @freeze_time("2023-06-15 09:30:00")
    @mock_dynamodb
    @patch("portal_banner.clear_outputs.system", Mock(return_value=None))
    @patch(
        "portal_banner.get_notice_values.inquirer.prompt",
        Mock(side_effect=[{"colour": "red"}, {"action": "Add banner to DynamoDB"}]),
    )
    def test_invalid_colour_and_update_from_json(self, tmpdir):
        invalid_colour_notice = {**self.notice.copy(), "colour": "green"}
        input = [invalid_colour_notice]

        f = create_temp_json_with_notice(tmpdir, input)

        ddb_client = create_mock_dynamodb_table()
        portal_banner.main(f)
        result = ddb_client.scan(TableName="Notices")["Items"][0]

        assert result == self.notice_output

    @freeze_time("2023-06-15 09:30:00")
    @mock_dynamodb
    @patch("portal_banner.clear_outputs.system", Mock(return_value=None))
    @patch(
        "portal_banner.get_notice_values.inquirer.prompt",
        Mock(side_effect=[{"action": "Add banner to DynamoDB"}]),
    )
    @patch("builtins.input", Mock(side_effect=["2023-06-15 15:00:00", "y"]))
    def test_start_period_before_current_time_and_update_from_json(self, tmpdir):
        invalid_start_period_notice = {
            **self.notice.copy(),
            "start_period": "2023-06-15 08:30:00",
        }
        input = [invalid_start_period_notice]

        f = create_temp_json_with_notice(tmpdir, input)

        ddb_client = create_mock_dynamodb_table()
        portal_banner.main(f)
        result = ddb_client.scan(TableName="Notices")["Items"][0]

        assert result == self.notice_output

    @freeze_time("2023-06-15 09:30:00")
    @mock_dynamodb
    @patch("portal_banner.clear_outputs.system", Mock(return_value=None))
    @patch(
        "portal_banner.get_notice_values.inquirer.prompt",
        Mock(side_effect=[{"action": "Add banner to DynamoDB"}]),
    )
    @patch("builtins.input", Mock(side_effect=["2023-06-15 17:00:00", "y"]))
    def test_expiry_period_before_start_period_and_update_from_json(self, tmpdir):
        invalid_start_period_notice = {
            **self.notice.copy(),
            "expiry_period": "2023-06-15 13:00:00",
        }
        input = [invalid_start_period_notice]

        f = create_temp_json_with_notice(tmpdir, input)

        ddb_client = create_mock_dynamodb_table()
        portal_banner.main(f)
        result = ddb_client.scan(TableName="Notices")["Items"][0]

        assert result == self.notice_output
