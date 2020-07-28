import os
from pathlib import Path
from datetime import date
import asyncio
import json
import sqlite3
from typing import Awaitable, Callable
from uuid import uuid4

from aiohttp_session import setup, get_session, new_session
from aiohttp import web
import PIL.Image

from db import DATABASE

db = DATABASE
BASE_PATH = Path(__file__).parent
router = web.RouteTableDef()
_WebHandler = Callable[[web.Request], Awaitable[web.StreamResponse]]


def require_login(func: _WebHandler) -> _WebHandler:
    func.__require_login__ = True   # type: ignore
    return func


def image_to_db(user_id, album_id, child_id, filename, image_date) -> None:
    """Add uploaded image information to db"""
    with sqlite3.connect(db) as conn:
        cur = conn.cursor()
        cur.execute("""
        INSERT INTO images (user_key, album_key, child_key, filename, date_taken)
        VALUES (?, ?, ?, ?, ?)
        """, (user_id, album_id, child_id, filename, image_date))
        conn.commit()


@web.middleware
async def check_login(request: web.Request,
                      handler: _WebHandler) -> web.StreamResponse:
    require_login = getattr(handler, "__require_login__", False)
    session = await get_session(request)
    username = session.get("username")
    if require_login:
        if not username or username is None:
            print(f"No username in session: {session}")
    return await handler(request)


@asyncio.coroutine
async def json_handler(self, *, loads=json.loads):
    body = await self.text()
    return loads(body)


@asyncio.coroutine
@router.get("/")
# @require_login
async def index_handler(request: web.Request) -> web.Response:
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
                session["username"] = username
                session["user_id"] = selected_user[0]
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
    user_id = session.get("user_id")
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
        session["user_id"] = None
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
@require_login
async def upload_handler(request: web.Request) -> web.json_response:
    data = {"upload_successful": False, "error": None}
    session = await get_session(request)
    current_user = session['user_id']
    image_data = await request.post()
    counter = 0
    end_count = len(image_data)
    while counter < end_count:
        key = 'image' + str(counter)
        filename = image_data[key].filename
        image_file = image_data[key].file
        try:
            with sqlite3.connect(db) as conn:
                cur = conn.cursor()
                cur.execute("""
                INSERT INTO images (user_id, filename)
                VALUES (?, ?)
                """, (current_user, filename))
                conn.commit()
        except sqlite3.DatabaseError as err:
            data['upload_successful'] = False
            data['error'] = err
            print(f"Could not save image: {err}")
            return web.json_response(data)
        else:
            with open(os.path.join('static/images/', filename), 'wb') as f:
                image_contents = image_file.read()
                f.write(image_contents)

            # Get exif
            img = PIL.Image.open(image_file)
            exif_data = img.getexif()
            creation_date = exif_data.get(36867)

            if creation_date is None:
                creation_date = date.today()

            with sqlite3.connect(db) as conn:
                cur = conn.cursor()
                cur.execute("""
                UPDATE images
                SET date_taken=(?)
                WHERE user_id=(?)
                AND filename=(?)
                """, (creation_date, current_user, filename))
                conn.commit()

            print(f"creation_date for {filename}: {creation_date}")
            data['upload_successful'] = True

        counter += 1

    return web.json_response(data)
