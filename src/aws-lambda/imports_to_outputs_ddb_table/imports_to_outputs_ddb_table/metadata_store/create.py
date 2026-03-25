from .metadata_item import MetadataItem
from .output_write import get_next_id
from datetime import datetime
from os import environ


def create_metadata(item):
    fast_track = item.get("fastTrack", False)

    metadata_item = MetadataItem(
        id=get_next_id() if "outputsId" not in item else item.get("outputsId"),
        request_type="IMPORT",
        data_sharing_agreement=item.get("agreementName"),
        description=item.get("description"),
        fast_track=item.get("fastTrack"),
        fast_track_justification=(
            item.get("fastTrackJustification") if fast_track else ""
        ),
        file_name=item.get("fileName"),
        request_timestamp=item.get("requestTimestamp"),
        requestor_email=item.get("requestorEmail"),
        sub_request_type=item.get("subRequestType"),
        auto_validation_status=item.get("autoValidationStatus").upper(),
        auto_validation_reason=item.get("autoValidationReason"),
        auto_validation_end_timestamp=item.get("autoValidationEndTimestamp"),
    )

    return metadata_item
