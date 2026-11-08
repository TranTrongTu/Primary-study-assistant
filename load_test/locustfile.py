from pathlib import Path

import requests
from locust import HttpUser, between, events, tag, task
from locust.exception import StopUser

from load_test.common.auth import register_login
from load_test.config import settings

test_file_path = Path(__file__).resolve().parent / "data" / "test_file.pdf"


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    try:
        response = requests.post(f"{settings.BACKEND_URL}/dev/wipe-db")

        if response.status_code == 200:
            print("Database wiped. Tests are starting.")
        else:
            print(f"Failed to wipe database. Status code: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("Failed to connect to the server.")
        environment.runner.quit()


class AppUser(HttpUser):
    wait_time = between(1, 5)
    host = settings.BACKEND_URL

    def on_start(self):
        # Logins and saves token
        token = register_login(self.client)

        self.client.headers.update({"Authorization": f"Bearer {token}"})

        # Creates interaction
        response = self.client.post(
            "/interaction/create",
            json={
                "name": "interaction-name",
                "description": "interaction-description",
            },
        )

        if response.status_code != 200:
            raise StopUser()

        self.interaction_id = response.json()["id"]

    @tag("create_note")
    @task
    def create_note(self):
        self.client.post(
            f"/note/{self.interaction_id}/upload",
            json={
                "name": "note-name",
                "description": "note-description",
                "content": "note-content",
            },
            name="/note/{interaction_id}/upload",
        )

    @tag("create_llm_response")
    @task
    def create_llm_response(self):
        self.client.post(
            f"/llm-response/{self.interaction_id}/chat",
            json={"prompt": "Hãy giảng cho tôi về cách cộng trừ nhân chia phân số."},
            name="/llm-response/{interaction_id}/chat",
        )
        raise StopUser()

    @tag("save_document")
    @task
    def save_document(self):
        with open(test_file_path, "rb") as f:
            self.client.post(
                f"/document/{self.interaction_id}/upload",
                files={"file": ("test_file.pdf", f, "application/pdf")},
                name="/document/{interaction_id}/upload",
            )
        raise StopUser()

    @tag("create_study_activity")
    @task
    def create_study_activity(self):
        self.client.post(
            f"/study-activity/{self.interaction_id}/create",
            json={
                "prompt": "Hãy làm cho mình một bài tập ôn 10 câu nhé.",
                "activity_type": "EXERCISE",
                "activity_format": "MULTIPLE_CHOICE_QUESTIONS",
                "subject_type": "MATHS",
            },
            name="/study-activity/{interaction_id}/create",
        )
        raise StopUser()
