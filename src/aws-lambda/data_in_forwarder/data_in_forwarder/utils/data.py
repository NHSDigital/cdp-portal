"""Module to hold dataclasses and typing helpers"""

from dataclasses import dataclass
from http import HTTPStatus
from typing import TypedDict, Union


class DataInForwarderOutput(TypedDict):
    """Typing class for function output"""

    statusCode: HTTPStatus
    body: str


@dataclass
class S3ObjectInfo:
    """Dataclass for holding information about an S3 object"""

    bucket: str
    key: str
    size: int

    @property
    def object_location(self) -> dict[str, str]:
        """The bucket and key of the object in a format suitable for the CopySource argument"""
        return {"Bucket": self.bucket, "Key": self.key}

    @property
    def s3_uri(self) -> str:
        """The s3 uri for the object"""
        return f"s3://{self.bucket}/{self.key}"

    @property
    def agreement(self) -> Union[str, None]:
        """The agreement name from the key based on a key like <agreement>/<user>/<file>"""
        key_parts = self.key.split("/")
        return key_parts[0] if len(key_parts) == 3 else None

    @property
    def user(self) -> Union[str, None]:
        """The user id from the key based on a key like <agreement>/<user>/<file>"""
        key_parts = self.key.split("/")
        return key_parts[1] if len(key_parts) == 3 else None

    @property
    def file(self) -> str:
        """The file name from the key"""
        return self.key.split("/")[-1]
