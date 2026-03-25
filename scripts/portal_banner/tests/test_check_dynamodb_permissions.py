from unittest.mock import Mock

import pytest
from moto import mock_aws

from portal_banner.check_dynamodb_permissions import check_dynamodb_permissions
from tests.helpers.utils import create_mock_dynamodb_table


@mock_aws
def test_returns_none_when_ddb_exists():
    ddb = create_mock_dynamodb_table()
    assert check_dynamodb_permissions(ddb) is None


@mock_aws
def test_returns_error_with_no_permissions():
    ddb = Mock()
    ddb.describe_table.side_effect = Exception("AccessDenied")
    with pytest.raises(Exception) as err:
        check_dynamodb_permissions(ddb)
    assert (
        str(err.value)
        == "You are unable to interact with this table. Do you have the right permissions?"
    )
