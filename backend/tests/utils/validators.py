from typing import Any

from httpx import Response
from pydantic import BaseModel, TypeAdapter


def validate_status_code(response: Response, status_code: int) -> None:
    assert response.status_code == status_code, (
        f"Expected: {status_code}. Received: {response.status_code}. Details: {response.text}"
    )


def validate_model(response: Response, model: type[Any]) -> None:
    adapter = TypeAdapter(model)
    adapter.validate_python(response.json())


def validate_object_contents(object: BaseModel, expected_contents: dict) -> None:
    assert expected_contents.items() <= object.model_dump().items(), (
        f"Expected: {expected_contents}. Received: {object.model_dump()}"
    )


def validate_response_contents(
    response: Response, expected_contents: dict | list[dict]
) -> None:
    if isinstance(expected_contents, dict):
        assert expected_contents.items() <= response.json().items(), (
            f"Expected: {expected_contents}. Received: {response.json()}"
        )

    else:
        response_contents = response.json()

        for expected_content in expected_contents:
            found = any(
                expected_content.items() <= response_content.items()
                for response_content in response_contents
            )

            assert found, (
                f"Expected to find: {expected_content}. Missing from: {response_contents}"
            )
