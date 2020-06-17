import asyncio
import io
import json
import sqlite3
from pathlib import Path
from typing import Awaitable, Callable
from uuid import uuid4

import aiohttp_session
import aiosqlite
from aiohttp import web

from db import DATABASE

db = DATABASE
router = web.RouteTableDef()
# _WebHanlder = Callable[[web.Request], Awaitable[web.StreamResponse]]
#
#
# def require_login(func: _WebHanlder) -> _WebHanlder:
#     func.__require_login__ = True   # type: ignore
#     return func
#
#
# @web.middleware
# async def check_login(request: web.Request,
#                       handler: _WebHanlder) -> web.StreamResponse:
#     require_login = getattr(handler, "__require_login__", False)
#     session = await aiohttp_session.get_session(request)
#     username = session.get("username")
#     if require_login:
#         if not username:
#             raise web.HTTPSeeOther(location="/login")
#     return await handler(request)


@asyncio.coroutine
async def json_handler(self, *, loads=json.loads):
    body = await self.text()
    return loads(body)


@asyncio.coroutine
@router.get("/")
async def index_handler(request: web.Request) -> web.Response:
    session = await aiohttp_session.get_session(request)
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
    session = await aiohttp_session.get_session(request)

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

                # print(f"USERNAME FROM SESSION: {session.get('username')}")
                # print(f"AUTH_TOKEN FROM SESSION: {session.get('auth_token')}")
                # print(f"{session}")

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
async def logged_in_handler(request: web.Request) -> web.json_response:
    session = await aiohttp_session.get_session(request)
    data = {'is_logged_in': False}
    print(f"LOGGED IN? {session}")
    return web.json_response(data)


@asyncio.coroutine
@router.get("/logout")
async def logout_handler(request: web.Request) -> web.Response:
    # Fill in
    return web.Response(
        text="Logged out successfully",
        headers={
            "X-Custom-Server-Header": "Custom data",
        })
