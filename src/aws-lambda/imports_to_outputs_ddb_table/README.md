# imports_to_outputs_ddb_table

This lambda is basically triggered by DDB Streams enabled on the table Imports. This lambda will be triggered on two events, these events are mentioend below.
```
    INSERT
    MODIFY
```
When an item is INSERTed to Imports DDB table, this lambda will be triggered. It will create a new item in the Outputs table in Orchestration AWS Lambda Account. The ID generated in the Outputs table for the new item will be added to the Imports table by this lambda to the specific record with the attribute name "outputsId".

When an item is MODIFY(i)ed in the Imports DDB table, this lambda will be triggered. It will update the Outputs table with the latest status of the item.


## Unit Testing
Run following command from "test" directory to execute unit test scripts
``` pytest test_imports_to_outputs_ddb_table.py ```
