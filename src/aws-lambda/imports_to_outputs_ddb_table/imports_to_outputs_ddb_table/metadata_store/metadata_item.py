from dataclasses import dataclass
from dataclasses_json import dataclass_json, LetterCase
from typing import Dict, Any
from . import dynamodb


@dataclass_json(letter_case=LetterCase.CAMEL)
@dataclass
class MetadataItem:
    id: str
    request_type: str
    data_sharing_agreement: str
    description: str
    fast_track: bool
    fast_track_justification: str
    file_name: str
    request_timestamp: str
    requestor_email: str
    sub_request_type: str
    auto_validation_status: str
    auto_validation_reason: str = ""
    auto_validation_end_timestamp: str = ""
    status: str = ""
    s3_bucket: str = ""
    s3_path: str = ""
    dsa_and_status: str = ""
    assigned_output_checker: str = ""
    dsa_and_requestor_email: str = ""
    request_type_and_status: str = ""
    request_type_and_status_and_assigned_output_checker: str = ""
    fast_track_and_request_timestamp: str = ""

    def __post_init__(self):
        if self.auto_validation_status in ("PENDING"):
            self.status = "PENDING"
            self.dsa_and_status = f"{self.data_sharing_agreement}/{self.status}"

        if self.auto_validation_status in ("SUCCESS"):
            self.status = "PENDING"
            self.dsa_and_status = f"{self.data_sharing_agreement}/{self.status}"
            self.request_type_and_status = f"{self.request_type}/{self.status}"
            self.request_type_and_status_and_assigned_output_checker = (
                f"{self.request_type}/{self.status}/unassigned"
            )
            self.s3_bucket = dynamodb.IMPORTS_S3_BUCKET
            self.s3_path = f"{self.data_sharing_agreement}/{self.requestor_email}/{self.id}/{self.file_name}"

        if self.auto_validation_status in ("FAILED"):
            self.status = "ACTIONED"
            self.dsa_and_status = f"{self.data_sharing_agreement}/{self.status}"
            self.request_type_and_status = f"{self.request_type}/{self.status}"
            self.request_type_and_status_and_assigned_output_checker = (
                f"{self.request_type}/{self.status}/none"
            )

        self.dsa_and_requestor_email = (
            f"{self.data_sharing_agreement}/{self.requestor_email}"
        )

        if self.fast_track:
            fast_track_prefix = "0"
        else:
            fast_track_prefix = "1"
        self.fast_track_and_request_timestamp = (
            f"{fast_track_prefix}/{self.request_timestamp}"
        )
