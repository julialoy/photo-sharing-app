import time
import asyncio
import json
import sqlite3
from typing import Any, Awaitable, Callable, Dict
from uuid import uuid4

import aiohttp
from aiohttp_session import setup, get_session, new_session
from aiohttp import web

from db import DATABASE

db = DATABASE
router = web.RouteTableDef()
_WebHandler = Callable[[web.Request], Awaitable[web.StreamResponse]]


def require_login(func: _WebHandler) -> _WebHandler:
    func.__require_login__ = True   # type: ignore
    return func


def image_to_db(filename):
    """Add uploaded image information to db"""
    with sqlite3.connect(db) as conn:
        cur = conn.cursor()
        cur.execute("""
        INSERT INTO images (user_key, album_key, child_key, filename, date_taken)
        VALUES (?, ?, ?, ?, ?)
        """)
        conn.commit()



@web.middleware
async def check_login(request: web.Request,
                      handler: _WebHandler) -> web.StreamResponse:
    require_login = getattr(handler, "__require_login__", False)
    session = await get_session(request)
    username = session.get("username")
    print(f"IN MIDDLEWARE GET SESSION: {session}")
    if require_login:
        if not username or username is None:
            print(f"No username in session: {session}")
    return await handler(request)
#
# @asyncio.coroutine
# async def request_handler(request):
#     async with request.app['MY_PERSISTENT_SESSION'].get() as resp:


# async def username_ctx_processor(request: web.Request) -> Dict[str, Any]:
#     session = await get_session(request)
#     username = session.get("username")
#     return {"username": username}
@asyncio.coroutine
async def json_handler(self, *, loads=json.loads):
    body = await self.text()
    return loads(body)


@asyncio.coroutine
@router.get("/")
# @require_login
async def index_handler(request: web.Request) -> web.Response:
    # session = request.app['MY_PERSISTENT_SESSION']
    session = await get_session(request)
    username = session.get("username")
    print(f"USERNAME: {username}")
    print(f"SESSION: {session}")
    return web.Response(
        text="Hello from the Index!",
        headers={
            "X-Custom-Server-Header": "Custom data",
        })


@asyncio.coroutine
@router.post("/login")
async def login_handler(request: web.Request) -> web.json_response:
    print("FIND USER AND LOG IN")
    session = await new_session(request)
    request_json = await json_handler(request)
    username = request_json['user']['email']
    password = request_json['user']['password']
    data = {'logged_in': False, 'user_id': None, 'username': None}

    with sqlite3.connect(db) as conn:
        cur = conn.cursor()
        cur.execute("""
        SELECT * FROM users
        """)

        for row in cur:
            selected_user = row
            if selected_user[1] == username and selected_user[2] == password:
                data['logged_in'] = True
                data['user_id'] = selected_user[0]
                data['username'] = selected_user[1]
                # Instead of username create temporary auth token for user upon login
                # Store in database
                # Put auth token in session
                # Delete auth token after certain amount of time (or log out?)
                # This will require user to log back in
                auth_token = uuid4()
                auth_token = auth_token.hex
                # print(f"AUTH_TOKEN TYPE: {type(auth_token)}")
                session["username"] = username
                session["auth_token"] = auth_token
                session["logged_in"] = True
                print(f"{session}")

                cur.execute("""
                UPDATE users
                SET auth_token = (?)
                WHERE username = (?)
                """, (auth_token, username))
                conn.commit()
                break

    return web.json_response(data)


@asyncio.coroutine
@router.post("/register")
async def registration_handler(request: web.Request) -> web.json_response:
    request_json = await json_handler(request)
    user_email = request_json['user']['email']
    user_password = request_json['user']['password']
    user_access_level = 'primary'
    data = {'is_registered': True, 'username': '', 'user_id': '', 'error': None}

    try:
        with sqlite3.connect(db) as conn:
            cur = conn.cursor()
            cur.execute("""
            INSERT INTO users (username, password, access_level)
            VALUES (?, ?, ?)
            """, (user_email, user_password, user_access_level))
            conn.commit()
    except sqlite3.IntegrityError as err:
        print(f"DATABASE ERROR: {err}")
        data['is_registered'] = False
        data['error'] = 'User already exists'
        return web.json_response({'error': 'User already exists'})

    with sqlite3.connect(db) as conn:
        cur = conn.cursor()
        cur.execute("""
        SELECT * FROM users
        WHERE username=? AND password=?
        """, (user_email, user_password))

        for row in cur:
            selected_user = row

        data['user_id'] = selected_user[0]
        data['username'] = selected_user[1]

    print(data)
    return web.json_response(data)


@asyncio.coroutine
@router.post("/logged_in")
# @require_login
async def logged_in_handler(request: web.Request) -> web.json_response:
    data = {"username": None, "is_logged_in": False}
    session = await get_session(request)
    print(f"LOGGED IN? {session}")
    valid_auth_token = session.get("auth_token")
    if valid_auth_token:
        data["is_logged_in"] = True
        data["username"] = session["username"]
    return web.json_response(data)


@asyncio.coroutine
@router.get("/logout")
@require_login
async def logout_handler(request: web.Request) -> web.json_response:
    session = await get_session(request)
    username = session.get("username")
    auth_token = session.get("auth_token")
    print(f"LOG OUT {session}")

    try:
        with sqlite3.connect(db) as conn:
            cur = conn.cursor()
            cur.execute("""
            UPDATE users
            SET auth_token = (?)
            WHERE auth_token = (?)
            AND username = (?)
            """, (None, auth_token, username))
            conn.commit()
        session["username"] = None
        session["auth_token"] = None
        session["logged_in"] = False
        data = {"log_out_successful": True}
    except sqlite3.DatabaseError as err:
        print(f"Something went wrong: {err}")
        data = {"log_out_successful": False}

    print(f"SESSION AFTER LOG OUT: {session}")
    return web.json_response(data)


@asyncio.coroutine
@router.post("/upload")
async def upload_handler():
    # Need logic to get files from form
    pass
