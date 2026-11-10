import asyncio
from collections.abc import Awaitable
from typing import TypeVar

T = TypeVar("T")


async def gather_limited(limit: int, *awaitables: Awaitable[T]) -> list[T]:
    """Like ``asyncio.gather`` but runs at most ``limit`` awaitables at a time.

    Results keep the order of the arguments. Exceptions propagate like in
    ``asyncio.gather`` (the first one is raised to the caller).
    """
    if limit < 1:
        raise ValueError("limit must be at least 1")

    semaphore = asyncio.Semaphore(limit)

    async def run(awaitable: Awaitable[T]) -> T:
        async with semaphore:
            return await awaitable

    return list(await asyncio.gather(*(run(a) for a in awaitables)))
