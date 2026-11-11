"""Smoke test script for Study Assistant API.

Verifies end-to-end functionality across core endpoints:
1. Health check (/health)
2. Authentication (/api/login with provided credentials, or optional auto-registration)
3. Create interaction session (/api/interaction/create)
4. Document upload & RAG ingestion (/api/document/{id}/upload)
5. AI Chat / Q&A (/api/llm-response/{id}/chat)
6. Quiz / Study Activity generation (/api/study-activity/{id}/create)
7. Teardown / Cleanup (/api/interaction/{id})

Configuration via environment variables or CLI arguments:
  BASE_URL / API_URL          (default: http://localhost:8000)
  SMOKE_TEST_EMAIL / EMAIL    (required unless --allow-auto-register is passed)
  SMOKE_TEST_PASSWORD / PASSWORD
  ALLOW_AUTO_REGISTER         (default: 0; set to 1 to allow registering a temporary user)
  SMOKE_TEST_TIMEOUT          (default: 60s)
  SKIP_TEARDOWN               (default: 0; set to 1 to keep test data)
  VERBOSE                     (default: 0; set to 1 for full request/response logs)
"""

import argparse
import os
import sys
import time
import uuid
from typing import Any

import httpx

DEFAULT_TIMEOUT = 60.0


class SmokeTestFailure(Exception):
    """Raised when an assertion or HTTP request fails in a test step."""


class SmokeTestRunner:
    def __init__(
        self,
        base_url: str,
        email: str | None = None,
        password: str | None = None,
        allow_auto_register: bool = False,
        timeout: float = DEFAULT_TIMEOUT,
        skip_teardown: bool = False,
        verbose: bool = False,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        if self.base_url.endswith("/api"):
            self.root_url = self.base_url[:-4]
            self.api_url = self.base_url
        else:
            self.root_url = self.base_url
            self.api_url = f"{self.base_url}/api"

        self.email = email
        self.password = password
        self.allow_auto_register = allow_auto_register
        self.timeout = timeout
        self.skip_teardown = skip_teardown
        self.verbose = verbose

        self.client = httpx.Client(timeout=self.timeout, transport=transport)
        self.token: str | None = None
        self.interaction_id: int | None = None
        self.document_id: int | None = None
        self.is_auto_registered = False

    def close(self) -> None:
        self.client.close()

    @property
    def auth_headers(self) -> dict[str, str]:
        if not self.token:
            return {}
        return {"Authorization": f"Bearer {self.token}"}

    def _log_step(self, step_num: int, total_steps: int, name: str) -> None:
        print(f"\n[{step_num}/{total_steps}] {name}...")

    def _log_pass(self, detail: str, duration: float) -> None:
        print(f"       -> PASS ({detail}) in {duration:.2f}s")

    def _log_fail(self, method: str, url: str, status: int | None, body: str) -> None:
        print("       -> FAILED!")
        print(f"       Request : {method} {url}")
        if status is not None:
            print(f"       Status  : {status}")
        preview = body[:800] if len(body) > 800 else body
        print(f"       Response: {preview}")

    def _log_verbose(self, message: str) -> None:
        if self.verbose:
            for line in str(message).splitlines():
                print(f"       [VERBOSE] {line}")

    # -------------------------------------------------------------------------
    # Steps
    # -------------------------------------------------------------------------

    def step_health(self) -> None:
        """Step 1: Check service health."""
        url = f"{self.root_url}/health"
        start = time.perf_counter()
        self._log_verbose(f">>> GET {url}")

        try:
            resp = self.client.get(url)
        except Exception as exc:
            self._log_fail("GET", url, None, str(exc))
            raise SmokeTestFailure(f"Connection failed: {exc}") from exc

        duration = time.perf_counter() - start
        self._log_verbose(f"<<< Status {resp.status_code}: {resp.text}")

        if resp.status_code != 200:
            self._log_fail("GET", url, resp.status_code, resp.text)
            raise SmokeTestFailure(f"Health check returned status {resp.status_code}")

        data = resp.json()
        if data.get("status") != "ok":
            self._log_fail("GET", url, resp.status_code, resp.text)
            raise SmokeTestFailure(f"Unexpected health status: {data}")

        self._log_pass(f"status={data.get('status')}", duration)

    def step_auth(self) -> None:
        """Step 2: Authenticate with existing credentials or optional auto-registration."""
        start = time.perf_counter()

        if not self.email or not self.password:
            if not self.allow_auto_register:
                raise SmokeTestFailure(
                    "No credentials provided. On production, provide SMOKE_TEST_EMAIL "
                    "and SMOKE_TEST_PASSWORD to avoid creating orphan accounts in the database.\n"
                    "If you intentionally want to register a disposable test user, pass "
                    "--allow-auto-register or set ALLOW_AUTO_REGISTER=1."
                )

            print(
                "       [WARNING] Auto-registering temporary user (--allow-auto-register).\n"
                "                 Note: The API does not support user deletion, so this "
                "account will remain in the DB."
            )

            uid = uuid.uuid4().hex[:10]
            self.email = f"smoke_test_{uid}@example.com"
            self.password = f"SmokePass_{uid}!123"
            self.is_auto_registered = True

            reg_url = f"{self.api_url}/user/register"
            reg_body = {
                "username": f"smoke_{uid}",
                "email": self.email,
                "password": self.password,
            }
            self._log_verbose(f">>> POST {reg_url} (email: {self.email})")

            try:
                reg_resp = self.client.post(reg_url, json=reg_body)
            except Exception as exc:
                self._log_fail("POST", reg_url, None, str(exc))
                raise SmokeTestFailure(
                    f"User registration connection error: {exc}"
                ) from exc

            self._log_verbose(f"<<< Status {reg_resp.status_code}: {reg_resp.text}")

            if reg_resp.status_code != 200:
                self._log_fail("POST", reg_url, reg_resp.status_code, reg_resp.text)
                raise SmokeTestFailure(
                    f"User registration failed with status {reg_resp.status_code}"
                )

        login_url = f"{self.api_url}/login"
        form_data = {"username": self.email, "password": self.password}
        self._log_verbose(f">>> POST {login_url} (username: {self.email})")

        try:
            login_resp = self.client.post(login_url, data=form_data)
        except Exception as exc:
            self._log_fail("POST", login_url, None, str(exc))
            raise SmokeTestFailure(f"Login connection error: {exc}") from exc

        duration = time.perf_counter() - start
        self._log_verbose(f"<<< Status {login_resp.status_code}")

        if login_resp.status_code != 200:
            self._log_fail("POST", login_url, login_resp.status_code, login_resp.text)
            raise SmokeTestFailure(
                f"Login failed with status {login_resp.status_code}. "
                "Please verify SMOKE_TEST_EMAIL and SMOKE_TEST_PASSWORD."
            )

        payload: dict[str, Any] = login_resp.json()
        token = payload.get("access_token")
        if not token:
            self._log_fail("POST", login_url, login_resp.status_code, login_resp.text)
            raise SmokeTestFailure("No access_token returned from login")

        self.token = token
        user_label = (
            f"{self.email} (auto-created)" if self.is_auto_registered else self.email
        )
        self._log_pass(f"user={user_label}", duration)

    def step_create_interaction(self) -> None:
        """Step 3: Create an interaction session."""
        url = f"{self.api_url}/interaction/create"
        body = {
            "name": f"Smoke Test {uuid.uuid4().hex[:6]}",
            "description": "Automated verification session",
        }
        start = time.perf_counter()
        self._log_verbose(f">>> POST {url} Body: {body}")

        try:
            resp = self.client.post(url, json=body, headers=self.auth_headers)
        except Exception as exc:
            self._log_fail("POST", url, None, str(exc))
            raise SmokeTestFailure(f"Interaction create error: {exc}") from exc

        duration = time.perf_counter() - start
        self._log_verbose(f"<<< Status {resp.status_code}: {resp.text}")

        if resp.status_code != 200:
            self._log_fail("POST", url, resp.status_code, resp.text)
            raise SmokeTestFailure(
                f"Create interaction failed with status {resp.status_code}"
            )

        data = resp.json()
        self.interaction_id = data.get("id")
        if not self.interaction_id:
            self._log_fail("POST", url, resp.status_code, resp.text)
            raise SmokeTestFailure("No interaction id returned")

        self._log_pass(f"id={self.interaction_id}", duration)

    def step_upload_document(self) -> None:
        """Step 4: Upload document & test RAG embedding pipeline."""
        if not self.interaction_id:
            raise SmokeTestFailure(
                "interaction_id is required before uploading documents"
            )

        url = f"{self.api_url}/document/{self.interaction_id}/upload"
        params = {
            "subject_type_overwrite": "false",
            "subject_type": "MATHS",
        }
        doc_content = (
            "CHUYÊN ĐỀ TOÁN TIỂU HỌC: BẢNG CỬU CHƯƠNG NHÂN 2\n"
            "2 x 1 = 2\n"
            "2 x 2 = 4\n"
            "2 x 3 = 6\n"
            "2 x 4 = 8\n"
            "2 x 5 = 10\n"
            "Quy tắc: Phép nhân 2 với một số tương đương với việc lấy số đó cộng với chính nó."
        )
        files = {
            "file": (
                "smoke_test_math.txt",
                doc_content.encode("utf-8"),
                "text/plain",
            )
        }

        start = time.perf_counter()
        self._log_verbose(f">>> POST {url} Params: {params} File: smoke_test_math.txt")

        try:
            resp = self.client.post(
                url, params=params, files=files, headers=self.auth_headers
            )
        except Exception as exc:
            self._log_fail("POST", url, None, str(exc))
            raise SmokeTestFailure(f"Document upload connection error: {exc}") from exc

        duration = time.perf_counter() - start
        self._log_verbose(f"<<< Status {resp.status_code}: {resp.text}")

        if resp.status_code != 200:
            self._log_fail("POST", url, resp.status_code, resp.text)
            raise SmokeTestFailure(
                f"Document upload failed with status {resp.status_code}"
            )

        # Returns tuple: [DocumentOutput, DocumentAnalysisOutput | None]
        data = resp.json()
        doc_info = data[0] if isinstance(data, list) and len(data) > 0 else data
        self.document_id = doc_info.get("id")

        self._log_pass(
            f"doc_id={self.document_id}, name={doc_info.get('name')}", duration
        )

    def step_chat(self) -> None:
        """Step 5: Ask question to verify AI LLM + RAG response."""
        if not self.interaction_id:
            raise SmokeTestFailure("interaction_id is required before chat")

        url = f"{self.api_url}/llm-response/{self.interaction_id}/chat"
        body = {
            "prompt": "Theo tài liệu đã tải lên, 2 nhân 3 bằng mấy? Hãy trả lời ngắn gọn trong 1 câu.",
            "document_id": self.document_id or 0,
        }

        start = time.perf_counter()
        self._log_verbose(f">>> POST {url} Body: {body}")

        try:
            resp = self.client.post(url, json=body, headers=self.auth_headers)
        except Exception as exc:
            self._log_fail("POST", url, None, str(exc))
            raise SmokeTestFailure(f"Chat connection error: {exc}") from exc

        duration = time.perf_counter() - start
        self._log_verbose(f"<<< Status {resp.status_code}: {resp.text}")

        if resp.status_code != 200:
            self._log_fail("POST", url, resp.status_code, resp.text)
            raise SmokeTestFailure(f"Chat failed with status {resp.status_code}")

        data = resp.json()
        answer = data.get("answer", "").strip()
        if not answer:
            self._log_fail("POST", url, resp.status_code, resp.text)
            raise SmokeTestFailure("Chat returned empty answer")

        preview = answer.replace("\n", " ")[:60]
        self._log_pass(f"answer='{preview}...'", duration)

    def step_quiz(self) -> None:
        """Step 6: Generate quiz to verify AI study activity creation."""
        if not self.interaction_id:
            raise SmokeTestFailure("interaction_id is required before quiz generation")

        url = f"{self.api_url}/study-activity/{self.interaction_id}/create"
        body = {
            "prompt": "Tạo 2 câu hỏi trắc nghiệm kiểm tra phép nhân trong bảng nhân 2",
            "subject_type": "MATHS",
            "activity_type": "EXERCISE",
            "activity_format": "MULTIPLE_CHOICE_QUESTIONS",
            "document_id": self.document_id or 0,
        }

        start = time.perf_counter()
        self._log_verbose(f">>> POST {url} Body: {body}")

        try:
            resp = self.client.post(url, json=body, headers=self.auth_headers)
        except Exception as exc:
            self._log_fail("POST", url, None, str(exc))
            raise SmokeTestFailure(f"Quiz creation error: {exc}") from exc

        duration = time.perf_counter() - start
        self._log_verbose(f"<<< Status {resp.status_code}: {resp.text}")

        if resp.status_code != 200:
            self._log_fail("POST", url, resp.status_code, resp.text)
            raise SmokeTestFailure(
                f"Quiz generation failed with status {resp.status_code}"
            )

        data = resp.json()
        activity_id = data.get("id")
        if not activity_id:
            self._log_fail("POST", url, resp.status_code, resp.text)
            raise SmokeTestFailure("No activity id returned from quiz creation")

        # The API returns `items` (StudyActivityOutputComplete schema)
        items = data.get("items")
        if not isinstance(items, list) or len(items) == 0:
            self._log_fail("POST", url, resp.status_code, resp.text)
            raise SmokeTestFailure(
                f"Quiz generation returned 0 items (items={items!r}). "
                "AI failed to generate quiz questions."
            )

        # Validate that each item has a non-empty question
        for i, item in enumerate(items, start=1):
            if not isinstance(item, dict):
                raise SmokeTestFailure(f"Quiz item {i} is not a valid object: {item!r}")
            question = item.get("question")
            if not question or not isinstance(question, str) or not question.strip():
                raise SmokeTestFailure(
                    f"Quiz item {i} has empty or missing question text: {item!r}"
                )

        self._log_pass(
            f"activity_id={activity_id}, items_count={len(items)} (verified > 0)",
            duration,
        )

    def teardown(self) -> None:
        """Step 7: Clean up created interaction session."""
        if not self.interaction_id:
            return
        if self.skip_teardown:
            print(
                f"\n[Teardown] Skipped cleanup (--skip-teardown). "
                f"Interaction ID: {self.interaction_id}"
            )
            return

        url = f"{self.api_url}/interaction/{self.interaction_id}"
        start = time.perf_counter()
        self._log_verbose(f">>> DELETE {url}")

        try:
            resp = self.client.delete(url, headers=self.auth_headers)
            duration = time.perf_counter() - start
            self._log_verbose(f"<<< Status {resp.status_code}")
            if resp.status_code in (200, 204):
                print(
                    f"\n[Teardown] Deleted interaction {self.interaction_id} ... "
                    f"PASS in {duration:.2f}s"
                )
            else:
                print(
                    f"\n[Teardown] Warning: Delete interaction returned status {resp.status_code}"
                )
        except Exception as exc:
            print(f"\n[Teardown] Warning: Failed to clean up interaction: {exc}")

    # -------------------------------------------------------------------------
    # Main Orchestrator
    # -------------------------------------------------------------------------

    def run(self) -> bool:
        steps = [
            ("Health Check", self.step_health),
            ("Authentication", self.step_auth),
            ("Create Interaction Session", self.step_create_interaction),
            ("Upload Document & RAG Ingestion", self.step_upload_document),
            ("AI Chat (LLM Response)", self.step_chat),
            ("AI Quiz Generation", self.step_quiz),
        ]
        total_steps = len(steps)

        print("=" * 65)
        print("          STUDY ASSISTANT API SMOKE TEST RUNNER")
        print("=" * 65)
        print(f"Target Root URL : {self.root_url}")
        print(f"Target API URL  : {self.api_url}")
        print(
            f"Auth Mode       : {'Pre-configured' if self.email else 'Auto-register'}"
        )
        print(f"Timeout         : {self.timeout}s")
        print(f"Verbose Logging : {'Enabled' if self.verbose else 'Disabled'}")
        print("=" * 65)

        overall_start = time.perf_counter()
        failed_step = None

        try:
            for idx, (name, fn) in enumerate(steps, start=1):
                self._log_step(idx, total_steps, name)
                fn()
        except SmokeTestFailure as exc:
            failed_step = str(exc)
        except Exception as exc:
            failed_step = f"Unexpected error: {exc}"
        finally:
            self.teardown()
            self.close()

        total_duration = time.perf_counter() - overall_start

        print("\n" + "=" * 65)
        if failed_step is None:
            print(
                f"SUCCESS: All {total_steps} smoke test steps passed in {total_duration:.2f}s!"
            )
            print("=" * 65)
            return True
        else:
            print(f"FAILURE: Smoke test halted due to error:\n{failed_step}")
            print(f"Elapsed: {total_duration:.2f}s")
            print("=" * 65)
            return False


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run end-to-end smoke tests against Study Assistant API."
    )
    parser.add_argument(
        "--url",
        default=os.environ.get("BASE_URL")
        or os.environ.get("API_URL")
        or "http://localhost:8000",
        help="Base server URL (env: BASE_URL or API_URL, default: http://localhost:8000)",
    )
    parser.add_argument(
        "--email",
        default=os.environ.get("SMOKE_TEST_EMAIL") or os.environ.get("EMAIL"),
        help="Email for login (env: SMOKE_TEST_EMAIL or EMAIL)",
    )
    parser.add_argument(
        "--password",
        default=os.environ.get("SMOKE_TEST_PASSWORD") or os.environ.get("PASSWORD"),
        help="Password for login (env: SMOKE_TEST_PASSWORD or PASSWORD)",
    )
    parser.add_argument(
        "--allow-auto-register",
        action="store_true",
        default=os.environ.get("ALLOW_AUTO_REGISTER", "0") in ("1", "true", "True"),
        help="Allow registering a temporary user if email/password not provided (leaves orphan user in DB)",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=float(os.environ.get("SMOKE_TEST_TIMEOUT", str(DEFAULT_TIMEOUT))),
        help=f"HTTP request timeout in seconds (default: {DEFAULT_TIMEOUT}s)",
    )
    parser.add_argument(
        "--skip-teardown",
        action="store_true",
        default=os.environ.get("SKIP_TEARDOWN", "0") in ("1", "true", "True"),
        help="Skip deleting the test interaction session at the end",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        default=os.environ.get("VERBOSE", "0") in ("1", "true", "True")
        or os.environ.get("SMOKE_TEST_VERBOSE", "0") in ("1", "true", "True"),
        help="Enable verbose request and response logging",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    runner = SmokeTestRunner(
        base_url=args.url,
        email=args.email,
        password=args.password,
        allow_auto_register=args.allow_auto_register,
        timeout=args.timeout,
        skip_teardown=args.skip_teardown,
        verbose=args.verbose,
    )
    success = runner.run()
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
