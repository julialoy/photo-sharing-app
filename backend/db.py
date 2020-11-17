import sqlite3

from dataclasses import dataclass
from pathlib import Path
from typing import AsyncIterator, List

import aiosqlite
from aiohttp import web
import datetime

DATABASE = 'photo_user.sqlite3'

# users access levels:
# primary -> can upload, download, delete, edit date and tags, enter title and description, invite friends/family, edit
# collaborator's permissions to restrict activity
# collaborator -> can upload, delete, download, edit date and tags, enter title and description, invite friends/family
# viewer -> can view photos, download
# restricted -> can view certain photos, cannot download


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


def delete_auth_tokens(cursor) -> None:
    print(f"REMOVING OLD AUTH TOKENS")
    try:
        cursor.execute("""
        UPDATE users
        SET auth_token=(?)
        """, (None,))
    except sqlite3.DatabaseError as err:
        print(f"ERROR REMOVING AUTH TOKENS: {err}")


def clean_invite_db(cursor) -> None:
    today = str(datetime.datetime.now(datetime.timezone.utc))
    print(f"CLEANING INVITE DATABASE FOR EXPIRY: {today} (type: {type(today)}")
    try:
        cursor.execute("""
        DELETE FROM invites
        WHERE invite_expires < (?)
        """, (today,))
    except sqlite3.DatabaseError as err:
        print(f"ERROR CLEANING INVITES: {err}")


def create_users_db() -> None:
    print("CREATING USERS DATABASE")
    sqlite_db = get_db_path()
    if sqlite_db.exists():
        print("DATABASE EXISTS")
        try:
            with sqlite3.connect(sqlite_db) as conn:
                cur = conn.cursor()
                cur.execute("""
                SELECT * from users
                WHERE id = 1
                """)
                print("TABLE USERS EXISTS")
                delete_auth_tokens(cur)
                print("DELETING OLD AUTH TOKENS")
                conn.commit()
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
            auth_token TEXT UNIQUE,
            linked_to INTEGER,
            FOREIGN KEY (linked_to) REFERENCES users(id)
            )"""
        )
        conn.commit()


def create_images_db() -> None:
    print("CREATING IMAGE DATABASE")
    sqlite_db = get_db_path()
    if sqlite_db.exists():
        print("DATABASE EXISTS")
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
            web_size_filename TEXT,
            thumbnail_filename TEXT,
            url TEXT,
            date_taken DATE,
            title TEXT,
            description TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
            )"""
        )
        conn.commit()


def create_invites_db() -> None:
    print("CREATING INVITES DATABASE")
    sqlite_db = get_db_path()
    if sqlite_db.exists():
        print("DATABASE EXISTS")
        try:
            with sqlite3.connect(sqlite_db) as conn:
                cur = conn.cursor()
                cur.execute("""
                SELECT * from invites
                """)
                print(f"TABLE INVITES EXISTS")
                clean_invite_db(cur)
                print(f"INVITE DATABASE CLEANED")
            return
        except sqlite3.DatabaseError as err:
            print(f"DatabaseError: {err}")

    with sqlite3.connect(sqlite_db) as conn:
        print("SET UP THE INVITES TABLE")
        cur = conn.cursor()
        cur.execute("""
        CREATE TABLE invites (
        id INTEGER PRIMARY KEY,
        invited_by INTEGER,
        invite_email TEXT,
        invite_code TEXT,
        invite_expires DATE,
        access_level TEXT,
        FOREIGN KEY (invited_by) REFERENCES users(id)
        )""")
        conn.commit()
