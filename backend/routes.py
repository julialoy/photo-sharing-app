import glob
import os
import io
from pathlib import Path
# from datetime import date
import asyncio
import datetime
import json
import sqlite3
from typing import Awaitable, Callable
from uuid import uuid4

from aiohttp_session import setup, get_session, new_session
from aiohttp import web
from PIL import Image

from db import DATABASE

db = DATABASE
BASE_PATH = Path(__file__).parent
router = web.RouteTableDef()
_WebHandler = Callable[[web.Request], Awaitable[web.StreamResponse]]


def require_login(func: _WebHandler) -> _WebHandler:
    func.__require_login__ = True   # type: ignore
    return func


def image_to_db(user_id, album_id, child_id, filename, web_filename, thumbnail_filename, image_date) -> None:
    """Add uploaded image information to db"""
    with sqlite3.connect(db) as conn:
        cur = conn.cursor()
        cur.execute("""
        INSERT INTO images (user_key, album_key, child_key, filename, web_size_filename, thumbnail_filename, date_taken)
        VALUES (?, ?, ?, ?, ?)
        """, (user_id, album_id, child_id, filename, web_filename, thumbnail_filename, image_date))
        conn.commit()


def retrieve_images(current_user_id):
    print(f"IN RETRIEVE IMAGES {type(current_user_id)}")
    with sqlite3.connect(db) as conn:
        cur = conn.cursor()
        cur.execute("""
        SELECT * from images
        WHERE user_id = ?
        """, (current_user_id,))
        return cur


def parse_image_data(db_data):
    parsed_data = []

    for row in db_data:
        NoneType = type(None)
        full_size_loc = '../static/images/' + row[4] if len(row[4]) >= 1 else ''
        web_size_loc = '../static/images/' + row[5] if type(row[5]) is not NoneType else full_size_loc
        thumb_size_loc = '../static/images/' + row[6] if type(row[6]) is not NoneType else full_size_loc
        parsed_data.append({
            'photo_id': row[0],
            'album_id': row[2],
            'child_id': row[3],
            'filename': row[4],
            'web_size_filename': row[5],
            'thumbnail_filename': row[6],
            'full_size_loc': full_size_loc,
            'web_size_loc': web_size_loc,
            'thumb_size_loc': thumb_size_loc,
            'date_taken': row[8],
            'title': row[9],
            'description': row[10],
        })

    return parsed_data


def order_images(parsed_image_array):
    parsed_image_array.sort(key=lambda x: x['date_taken'], reverse=True)
    # print(f"Reordered array {parsed_image_array}")


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
async def index_handler(request: web.Request) -> web.json_response:
    session = await get_session(request)
    username = session.get("username")
    print(f"USERNAME: {username}")
    print(f"SESSION: {session}")
    user_id = session.get("user_id")
    print(f"USER ID: {user_id}")
    available_photos = retrieve_images(user_id)
    parsed_photos = parse_image_data(available_photos)
    order_images(parsed_photos)
    return web.json_response(parsed_photos)


@asyncio.coroutine
@router.post("/login")
async def login_handler(request: web.Request) -> web.json_response:
    print("FIND USER AND LOG IN")
    session = await new_session(request)
    request_json = await json_handler(request)
    username = request_json['user']['email']
    password = request_json['user']['password']
    data = {'logged_in': False, 'user_id': None, 'username': None, 'access_level': None}

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
                data['access_level'] = selected_user[3]
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
                session["access_level"] = selected_user[3]
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
    data = {"user_id": None, "username": None, "access_level": None, "is_logged_in": False}
    session = await get_session(request)
    print(f"LOGGED IN? {session}")
    valid_auth_token = session.get("auth_token")
    if valid_auth_token:
        data["is_logged_in"] = True
        data["username"] = session["username"]
        data["user_id"] = session["user_id"]
        data["access_level"] = session["access_level"]
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
        session["access_level"] = None
        session["logged_in"] = False
        data = {"log_out_successful": True}
    except sqlite3.DatabaseError as err:
        print(f"Something went wrong: {err}")
        data = {"log_out_successful": False}

    print(f"SESSION AFTER LOG OUT: {session}")
    return web.json_response(data)


@asyncio.coroutine
@router.post("/edit")
@require_login
async def edit_handler(request: web.Request) -> web.json_response():
    data = {"edit_successful": False, "warnings": [], "error": None}
    session = await get_session(request)
    current_user = session.get("user_id")
    edited_data = await json_handler(request)
    print(f"EDIT ROUTE: current_user: {current_user}, edited_data: {edited_data}")
    photo_id = edited_data['photo']['id']
    filename = edited_data['photo']['filename']
    if "T" in edited_data['photo']['oldDate']:
        orig_date = edited_data['photo']['oldDate'].split("T")[0]
    else:
        orig_date = edited_data['photo']['oldDate']
    new_date = edited_data['photo']['newDate']
    print(f"EDIT ROUTE: orig_date: {orig_date}, new_date: {new_date}")

    if orig_date == new_date:
        data['edit_successful'] = True
        data['warnings'] = "New date matched original"

    try:
        with sqlite3.connect(db) as conn:
            cur = conn.cursor()
            cur.execute("""
            UPDATE images
            SET date_taken=(?)
            WHERE id=(?)
            AND user_id=(?)
            AND filename=(?)
            """, (new_date, photo_id, current_user, filename))
            conn.commit()
            data['edit_successful'] = True
        print(f"EDIT SUCCESSFUL")
    except sqlite3.DatabaseError as err:
        print(f"{err}")
        data['edit_successful'] = False
        data['error'] = f"{err}"

    return web.json_response(data)


@router.post("/invite")
@require_login
async def invite_handler(request: web.Request) -> web.json_response():
    data = {"invite_sent": False, "error": None}
    session = await get_session(request)
    current_user = session.get("user_id")
    req_data = await json_handler(request)
    print(f"INVITE ROUTE: current_user: {current_user}, invite_data: {req_data}")
    invite_email = req_data['invite']['email']
    invite_access_level = req_data['invite']['accessLevel']
    today = datetime.datetime.now(datetime.timezone.utc)
    invite_expires = datetime.timedelta(weeks=2)
    invite_expiry = today + invite_expires
    invite_uuid = uuid4()
    invite_code = invite_uuid.hex

    # Write logic to not duplicate invites
    # Write logic in db.py file to check for expired invites and delete the record on startup
    try:
        with sqlite3.connect(db) as conn:
            cur = conn.cursor()
            cur.execute("""
            INSERT INTO invites (invited_by, invite_email, invite_code, invite_expires, access_level)
            VALUES (?, ?, ?, ?, ?)
            """, (current_user, invite_email, invite_code, invite_expiry, invite_access_level))
            conn.commit()
            data['invite_sent'] = True
    except sqlite3.DatabaseError as err:
        print(f"DATABASE ERROR: {err}")
        data['error'] = "Unable to complete invite."

    # Write logic to actually send the invite email
    return web.json_response(data)


@asyncio.coroutine
@router.post("/upload")
@require_login
async def upload_handler(request: web.Request) -> web.json_response:
    data = {"upload_successful": False, "warnings": [], "error": None}
    session = await get_session(request)
    current_user = session.get("user_id")
    image_data = await request.post()
    counter = 0
    end_count = len(image_data)
    print(f"IMAGE DATA: {image_data}")
    while counter < end_count:
        key = 'image' + str(counter)
        filename = image_data[key].filename
        image_file = image_data[key].file
        image_type = filename.split('.')[-1]
        if image_type == 'jpg':
            image_type = 'jpeg'

        print(f"Handling file {counter} of {end_count}: {filename}")
        # See if file has already been saved
        try:
            with sqlite3.connect(db) as conn:
                cur = conn.cursor()
                cur.execute("""
                SELECT *
                FROM images
                WHERE filename=(?) AND user_id=(?)
                """, (filename, current_user))

                file_exists = False

                for row in cur:
                    if row[4] == filename:
                        print(f"FOUND FILENAME: {filename}")
                        data['warnings'].append(f"Image {filename} already exists!")
                        counter += 1
                        file_exists = True
                        break

                if file_exists:
                    continue
                else:
                    print(f"{filename} not found in database. Continuing to process and save file.")
        except sqlite3.DatabaseError as err:
            print(f"DATABASE ERROR: {err}")
        else:

            # If file doesn't already exist update database for new file and save
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
                if image_type == 'mp4':
                    with open(os.path.join('static/images/', filename), 'wb') as f:
                        video_contents = image_file.read()
                        f.write(video_contents)

                    # No exif for video files
                    vid_creation_date = date.today()

                    # Resize for web and save
                    # orig_vid_size = image_file.size
                    # vid_width_percent = (300 / float(orig_vid_size[0]))
                    # vid_new_height = int((float(orig_vid_size[1]) * float(vid_width_percent)))
                    # web_resized_vid = image_file.resize((300, vid_new_height))
                    # web_size_vid_filename = "web_" + filename
                    # web_resized_vid.save('static/images/' + web_size_vid_filename, image_type.upper(), quality=95)

                    # Create thumbnail and save
                    # vid_thumb_size = 128, 128
                    # vid_thumb_filename = "thumb_" + filename
                    # img.thumbnail(thumb_size)
                    # img.save('static/images/' + thumb_filename, image_type.upper(), quality=95)

                    with sqlite3.connect(db) as conn:
                        cur = conn.cursor()
                        cur.execute("""
                        UPDATE images
                        SET date_taken=(?)
                        WHERE user_id=(?)
                        AND filename=(?)
                        """, (vid_creation_date, current_user, filename))
                        conn.commit()

                    print(f"creation_date for {filename}: {vid_creation_date}")
                    data['upload_successful'] = True

                    counter += 1
                else:
                    with open(os.path.join('static/images/', filename), 'wb') as f:
                        image_contents = image_file.read()
                        f.write(image_contents)

                    # Get exif for date taken
                    img = Image.open(image_file)
                    exif_data = img.getexif()
                    creation_exif_date = exif_data.get(36867)

                    if creation_exif_date is None:
                        creation_date = date.today()
                    else:
                        date_portion = creation_exif_date.split(' ')[0]
                        time_portion = creation_exif_date.split(' ')[1]
                        creation_year = date_portion.split(':')[0]
                        creation_month = date_portion.split(':')[1]
                        creation_day = date_portion.split(':')[2]
                        creation_date = creation_year + "-" + creation_month + "-" + creation_day + "T" + time_portion

                    # Resize for web and save
                    orig_size = img.size
                    width_percent = (300/float(orig_size[0]))
                    new_height = int((float(orig_size[1]) * float(width_percent)))
                    web_resized_img = img.resize((300, new_height))
                    web_size_filename = "web_" + filename
                    web_resized_img.save('static/images/' + web_size_filename, image_type.upper(), quality=95)

                    # Create thumbnail and save
                    thumb_size = 128, 128
                    thumb_filename = "thumb_" + filename
                    img.thumbnail(thumb_size)
                    img.save('static/images/' + thumb_filename, image_type.upper(), quality=95)

                    with sqlite3.connect(db) as conn:
                        cur = conn.cursor()
                        cur.execute("""
                        UPDATE images
                        SET date_taken=(?), web_size_filename=(?), thumbnail_filename=(?)
                        WHERE user_id=(?)
                        AND filename=(?)
                        """, (creation_date, web_size_filename, thumb_filename, current_user, filename))
                        conn.commit()

                    print(f"creation_date for {filename}: {creation_date}")
                    data['upload_successful'] = True

                    counter += 1

    return web.json_response(data)
