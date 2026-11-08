from fastapi import APIRouter

from backend.src.core.database import reset_database
from backend.src.core.dependencies import SessionDep, select

router = APIRouter()


@router.post("/wipe-db", status_code=204)
async def wipe_database():
    await reset_database()


@router.get("/ping", status_code=204)
async def ping(session: SessionDep):
    await session.execute(select(1))
