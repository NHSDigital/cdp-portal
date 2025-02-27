"""Module to hold exceptions"""


class S3ObjectMoveException(Exception):
    """Exception for issues with the S3 object moving process"""


class ObjectValidationException(Exception):
    """Exception for validation issues"""
