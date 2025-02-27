def check_dynamodb_permissions(ddb) -> None:
    """
    Tries to call on the dynamodb table to see if the user can access the dynamodb.
    """
    try:
        ddb.describe_table(TableName="Notices")
    except Exception:
        error_msg = "You are unable to interact with this table. Do you have the right permissions?"
        raise Exception(error_msg)
