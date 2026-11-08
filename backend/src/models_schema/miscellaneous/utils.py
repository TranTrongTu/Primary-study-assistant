from typing import Any

from backend.src.exceptions.core import ExceptionRequestValidation_400


def beva_forbid_none(value: Any):
    """
    Prevents user from sending a None.
    """
    if value is None:
        raise ExceptionRequestValidation_400(
            "A value of None was entered in the wrong place. Please leave empty if you wish to leave it unchanged."
        )
    return value
