FROM python:3.14-slim

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt
COPY ./requirements-dev.txt /code/requirements-dev.txt

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt \
&& pip install --no-cache-dir --upgrade -r /code/requirements-dev.txt

COPY ./backend /code/backend

CMD ["fastapi", "run", "backend/src/main.py", "--port", "8000", "--host", "0.0.0.0"]