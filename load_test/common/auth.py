import uuid

from locust.clients import HttpSession
from locust.exception import StopUser


def register_login(client: HttpSession) -> None | str:
    unique = uuid.uuid4().hex
    username = unique
    email = f"{unique}@gmail.com"
    password = f"{unique}-password"

    response = client.post(
        "/user/register",
        json={"username": username, "password": password, "email": email},
    )

    # Fails to register
    if response.status_code != 200:
        raise StopUser()

    response2 = client.post(
        "/login",
        data={"username": email, "password": password},
    )

    # Fails to login
    if response2.status_code != 200:
        raise StopUser()

    token: str = response2.json().get("access_token")

    # access_token not available
    if not token:
        raise StopUser()

    return token
