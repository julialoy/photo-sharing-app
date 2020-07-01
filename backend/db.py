import sqlite3

from dataclasses import dataclass
from pathlib import Path
from typing import AsyncIterator, List

import aiosqlite
from aiohttp import web

DATABASE = 'photo_user.sqlite3'


@dataclass
class User:
    id: int
    username: str
    password: str
    access_level: str


def get_db_path() -> Path:
    here = Path.cwd()
    return here / DATABASE


async def init_db(app: web.Application) -> AsyncIterator[None]:
    sqlite_db = get_db_path()
    db = await aiosqlite.connect(sqlite_db)
    db.row_factory = aiosqlite.Row
    app["DB"] = db
    yield
    await db.close()


def create_users_db() -> None:
    print("CREATING USERS DATABASE")
    sqlite_db = get_db_path()
    if sqlite_db.exists():
        print("DATABASE EXISTS")
        #print(sqlite_db)
        try:
            with sqlite3.connect(sqlite_db) as conn:
                cur = conn.cursor()
                cur.execute("""
                SELECT * from users
                WHERE id = 1
                """)
            print("TABLE USERS EXISTS")
            return
        except sqlite3.DatabaseError as err:
            print(f"DatabaseError: {err}")

    with sqlite3.connect(sqlite_db) as conn:
        print("SET UP THE USERS TABLE")
        cur = conn.cursor()
        cur.execute(
            """CREATE TABLE users (
            id INTEGER PRIMARY KEY,
            username TEXT UNIQUE,
            password TEXT,
            access_level TEXT,
            auth_token TEXT UNIQUE)
            """
        )
        conn.commit()


def create_images_db() -> None:
    print("CREATING IMAGE DATABASE")
    sqlite_db = get_db_path()
    if sqlite_db.exists():
        print("DATABASE EXISTS")
        #print(sqlite_db)
        try:
            with sqlite3.connect(sqlite_db) as conn:
                cur = conn.cursor()
                cur.execute("""
                SELECT * from images
                """)
            print("TABLE IMAGES EXISTS")
            return
        except sqlite3.DatabaseError as err:
            print(f"DatabaseError: {err}")

    with sqlite3.connect(sqlite_db) as conn:
        print("SET UP THE IMAGES TABLE")
        cur = conn.cursor()
        cur.execute(
            """CREATE TABLE images(
            id INTEGER PRIMARY KEY,
            user_id INTEGER,
            album_key INTEGER,
            child_key INTEGER,
            filename TEXT,
            url TEXT,
            date_taken DATE,
            title TEXT,
            description TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
            )"""
        )
        conn.commit()
