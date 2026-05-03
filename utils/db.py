from __future__ import annotations

import os
from typing import Optional

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine

DEFAULT_SQLITE_URL = "sqlite:///data/warehouse.db"


def get_engine(database_url: Optional[str] = None) -> Engine:
    load_dotenv()
    url = database_url or os.getenv("DATABASE_URL") or DEFAULT_SQLITE_URL
    return create_engine(url, future=True)
