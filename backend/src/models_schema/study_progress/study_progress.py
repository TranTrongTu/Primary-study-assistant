from datetime import datetime

from pydantic import BaseModel, model_validator

from backend.src.exceptions.core import (
    ExceptionRequestValidation_400,
)
from backend.src.models_schema.miscellaneous.enums import (
    CriterionAttribute,
    OperatorType,
    SubjectType,
)
from backend.src.services.study_activity import StudyActivityFormat, StudyActivityType


class Criterion(BaseModel):
    attribute: CriterionAttribute
    value: bool | int | str | datetime | None
    operator: OperatorType

    @model_validator(mode="after")
    def validate_subject_type(self):
        if self.attribute == "subject_type" and self.value is not None:
            try:
                SubjectType(self.value)
            except ValueError:
                raise ExceptionRequestValidation_400(
                    custom_message=f"{self.value} không phải là giá trị hợp lệ cho đặc trưng subject_type."
                )
        return self

    @model_validator(mode="after")
    def validate_activity_type(self):
        if self.attribute == "activity_type" and self.value is not None:
            try:
                StudyActivityType(self.value)
            except ValueError:
                raise ExceptionRequestValidation_400(
                    custom_message=f"{self.value} không phải là giá trị hợp lệ cho đặc trưng activity_type."
                )
        return self

    @model_validator(mode="after")
    def validate_activity_format(self):
        if self.attribute == "activity_format" and self.value is not None:
            try:
                StudyActivityFormat(self.value)
            except ValueError:
                raise ExceptionRequestValidation_400(
                    custom_message=f"{self.value} không phải là giá trị hợp lệ cho đặc trưng activity_format."
                )
        return self

    @model_validator(mode="after")
    def validate_datetime(self):
        if (
            self.attribute
            in (CriterionAttribute.CREATED_AT, CriterionAttribute.SUBMITTED_AT)
            and self.value is not None
        ):
            try:
                parsed_date = datetime.strptime(self.value, "%d%m%Y").date()  # type: ignore
                self.value = parsed_date  # type: ignore
            except (TypeError, ValueError):
                raise ExceptionRequestValidation_400(
                    custom_message=f"value không hợp lệ cho đặc trưng {self.attribute}."
                )
        return self

    @model_validator(mode="after")
    def validate_bool_type(self):
        if self.attribute == "is_submitted":
            if self.operator not in (
                "NE",
                "EQ",
                "GROUP_BY",
            ):
                raise ExceptionRequestValidation_400(
                    custom_message="Đặc trưng is_submitted chỉ có thể nhận so sánh bằng (EQ), khác (NE) hoặc nhóm (GROUP_BY)."
                )
            if self.value not in (True, False, None):
                raise ExceptionRequestValidation_400(
                    custom_message="Đặc trưng is_submitted chỉ có thể nhận các giá trị true, false hoặc null."
                )
        return self

    @model_validator(mode="after")
    def validate_null_value(self):
        if self.value is None and self.operator not in ("NE", "EQ", "GROUP_BY"):
            raise ExceptionRequestValidation_400(
                custom_message="Giá trị null chỉ có thể nhận so sánh bằng (EQ) hoặc khác (NE)."
            )
        return self
