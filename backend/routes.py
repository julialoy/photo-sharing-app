# import glob
import os
# import io
from pathlib import Path
# from datetime import date
import asyncio
import datetime
# from email.message import EmailMessage
import json
import random
# import sqlite3
import string
# from threading import Thread
from typing import Awaitable, Callable, List
from uuid import uuid4

from aiohttp_session import setup, get_session, new_session
from aiohttp import web
# from aiosmtplib import send
# from aiosmtplib import SMTP
# from aiosmtplib import SMTPTimeoutError
from PIL import Image

import aiopg.sa
import psycopg2
from sqlalchemy import and_, exc, DateTime, insert, MetaData, Table, Column, ForeignKey, Integer, String, update

from db import (users, images, invites, albums, people,
                people_to_user_relationships, people_to_album_relationships,
                user_to_user_relationships)

# from db import DATABASE

# db = DATABASE
BASE_PATH = Path(__file__).parent
router = web.RouteTableDef()
_WebHandler = Callable[[web.Request], Awaitable[web.StreamResponse]]


def require_login(func: _WebHandler) -> _WebHandler:
    func.__require_login__ = True   # type: ignore
    return func


async def image_to_db(app: web.Application, user_id: Integer, album_id: Integer,
                child_id: Integer, filename: String, web_filename: String,
                thumbnail_filename: String, image_date: String) -> None:
    """Add uploaded image information to db"""
    db = app['db']
    db.dipose()
    try:
        formatted_date = datetime.datetime.strptime(image_date, '%Y-%m-%d')
        with db.connect() as conn:
            await conn.execute(images.insert().values(user_id=user_id, album_key=album_id,
                                                      person_key=child_id, filename=filename,
                                                      web_size_filename=web_filename,
                                                      thumbnail_filename=thumbnail_filename,
                                                      date_taken=formatted_date))
    except exc.SQLAlchemyError as err:
        print(f"ERROR ADDING IMAGE TO DB: {err}")

    # with sqlite3.connect(db) as conn:
    #     cur = conn.cursor()
    #     cur.execute("""
    #     INSERT INTO images (user_key, album_key, child_key, filename, web_size_filename, thumbnail_filename, date_taken)
    #     VALUES (?, ?, ?, ?, ?)
    #     """, (user_id, album_id, child_id, filename, web_filename, thumbnail_filename, image_date))
    #     conn.commit()


async def retrieve_images(app: web.Application, current_user_id: Integer):
    """Retrieve images for specified IDs."""
    db = app['db']
    db.dispose()
    photo_data = []
    id_list = []

    with db.connect() as c:
        selected_user = c.execute(users.select().where(users.c.id == current_user_id))
        for user in selected_user:
            id_list.append(user[0])
        related_users = c.execute(user_to_user_relationships.select()
                                  .where(user_to_user_relationships.c.user_id == current_user_id))
        for r_user in related_users:
            id_list.append(r_user[1])
    print(f"ID LIST: {id_list}")

    try:
        with db.connect() as conn:
            # results = conn.execute(images.select().where(images.c.user_id == current_user_id))
            # # result_rows = results.fetchall()
            # for result in results:
            #     print(f"RESULT: {result}")
            #     photo_data.append(parse_image_data(result)[0])
            for single_id in id_list:
                results = conn.execute(images.select().where(images.c.user_id == single_id))
                # additional_result_rows = additional_results.fetchall()
                for res in results:
                    print(f"RESULT: {res}")
                    p = parse_image_data(res)[0]
                    photo_data.append(p)
                    # if p['photo_id'] not in photo_data:
                    #     photo_data.append(p)
    except exc.SQLAlchemyError as err:
        print(f"ERROR ADDING IMAGES FOR {current_user_id} TO PHOTO DATA: {err}")

    # with sqlite3.connect(db) as conn:
    #     cur = conn.cursor()
    #     cur.execute("""
    #     SELECT * FROM images
    #     WHERE user_id=(?)
    #     """, (current_user_id,))
    #
    #     for row in cur:
    #         photo_data.append(parse_image_data(row)[0])

        #
        # with sqlite3.connect(db) as conn:
        #     new_cur = conn.cursor()
        #     new_cur.execute("""
        #     SELECT * FROM images
        #     WHERE user_id=(?)
        #     """, (single_id,))
        #
        #     for additional_row in new_cur:
        #         photo_data.append(parse_image_data(additional_row)[0])

    print(f"PHOTO DATA: {photo_data}")
    return photo_data


def parse_image_data(db_row):
    """Parse the image data from the database and add to data object to return to clientside as json."""
    parsed_data = []
    NoneType = type(None)
    full_size_loc = '../static/images/' + db_row[4] if len(db_row[4]) >= 1 else ''
    web_size_loc = '../static/images/' + db_row[5] if type(db_row[5]) is not NoneType else full_size_loc
    thumb_size_loc = '../static/images/' + db_row[6] if type(db_row[6]) is not NoneType else full_size_loc
    parsed_data.append({
        'photo_id': db_row[0],
        'user_id': db_row[1],
        'album_id': db_row[2],
        'child_id': db_row[3],
        'filename': db_row[4],
        'web_size_filename': db_row[5],
        'thumbnail_filename': db_row[6],
        'full_size_loc': full_size_loc,
        'web_size_loc': web_size_loc,
        'thumb_size_loc': thumb_size_loc,
        'date_taken': db_row[8].isoformat(),
        'title': db_row[9],
        'description': db_row[10],
    })
    return parsed_data


def order_images(parsed_image_array):
    """Sort image array so most recent appears first."""
    parsed_image_array.sort(key=lambda x: x['date_taken'], reverse=True)


def generate_invite_code():
    """Generate a 5-character invite code."""
    valid_letters = string.ascii_uppercase
    generated_code = ''.join(random.choice(valid_letters) for i in range(5))
    return generated_code


# async def send_invite_email(sender, invite_email, invite_code) -> None:
#     message = EmailMessage()
#     message["From"] = sender
#     message["To"] = invite_email
#     message["Subject"] = "Test JL Photo App Invite"
#     message_str = "{} has invited you to join the test photo app. Use code {} to join".format(sender, invite_code)
#     message.set_content(message_str)
#     await send(
#         message,
#         hostname="smtp.gmail.com",
#         port=587,
#         start_tls=True,
#         username="",
#         password="",
#         timeout=30
#     )


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
    # additional_id = None
    print(f"USER ID: {user_id}")
    db = request.app['db']
    db.dispose()

    try:
        with db.connect() as conn:
            conn.execute(users.select().where(users.c.id == user_id))
        # with sqlite3.connect(db) as conn:
        #     cur = conn.cursor()
        #     cur.execute("""
        #     SELECT * FROM users
        #     WHERE id=(?)
        #     """, (user_id,))
        #
        #     for row in cur:
        #         additional_id = row[5]
    # except sqlite3.DatabaseError as err:
    except exc.SQLAlchemyError as err:
        print(f"ERROR RETRIEVING USER: {err}")

    # print(f"ADDITIONAL IDs: {additional_id}")
    available_photos = await retrieve_images(request.app, user_id)
    # parsed_photos = parse_image_data(available_photos)
    order_images(available_photos)
    return web.json_response(available_photos)


@asyncio.coroutine
@router.post("/login")
async def login_handler(request: web.Request) -> web.json_response:
    print("FIND USER AND LOG IN")
    session = await new_session(request)
    request_json = await json_handler(request)
    print(f"TRY TO LOG IN DATA: {request_json}")
    username = request_json['user']['email']
    password = request_json['user']['password']
    print(f"TRY TO LOG IN USERNAME {username} WITH PASSWORD {password}")
    data = {'logged_in': False, 'user_id': None, 'username': None, 'access_level': None}
    db = request.app['db']
    db.dispose()
    # db_session = request.app['db_session']
    # print(db_session)
    # selected_user = db_session.query(users).filter_by(username=username, password=password).first()
    selected_user = None

    with db.connect() as conn:
        query_stmt = users.select().where(and_(users.c.username == username, users.c.password == password))
        selected_user_result = conn.execute(query_stmt)
        for row in selected_user_result:
            selected_user = row
    print(f"SELECTED USER: {selected_user}")

    if not selected_user:
        print(f"NO USER FOUND {selected_user}")
        return web.json_response(data)
    else:
        data['logged_in'] = True
        data['user_id'] = selected_user[0]
        data['username'] = selected_user[1]
        data['access_level'] = selected_user[3]
        # Delete auth token after certain amount of time (or log out?)
        # This will require user to log back in
        auth_token = uuid4()
        auth_token = auth_token.hex
        session["username"] = username
        session["user_id"] = selected_user[0]
        session["auth_token"] = auth_token
        session["access_level"] = selected_user[3]
        session["logged_in"] = True
        print(f"LOGIN DATA: {data}")
        with db.connect() as conn:
            update_stmt = users.update().where(users.c.username == username).values(auth_token=auth_token)
            conn.execute(update_stmt)
    # with db.connect() as connection:
    #     #selected_user_result = connection.execute(users.select().where(and_(users.c.username == username,
    #      #                                                                   users.c.password == password)))
    #     selected_user_result = connection.execute(db_session.query(users).filter_by(username=username, password=password))
    #     print(selected_user_result)
    #     selected_user = None
    #     for row in selected_user_result:
    #         selected_user = row
    #         print(f"SELECTED USER ROW: {row}")
    #     if not selected_user_result:
    #         print(f"NO USER WITH THAT USERNAME AND PASSWORD FOUND: {selected_user_result}")
    #         return data
    #     else:
    #         data['logged_in'] = True
    #         data['user_id'] = selected_user[0]
    #         data['username'] = selected_user[1]
    #         data['access_level'] = selected_user[3]
    #         # Delete auth token after certain amount of time (or log out?)
    #         # This will require user to log back in
    #         auth_token = uuid4()
    #         auth_token = auth_token.hex
    #         session["username"] = username
    #         session["user_id"] = selected_user[0]
    #         session["auth_token"] = auth_token
    #         session["access_level"] = selected_user[3]
    #         session["logged_in"] = True
    #         print(f"LOGIN DATA: {data}")
    #
    #         await connection.execute(update(users).where(users.c.username == username)
    #                                  .values(users.c.auth_token == auth_token))

    # with sqlite3.connect(db) as conn:
    #     cur = conn.cursor()
    #     cur.execute("""
    #     SELECT * FROM users
    #     """)
    #
    #     for row in cur:
    #         selected_user = row
    #         if selected_user[1] == username and selected_user[2] == password:
    #             data['logged_in'] = True
    #             data['user_id'] = selected_user[0]
    #             data['username'] = selected_user[1]
    #             data['access_level'] = selected_user[3]
    #             # Delete auth token after certain amount of time (or log out?)
    #             # This will require user to log back in
    #             auth_token = uuid4()
    #             auth_token = auth_token.hex
    #             session["username"] = username
    #             session["user_id"] = selected_user[0]
    #             session["auth_token"] = auth_token
    #             session["access_level"] = selected_user[3]
    #             session["logged_in"] = True
    #             print(f"{session}")
    #             cur.execute("""
    #             UPDATE users
    #             SET auth_token = (?)
    #             WHERE username = (?)
    #             """, (auth_token, username))
    #             conn.commit()
    #             break
    print("UPDATED")
    return web.json_response(data)


@asyncio.coroutine
@router.post("/register")
async def registration_handler(request: web.Request) -> web.json_response:
    request_json = await json_handler(request)
    user_email = request_json['user']['email']
    user_password = request_json['user']['password']
    user_access_level = 'primary'
    data = {'is_registered': True, 'username': '', 'user_id': '', 'error': None}
    db = request.app['db']
    db.dispose()

    with db.connect() as conn:
        try:
            insert_stmt = insert(users).values(username=user_email,
                                               password=user_password,
                                               access_level=user_access_level)
            conn.execute(insert_stmt)
        except exc.IntegrityError as err:
            print(f"REGISTRATION ERROR: {err}")
            data['is_registered'] = False
            data['error'] = 'User already exists'
            return web.json_response(data)

        select_stmt = users.select().where(users.c.username == user_email)
        new_user = conn.execute(select_stmt)
        for row in new_user:
            print(f"ROW: {row}")
            data['user_id'] = row[0]
            data['username'] = row[1]

    # try:
    #     with sqlite3.connect(db) as conn:
    #         cur = conn.cursor()
    #         cur.execute("""
    #         INSERT INTO users (username, password, access_level)
    #         VALUES (?, ?, ?)
    #         """, (user_email, user_password, user_access_level))
    #         conn.commit()
    # except sqlite3.IntegrityError as err:
    #     print(f"DATABASE ERROR: {err}")
    #     data['is_registered'] = False
    #     data['error'] = 'User already exists'
    #     return web.json_response({'error': 'User already exists'})
    #
    # with sqlite3.connect(db) as conn:
    #     cur = conn.cursor()
    #     cur.execute("""
    #     SELECT * FROM users
    #     WHERE username=? AND password=?
    #     """, (user_email, user_password))
    #
    #     for row in cur:
    #         selected_user = row
    #
    #     data['user_id'] = selected_user[0]
    #     data['username'] = selected_user[1]

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
    # auth_token = session.get("auth_token")
    # user_id = session.get("user_id")
    print(f"LOG OUT {session}")
    db = request.app['db']
    db.dispose()
    try:
        with db.connect() as conn:
            update_stmt = users.update().where(users.c.username == username).values(auth_token=None)
            conn.execute(update_stmt)
        session["user_id"] = None
        session["username"] = None
        session["auth_token"] = None
        session["access_level"] = None
        session["logged_in"] = False
        data = {"log_out_successful": True}
    except exc.DatabaseError as err:
        print(f"ERROR: {err}")
        data = {"log_out_successful": False}

    # try:
    #     with sqlite3.connect(db) as conn:
    #         cur = conn.cursor()
    #         cur.execute("""
    #         UPDATE users
    #         SET auth_token = (?)
    #         WHERE auth_token = (?)
    #         AND username = (?)
    #         """, (None, auth_token, username))
    #         conn.commit()
    #     session["user_id"] = None
    #     session["username"] = None
    #     session["auth_token"] = None
    #     session["access_level"] = None
    #     session["logged_in"] = False
    #     data = {"log_out_successful": True}
    # except sqlite3.DatabaseError as err:
    #     print(f"Something went wrong: {err}")
    #     data = {"log_out_successful": False}

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
    db = request.app['db']
    db.dispose()
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
        with db.connect() as conn:
            date_update = (images.update().
                           where(and_(images.c.user_id == current_user,
                                      images.c.filename == filename,
                                      images.c.id == photo_id)).
                           values(date_taken=new_date))
            conn.execute(date_update)
            data['edit_successful'] = True
    except exc.SQLAlchemyError as err:
        print(f"{err}")
        data['edit_successful'] = False
        data['error'] = f"{err}"
    # try:
    #     with sqlite3.connect(db) as conn:
    #         cur = conn.cursor()
    #         cur.execute("""
    #         UPDATE images
    #         SET date_taken=(?)
    #         WHERE id=(?)
    #         AND user_id=(?)
    #         AND filename=(?)
    #         """, (new_date, photo_id, current_user, filename))
    #         conn.commit()
    #         data['edit_successful'] = True
    #     print(f"EDIT SUCCESSFUL")
    # except sqlite3.DatabaseError as err:
    #     print(f"{err}")
    #     data['edit_successful'] = False
    #     data['error'] = f"{err}"

    return web.json_response(data)


@router.post("/invite")
@require_login
async def invite_handler(request: web.Request) -> web.json_response():
    data = {"invite_sent": False, "invite_code": None, "error": None}
    session = await get_session(request)
    current_user = session.get("user_id")
    # current_user_username = session.get("username")
    req_data = await json_handler(request)
    print(f"INVITE ROUTE: current_user: {current_user}, invite_data: {req_data}")
    invite_email = req_data['invite']['email']
    invite_access_level = req_data['invite']['accessLevel']
    today = datetime.datetime.now(datetime.timezone.utc)
    invite_expires = datetime.timedelta(weeks=2)
    invite_expiry = today + invite_expires
    invite_code = generate_invite_code()
    db = request.app['db']
    db.dispose()

    if invite_access_level is None or len(invite_access_level) == 0:
        data['error'] = "Invalid access level. Please try again."
        return web.json_response(data)
    elif invite_email is None or len(invite_email) == 0:
        data['error'] = "Invalid email. Please try again."
        return web.json_response(data)

    # Write logic to not duplicate invites
    try:
        with db.connect() as conn:
            insert_stmt = (insert(invites).values(invited_by=current_user,
                                                  invite_code=invite_code,
                                                  invite_expires=invite_expiry,
                                                  access_level=invite_access_level))
            conn.execute(insert_stmt)
            data['invite_sent'] = True
            data['invite_code'] = invite_code
    except exc.SQLAlchemyError as err:
        print(f"DATABASE ERROR: {err}")
        data['error'] = "Unable to complete invite."

    # try:
    #     with sqlite3.connect(db) as conn:
    #         cur = conn.cursor()
    #         cur.execute("""
    #         INSERT INTO invites (invited_by, invite_email, invite_code, invite_expires, access_level)
    #         VALUES (?, ?, ?, ?, ?)
    #         """, (current_user, invite_email, invite_code, invite_expiry, invite_access_level))
    #         conn.commit()
    #         data['invite_sent'] = True
    #         data['invite_code'] = invite_code
    # except sqlite3.DatabaseError as err:
    #     print(f"DATABASE ERROR: {err}")
    #     data['error'] = "Unable to complete invite."

    # Send invite email
    # try:
    #     await send_invite_email(current_user_username, invite_email, invite_code)
    #     data['invite_sent'] = True
    # except SMTPTimeoutError as err:
    #     print(f"RUNTIME ERROR: {err}")
    #     data['invite_sent'] = False
    # else:
    #     print(f"OMG something happened")

    return web.json_response(data)


@asyncio.coroutine
@router.post("/register-invite")
async def register_invite_handler(request: web.Request) -> web.json_response:
    print(f"REGISTER THE INVITE")
    data = {"invite_redeemed": False, "error": None, "username": None, "user_id": None, "user_access_level": None}
    session = await new_session(request)
    invite_confirm_data = await json_handler(request)
    invitee_email = invite_confirm_data["inviteInfo"]["email"]
    invitee_code = invite_confirm_data["inviteInfo"]["code"]
    invitee_access_level = None
    invited_by = None
    invitee_key = None
    db = request.app['db']
    db.dispose()
    print(f"Invitee_email: {invitee_email}; Invitee_code: {invitee_code}")

    try:
        with db.connect() as conn:
            select_stmt = (invites.select()
                           .where(invites.c.invite_code == invitee_code))
            selected_invites = conn.execute(select_stmt)

            for row in selected_invites:
                print(f"INVITES ROW: {row}")
                tdy = str(datetime.datetime.now(datetime.timezone.utc))
                if row[3].isoformat() < tdy:
                    data['invite_redeemed'] = False
                    data['error'] = "Invite code has expired."
                    return web.json_response(data)
                else:
                    data['invite_redeemed'] = True
                    invitee_access_level = row[4]
                    invited_by = row[1]
                    invitee_key = row[0]
    except exc.SQLAlchemyError as err:
        data['invite_redeemed'] = False
        data['error'] = "There was a database error."
        print(f"REDEEM INVITE ERROR: {err}")

    if data['invite_redeemed']:
        print(f"INVITE REDEEMED")
        temp_password_uuid4 = uuid4()
        temp_password = temp_password_uuid4.hex
        with db.connect() as conn:
            insert_users_stmt = (insert(users).values(username=invitee_email,
                                                      password=temp_password,
                                                      access_level=invitee_access_level))
            conn.execute(insert_users_stmt)
            new_user = conn.execute(users.select()
                                    .where(and_(users.c.username == invitee_email,
                                                users.c.password == temp_password)))
            print(f"NEW USER: {new_user}")
            new_user_id = None
            for row in new_user:
                new_user_id = row[0]
            insert_users_relationship = (insert(user_to_user_relationships)
                                         .values(user_id=new_user_id, linked_to=invited_by))
            conn.execute(insert_users_relationship)
            auth_token = uuid4()
            auth_token = auth_token.hex
            session['username'] = invitee_email
            session['user_id'] = new_user_id
            session['auth_token'] = auth_token
            session['access_level'] = invitee_access_level
            session['logged_in'] = True
            data['username'] = invitee_email
            data['user_id'] = new_user_id
            data['user_access_level'] = invitee_access_level
            print(f"{session}")
            update_auth_token = (users.update().where(users.c.username == invitee_email)
                                 .values(auth_token=auth_token))
            conn.execute(update_auth_token)
            delete_invite = (invites.delete().where(invites.c.invite_code == invitee_code))
            conn.execute(delete_invite)

    # try:
    #     with sqlite3.connect(db) as conn:
    #         cur = conn.cursor()
    #         cur.execute("""
    #         SELECT * FROM invites
    #         WHERE invite_email=? and invite_code=?
    #         """, (invitee_email, invitee_code))
    #
    #         for row in cur:
    #             print(f"INVITES ROW: {row}")
    #             tdy = str(datetime.datetime.now(datetime.timezone.utc))
    #             if row[4] < tdy:
    #                 data["invite_redeemed"] = False
    #                 data["error"] = "Invite code has expired."
    #                 return web.json_response(data)
    #             else:
    #                 data["invite_redeemed"] = True
    #                 invitee_access_level = row[5]
    #                 invited_by = row[1]
    #                 invitee_key = row[0]
    # except sqlite3.DatabaseError as err:
    #     data["invite_redeemed"] = False
    #     data["error"] = "There was a database error."
    #     print(f"REDEEM INVITE ERROR: {err}")
    #
    # if data["invite_redeemed"]:
    #     print(f"INVITE REDEEMED")
    #     temp_password_uuid4 = uuid4()
    #     temp_password = temp_password_uuid4.hex
    #     with sqlite3.connect(db) as conn:
    #         cur = conn.cursor()
    #         cur.execute("""
    #         INSERT INTO users (username, password, access_level, linked_to)
    #         VALUES (?, ?, ?, ?)
    #         """, (invitee_email, temp_password, invitee_access_level, invited_by))
    #         auth_token = uuid4()
    #         auth_token = auth_token.hex
    #         session["username"] = invitee_email
    #         session["user_id"] = cur.lastrowid
    #         session["auth_token"] = auth_token
    #         session["access_level"] = invitee_access_level
    #         session["logged_in"] = True
    #         data["username"] = invitee_email
    #         data["user_id"] = cur.lastrowid
    #         data["user_access_level"] = invitee_access_level
    #         print(f"{session}")
    #         cur.execute("""
    #         UPDATE users
    #         SET auth_token = (?)
    #         WHERE username = (?)
    #         """, (auth_token, invitee_email))
    #         conn.commit()
    #         cur.execute("""
    #         DELETE FROM invites
    #         WHERE id=?
    #         """, (invitee_key,))
    #         conn.commit()

    print(f"INVITE DATA: {data}")
    return web.json_response(data)


@asyncio.coroutine
@router.post("/reset-password")
@require_login
async def reset_password_handler(request: web.Request) -> web.json_response:
    data = {"password_reset_successful": False, "error": None}
    session = await get_session(request)
    password_data = await json_handler(request)
    new_password = password_data["user"]["password"]
    current_user_id = session.get("user_id")
    db = request.app['db']
    db.dispose()

    try:
        with db.connect() as conn:
            update_stmt = (users.update().where(users.c.id == current_user_id).values(password=new_password))
            conn.execute(update_stmt)
        data['password_reset_successful'] = True
    except exc.SQLAlchemyError as err:
        print(f"RESET PASSWORD ERROR: {err}")
        data['error'] = "A database error occurred. Unable to reset password."

    # try:
    #     with sqlite3.connect(db) as conn:
    #         cur = conn.cursor()
    #         cur.execute("""
    #         UPDATE users
    #         SET password=(?)
    #         WHERE id=(?)
    #         """, (new_password, current_user_id))
    #         conn.commit()
    #         data["password_reset_successful"] = True
    # except sqlite3.DatabaseError as err:
    #     print(f"RESET PASSWORD ERROR: {err}")
    #     data["error"] = "A database error occurred. Unable to reset password."

    return web.json_response(data)


@asyncio.coroutine
@router.post("/upload")
@require_login
async def upload_handler(request: web.Request) -> web.json_response:
    data = {"upload_successful": False, "warnings": [], "error": None}
    session = await get_session(request)
    current_user = session.get("user_id")
    image_data = await request.post()
    db = request.app['db']
    db.dispose()
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
            with db.connect() as conn:
                query_stmt = (images.select()
                              .where(and_(images.c.filename == filename, images.c.user_id == current_user)))
                selected_images = conn.execute(query_stmt)
                file_exists = False
                for i in selected_images:
                    print(f"IMAGE: {i}")
                    if i[4] == filename:
                        data['warnings'].append(f"Image {filename} already exists!")
                        counter += 1
                        file_exists = True
                        break
                if file_exists:
                    continue
                else:
                    print(f"{filename} not found in database. Continuing to process and save file.")

        except exc.SQLAlchemyError as err:
            print(f"IMAGES ERROR: {err}")
        else:
            # If file doesn't already exist update database for new file and save
            try:
                with db.connect() as conn:
                    insert_stmt = insert(images).values(user_id=current_user, filename=filename)
                    conn.execute(insert_stmt)
            except exc.SQLAlchemyError as err:
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
                    vid_creation_date = datetime.datetime.today()

                    with db.connect() as conn:
                        update_date_stmt = (images.update()
                                            .where(images.c.filname == filename)
                                            .values(date_taken=vid_creation_date))
                        conn.execute(update_date_stmt)

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
                        creation_date = datetime.datetime.today()
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

                    with db.connect() as conn:
                        update_img_stmt = (images.update()
                                           .where(and_(images.c.user_id == current_user, images.c.filename == filename))
                                           .values(date_taken=creation_date,
                                                   web_size_filename=web_size_filename,
                                                   thumbnail_filename=thumb_filename))
                        conn.execute(update_img_stmt)

                    print(f"creation_date for {filename}: {creation_date}")
                    data['upload_successful'] = True

                    counter += 1

        # try:
        #     with sqlite3.connect(db) as conn:
        #         cur = conn.cursor()
        #         cur.execute("""
        #         SELECT *
        #         FROM images
        #         WHERE filename=(?) AND user_id=(?)
        #         """, (filename, current_user))
        #
        #         file_exists = False
        #
        #         for row in cur:
        #             if row[4] == filename:
        #                 print(f"FOUND FILENAME: {filename}")
        #                 data['warnings'].append(f"Image {filename} already exists!")
        #                 counter += 1
        #                 file_exists = True
        #                 break
        #
        #         if file_exists:
        #             continue
        #         else:
        #             print(f"{filename} not found in database. Continuing to process and save file.")
        # except sqlite3.DatabaseError as err:
        #     print(f"DATABASE ERROR: {err}")
        # else:
        #
        #     # If file doesn't already exist update database for new file and save
        #     try:
        #         with sqlite3.connect(db) as conn:
        #             cur = conn.cursor()
        #             cur.execute("""
        #             INSERT INTO images (user_id, filename)
        #             VALUES (?, ?)
        #             """, (current_user, filename))
        #             conn.commit()
        #     except sqlite3.DatabaseError as err:
        #         data['upload_successful'] = False
        #         data['error'] = err
        #         print(f"Could not save image: {err}")
        #         return web.json_response(data)
        #     else:
        #         if image_type == 'mp4':
        #             with open(os.path.join('static/images/', filename), 'wb') as f:
        #                 video_contents = image_file.read()
        #                 f.write(video_contents)
        #
        #             # No exif for video files
        #             vid_creation_date = datetime.datetime.today()
        #
        #             # Resize for web and save
        #             # orig_vid_size = image_file.size
        #             # vid_width_percent = (300 / float(orig_vid_size[0]))
        #             # vid_new_height = int((float(orig_vid_size[1]) * float(vid_width_percent)))
        #             # web_resized_vid = image_file.resize((300, vid_new_height))
        #             # web_size_vid_filename = "web_" + filename
        #             # web_resized_vid.save('static/images/' + web_size_vid_filename, image_type.upper(), quality=95)
        #
        #             # Create thumbnail and save
        #             # vid_thumb_size = 128, 128
        #             # vid_thumb_filename = "thumb_" + filename
        #             # img.thumbnail(thumb_size)
        #             # img.save('static/images/' + thumb_filename, image_type.upper(), quality=95)
        #
        #             with sqlite3.connect(db) as conn:
        #                 cur = conn.cursor()
        #                 cur.execute("""
        #                 UPDATE images
        #                 SET date_taken=(?)
        #                 WHERE user_id=(?)
        #                 AND filename=(?)
        #                 """, (vid_creation_date, current_user, filename))
        #                 conn.commit()
        #
        #             print(f"creation_date for {filename}: {vid_creation_date}")
        #             data['upload_successful'] = True
        #
        #             counter += 1
        #         else:
        #             with open(os.path.join('static/images/', filename), 'wb') as f:
        #                 image_contents = image_file.read()
        #                 f.write(image_contents)
        #
        #             # Get exif for date taken
        #             img = Image.open(image_file)
        #             exif_data = img.getexif()
        #             creation_exif_date = exif_data.get(36867)
        #
        #             if creation_exif_date is None:
        #                 creation_date = datetime.datetime.today()
        #             else:
        #                 date_portion = creation_exif_date.split(' ')[0]
        #                 time_portion = creation_exif_date.split(' ')[1]
        #                 creation_year = date_portion.split(':')[0]
        #                 creation_month = date_portion.split(':')[1]
        #                 creation_day = date_portion.split(':')[2]
        #                 creation_date = creation_year + "-" + creation_month + "-" + creation_day + "T" + time_portion
        #
        #             # Resize for web and save
        #             orig_size = img.size
        #             width_percent = (300/float(orig_size[0]))
        #             new_height = int((float(orig_size[1]) * float(width_percent)))
        #             web_resized_img = img.resize((300, new_height))
        #             web_size_filename = "web_" + filename
        #             web_resized_img.save('static/images/' + web_size_filename, image_type.upper(), quality=95)
        #
        #             # Create thumbnail and save
        #             thumb_size = 128, 128
        #             thumb_filename = "thumb_" + filename
        #             img.thumbnail(thumb_size)
        #             img.save('static/images/' + thumb_filename, image_type.upper(), quality=95)
        #
        #             with sqlite3.connect(db) as conn:
        #                 cur = conn.cursor()
        #                 cur.execute("""
        #                 UPDATE images
        #                 SET date_taken=(?), web_size_filename=(?), thumbnail_filename=(?)
        #                 WHERE user_id=(?)
        #                 AND filename=(?)
        #                 """, (creation_date, web_size_filename, thumb_filename, current_user, filename))
        #                 conn.commit()
        #
        #             print(f"creation_date for {filename}: {creation_date}")
        #             data['upload_successful'] = True
        #
        #             counter += 1

    return web.json_response(data)
