import asyncio
import datetime
# from email.message import EmailMessage
import functools
import io
import urllib.request
from io import BytesIO
import json
import logging
import os
import random
import string
from pathlib import Path
from typing import Awaitable, Callable
from uuid import uuid4
from urllib import request

from aiohttp import web
from aiohttp_session import setup, get_session, new_session
# from aiosmtplib import send
# from aiosmtplib import SMTP
# from aiosmtplib import SMTPTimeoutError
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
import logging
from PIL import Image
from sqlalchemy import and_, exc, insert, Integer, String

from db import (users, images, invites, albums, people,
                people_to_user_relationships, people_to_album_relationships,
                user_to_user_relationships, people_to_image_relationships)
from settings import access_key, secret_key

BASE_PATH = Path(__file__).parent
router = web.RouteTableDef()
_WebHandler = Callable[[web.Request], Awaitable[web.StreamResponse]]
MY_BUCKET_NAME = 'hoardpicsbucket'

MY_BUCKET_CONFIG = Config(
    region_name='us-east-2',
    signature_version='s3v4',
    retries={
        'max_attempts': 10,
        'mode': 'standard'
    }
)


def require_login(func: _WebHandler) -> _WebHandler:
    func.__require_login__ = True   # type: ignore
    return func


# From boto3  Amazon S3 examples
async def create_presigned_url(bucket_name, object_name, expiration=3600):
    """Generate a presigned URL to invoke an S3.Client method."""
    # s3_client = boto3.client('s3',
    #                          config=MY_BUCKET_CONFIG,
    #                          aws_access_key_id=access_key,
    #                          aws_secret_access_key=secret_key)
    s3_client = boto3.client('s3')

    try:
        response = s3_client.generate_presigned_url('get_object',
                                                    Params={'Bucket': bucket_name,
                                                            'Key': object_name},
                                                    ExpiresIn=expiration)
    except ClientError as e:
        logging.error(e)
        print(f"Error creating presigned URL: {e}")
        return None

    # Presigned URL should be in response
    return response


async def retrieve_people_tags(app: web.Application, current_user_id: Integer) -> list:
    """Retrieve and return a list of people tags added by the current user."""
    people_tag_list = []
    db = app['db']
    db.dispose()

    try:
        with db.connect() as conn:
            query_stmt = (people_to_user_relationships.select()
                          .where(people_to_user_relationships.c.linked_to == current_user_id))
            user_people = conn.execute(query_stmt)
            for person in user_people:
                person_query = (people.select().where(people.c.id == person.person_id))
                person_info = conn.execute(person_query)
                for p in person_info:
                    new_person = {'person_id': p.id, 'person_first_name': p.first_name, 'person_last_name': p.last_name}
                    people_tag_list.append(new_person)
    except exc.SQLAlchemyError as err:
        print(f"RETRIEVE PEOPLE TAGS ERROR: {err}")

    return people_tag_list


async def image_to_db(app: web.Application, user_id: Integer, album_id: Integer,
                      child_id: Integer, filename: String, web_filename: String,
                      thumbnail_filename: String, image_date: String) -> None:
    """Add uploaded image information to db"""
    db = app['db']
    db.dipose()
    try:
        formatted_date = datetime.datetime.strptime(image_date, '%Y-%m-%d')
        with db.connect() as conn:
            img_insert_stmt = (images.insert().values(user_id=user_id, album_key=album_id, filename=filename,
                                                      web_size_filename=web_filename,
                                                      thumbnail_filename=thumbnail_filename, date_taken=formatted_date)
                               .returning(images.c.id))
            return_stmt = conn.execute(img_insert_stmt)
            new_img_id = return_stmt.fetchone()[0]
            if child_id:
                tag_insert_stmt = (people_to_image_relationships.insert().values(image_id=new_img_id,
                                                                                 person_id=child_id))
                conn.execute(tag_insert_stmt)
    except exc.SQLAlchemyError as err:
        print(f"ERROR ADDING IMAGE TO DB: {err}")


async def retrieve_images(app: web.Application, current_user_id: Integer) -> list:
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

    try:
        with db.connect() as conn:
            for single_id in id_list:
                results = conn.execute(images.select().where(images.c.user_id == single_id))
                # Only try to parse image data if user has photos available
                try:
                    for res in results:
                        p = parse_image_data(app, res)[0]
                        photo_data.append(p)
                except AttributeError as err:
                    print(f"ERROR PARSING IMAGE DATA: {err}")
    except exc.SQLAlchemyError as err:
        print(f"ERROR ADDING IMAGES FOR {current_user_id} TO PHOTO DATA: {err}")
    print(f"PHOTO DATA: {photo_data}")
    return photo_data


def parse_image_data(app: web.Application, db_row) -> list:
    """Parse the image data from the database and add to data object to return to clientside as json."""
    db = app['db']
    db.dispose()
    parsed_data = []
    NoneType = type(None)
    photo_id = db_row[0]
    full_size_loc = '../frontend/photo-app/public/user_images/' + db_row[4] if len(db_row[4]) >= 1 else ''
    web_size_loc = '../frontend/photo-app/public/user_images/' + db_row[5] if type(db_row[5]) is not NoneType else full_size_loc
    thumb_size_loc = '../frontend/photo-app/public/user_images/' + db_row[6] if type(db_row[6]) is not NoneType else full_size_loc
    child_ids = []

    with db.connect() as conn:
        query_stmt = (people_to_image_relationships.select()
                      .where(people_to_image_relationships.c.image_id == photo_id))
        returned_query = conn.execute(query_stmt)
        query_results = returned_query.fetchall()

        for result in query_results:
            person_id = result[1]
            people_qry_stmt = (people.select().where(people.c.id == person_id))
            returned_qry = conn.execute(people_qry_stmt)
            qry_results = returned_qry.fetchall()
            if qry_results is not None:
                for r in qry_results:
                    if r not in child_ids:
                        id_data = r[0]
                        child_ids.append(id_data)

    parsed_data.append({
        'photo_id': photo_id,
        'user_id': db_row[1],
        'album_id': db_row[2],
        'child_id': child_ids,
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


def order_images(parsed_image_array) -> None:
    """Sort image array so most recent appears first."""
    parsed_image_array.sort(key=lambda x: x['date_taken'], reverse=True)


# Not used?
# async def insert_person_tag(app: web.Application, image_data) -> list:
#     """Insert linked person ids to image data for use by frontend."""
#     db = app['db']
#     db.dispose()
#
#     for img in image_data:
#         with db.connect() as conn:
#             query_stmt = (people_to_image_relationships.select()
#                           .where(people_to_image_relationships.c.image_id == img['photo_id']))
#             result = conn.execute(query_stmt)
#             result = result.fetchall()
#             if result:
#                 for r in result:
#                     person_tag_id = r[1]
#                     img['child_id'].append(person_tag_id)
#             else:
#                 continue
#
#     return image_data

# From Boto3 documentation and erangad.medium.com/upload-a-remote-image-to-s3-without-saving-it-first-0with-python
async def upload_media(upload_image, file_name, object_name=None):
    """Upload a file to an S3 bucket

    :param file_name: File to upload
    :param object_name: S3 object name. If not specified then file_name is used
    :return: True if file was uploaded, else False
    """

    # print(f"BUCKET NAME: {bucket.name}")

    # If S3 object_name was not specified, use file_name
    if object_name is None:
        object_name = os.path.basename(file_name)

    # Upload the file
    # s3_client = boto3.client('s3')
    s3_client = boto3.client('s3',
                             config=MY_BUCKET_CONFIG,
                             aws_access_key_id=access_key,
                             aws_secret_access_key=secret_key)
    try:
        s3_client.upload_fileobj(upload_image, MY_BUCKET_NAME, object_name)
        print(f"Trying to upload image")
        #with open(upload_image, "rb") as f:
            #s3_client.upload_fileobj(f, 'hoardpicsbucket', object_name)
            #s3_client.upload_file(f, 'hoardpicsbucket', object_name)
    except ClientError as e:
        logging.error(e)
        print(f"Upload error: {e}")
        return False
    print(f"Image uploaded")
    return True


def fix_image_orientation(im):
    """
    Taken from Stack Overflow answer for fixing exif orientation.
    -----------
    Apply Image.transpose to ensure 0th row of pixels is at the visual
    top of the image, and 0th column is the visual left-hand side.
    Return the original image if unable to determine the orientation.

    As per CIPA DC-008-2012, the orientation field contains an integer,
    1 through 8. Other values are reserved.

    Parameters
    ----------
    im: PIL.Image
       The image to be rotated.
    """

    exif_orientation_tag = 0x0112
    exif_transpose_sequences = [                   # Val  0th row  0th col
        [],                                        #  0   (reserved)
        [],                                        #  1   top      left
        [Image.FLIP_LEFT_RIGHT],                   #  2   top      right
        [Image.ROTATE_180],                        #  3   bottom   right
        [Image.FLIP_TOP_BOTTOM],                   #  4   bottom   left
        [Image.FLIP_LEFT_RIGHT, Image.ROTATE_90],  #  5   left     top
        [Image.ROTATE_270],                        #  6   right    top
        [Image.FLIP_TOP_BOTTOM, Image.ROTATE_90],  #  7   right    bottom
        [Image.ROTATE_90],                         #  8   left     bottom
    ]

    try:
        seq = exif_transpose_sequences[im._getexif()[exif_orientation_tag]]
    except Exception:
        return im
    else:
        return functools.reduce(type(im).transpose, seq, im)


def generate_invite_code() -> str:
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
#         hostname="",
#         port=,
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
async def index_handler(request: web.Request) -> web.json_response:
    data = {"photos": None, "tags": None}
    session = await get_session(request)
    username = session.get("username")
    user_id = session.get("user_id")
    db = request.app['db']
    db.dispose()

    try:
        with db.connect() as conn:
            conn.execute(users.select().where(users.c.id == user_id))
    except exc.SQLAlchemyError as err:
        print(f"ERROR RETRIEVING USER: {err}")

    available_photos = await retrieve_images(request.app, user_id)
    order_images(available_photos)
    people_tags = await retrieve_people_tags(request.app, user_id)
    data['photos'] = available_photos
    data['tags'] = people_tags
    return web.json_response(data)


@asyncio.coroutine
@router.post("/login")
async def login_handler(request: web.Request) -> web.json_response:
    print(f"HIT LOGIN")
    session = await new_session(request)
    request_json = await json_handler(request)
    username = request_json['user']['email']
    password = request_json['user']['password']
    data = {'logged_in': False, 'user_id': None, 'username': None, 'access_level': None}
    db = request.app['db']
    db.dispose()
    selected_user = None
    print(f"Trying to login: {username}")
    with db.connect() as conn:
        query_stmt = users.select().where(and_(users.c.username == username, users.c.password == password))
        selected_user_result = conn.execute(query_stmt)
        for row in selected_user_result:
            selected_user = row

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
        with db.connect() as conn:
            update_stmt = users.update().where(users.c.username == username).values(auth_token=auth_token)
            conn.execute(update_stmt)

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
            data['user_id'] = row[0]
            data['username'] = row[1]

    return web.json_response(data)


@asyncio.coroutine
@router.post("/logged_in")
async def logged_in_handler(request: web.Request) -> web.json_response:
    data = {"user_id": None, "username": None, "access_level": None, "is_logged_in": False}
    session = await get_session(request)
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

    return web.json_response(data)


@asyncio.coroutine
@router.post("/edit")
@require_login
async def edit_handler(request: web.Request) -> web.json_response:
    data = {'edit_successful': False, 'warnings': [], 'error': None}
    session = await get_session(request)
    current_user = session.get('user_id')
    edited_data = await json_handler(request)
    db = request.app['db']
    db.dispose()

    photo_id = edited_data['photo']['id']
    filename = edited_data['photo']['filename']
    orig_tag_list = edited_data['photo']['currTags']
    new_tag_list = edited_data['photo']['newTags']

    if "T" in edited_data['photo']['currDate']:
        orig_date = edited_data['photo']['currDate'].split('T')[0]
    else:
        orig_date = edited_data['photo']['currDate']

    new_date = edited_data['photo']['newDate']
    orig_desc = edited_data['photo']['currPhotoDesc']
    new_desc = edited_data['photo']['newPhotoDesc']

    if orig_date == new_date:
        data['warnings'].append("New date matched original")

    if orig_desc == new_desc:
        data['warnings'].append("New description matched original")

    if orig_tag_list == new_tag_list:
        data['warnings'].append("New tags matched original")

    if orig_date == new_date and orig_desc == new_desc and orig_tag_list == new_tag_list:
        data['edit_successful'] = True
        data['warnings'] = "No new changes were submitted!"
        return web.json_response(data)

    try:
        with db.connect() as conn:
            date_update = (images.update()
                           .where(and_(images.c.user_id == current_user,
                                       images.c.filename == filename,
                                       images.c.id == photo_id))
                           .values(date_taken=new_date, description=new_desc))
            conn.execute(date_update)

            # Add any new person tags
            for tag in new_tag_list:
                if tag not in orig_tag_list:
                    # Check database to make sure entry doesn't exist
                    tag_insert_slct = (people_to_image_relationships
                                       .select()
                                       .where(and_(people_to_image_relationships.c.image_id == photo_id,
                                                   people_to_image_relationships.c.person_id == tag)))
                    return_insert_slct = conn.execute(tag_insert_slct)
                    returned_tag = return_insert_slct.fetchone()
                    if not returned_tag:
                        tag_insert = (people_to_image_relationships.insert().values(image_id=photo_id, person_id=tag))
                        conn.execute(tag_insert)

            # Delete any person tags the user no longer wants associated with image
            for old_tag in orig_tag_list:
                if old_tag not in new_tag_list:
                    # Check database to make sure entry doesn't exist
                    tag_delete_slct = (people_to_image_relationships
                                       .select()
                                       .where(and_(people_to_image_relationships.c.image_id == photo_id,
                                                   people_to_image_relationships.c.person_id == old_tag)))
                    return_del_select = conn.execute(tag_delete_slct)
                    tag_to_del = return_del_select.fetchone()
                    if tag_to_del:
                        try:
                            tag_delete_stmt = (people_to_image_relationships.delete()
                                               .where(and_(people_to_image_relationships.c.image_id == photo_id,
                                                           people_to_image_relationships.c.person_id == old_tag)))
                            conn.execute(tag_delete_stmt)
                        except exc.SQLAlchemyError as err:
                            print(f"Delete unsuccessful: {err}")
            data['edit_successful'] = True
    except exc.SQLAlchemyError as err:
        print(f"{err}")
        data['edit_successful'] = False
        data['error'] = "Unable to save tags"

    return web.json_response(data)


@router.post("/add-person")
@require_login
async def add_person_handler(request: web.Request) -> web.json_response:
    data = {'person_added': False, 'current_tags': None, 'error': None}
    session = await get_session(request)
    current_user = session.get('user_id')
    req_data = await json_handler(request)
    new_first_name = req_data['newPerson']['first']
    new_last_name = req_data['newPerson']['last']
    db = request.app['db']
    db.dispose()

    if len(new_first_name) == 0 and len(new_last_name) == 0:
        data['error'] = "No person data provided. Could not save."
        return web.json_response(data)

    try:
        with db.connect() as conn:
            prsn_insert_stmt = (insert(people)
                                .values(first_name=new_first_name, last_name=new_last_name)
                                .returning(people.c.id))
            rtrn_stmt = conn.execute(prsn_insert_stmt)
            person_id = rtrn_stmt.fetchone()[0]
            prsn_to_prsn = insert(people_to_user_relationships).values(person_id=person_id, linked_to=current_user)
            conn.execute(prsn_to_prsn)
            data['person_added'] = True
            data['error'] = None
            data['current_tags'] = await retrieve_people_tags(request.app, current_user)
    except exc.SQLAlchemyError as err:
        print(f"DATABASE ERROR: {err}")
        data['error'] = "Unable to save new person"

    return web.json_response(data)


@router.post("/delete-tag")
@require_login
async def delete_tag_handler(request: web.Request) -> web.json_response:
    data = {'success': False, 'current_tags': None, 'error': None}
    session = await get_session(request)
    current_user = session.get("user_id")
    raw_tag_data = await json_handler(request)
    tag_lst = raw_tag_data['deleteTags']
    db = request.app['db']
    db.dispose()

    if len(tag_lst) == 0:
        data['success'] = False
        data['error'] = "No tag to delete."
        data['current_tags'] = None
    else:
        try:
            with db.connect() as conn:
                for tag in tag_lst:
                    tag_delete_stmt = (people_to_user_relationships.delete()
                                       .where(and_(people_to_user_relationships.c.person_id == tag,
                                                   people_to_user_relationships.c.linked_to == current_user)))
                    conn.execute(tag_delete_stmt)
            data['success'] = True
            data['current_tags'] = await retrieve_people_tags(request.app, current_user)
        except exc.SQLAlchemyError as err:
            print(f"Unable to complete delete: {err}")
            data['error'] = "Unable to delete tag."

    return web.json_response(data)


@router.post("/invite")
@require_login
async def invite_handler(request: web.Request) -> web.json_response:
    data = {'invite_sent': False, 'invite_code': None, 'error': None}
    session = await get_session(request)
    current_user = session.get("user_id")
    req_data = await json_handler(request)
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
        data['error'] = "Unable to complete invite"

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
    data = {'invite_redeemed': False, 'error': None, 'username': None, 'user_id': None, 'user_access_level': None}
    session = await new_session(request)
    invite_confirm_data = await json_handler(request)
    invitee_email = invite_confirm_data['inviteInfo']['email']
    invitee_code = invite_confirm_data['inviteInfo']['code']
    invitee_access_level = None
    invited_by = None
    invitee_key = None
    db = request.app['db']
    db.dispose()

    try:
        with db.connect() as conn:
            select_stmt = (invites.select()
                           .where(invites.c.invite_code == invitee_code))
            selected_invites = conn.execute(select_stmt)

            for row in selected_invites:
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
            update_auth_token = (users.update().where(users.c.username == invitee_email)
                                 .values(auth_token=auth_token))
            conn.execute(update_auth_token)
            delete_invite = (invites.delete().where(invites.c.invite_code == invitee_code))
            conn.execute(delete_invite)

    return web.json_response(data)


@asyncio.coroutine
@router.post("/reset-password")
@require_login
async def reset_password_handler(request: web.Request) -> web.json_response:
    data = {'password_reset_successful': False, 'error': None}
    session = await get_session(request)
    password_data = await json_handler(request)
    new_password = password_data['user']['password']
    current_user_id = session.get('user_id')
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

    return web.json_response(data)


@asyncio.coroutine
@router.post("/upload")
@require_login
async def upload_handler(request: web.Request) -> web.json_response:
    data = {'upload_successful': False, 'warnings': [], 'error': None}
    session = await get_session(request)
    current_user = session.get('user_id')
    image_data = await request.post()
    db = request.app['db']
    db.dispose()
    counter = 0
    end_count = len(image_data)
    print(f"LENGTH OF IMAGE DATA: {end_count}")
    s3_client = boto3.client('s3',
                             config=MY_BUCKET_CONFIG,
                             aws_access_key_id=access_key,
                             aws_secret_access_key=secret_key)
    s3 = boto3.resource('s3',
                        region_name='us-east-2',
                        aws_access_key_id=access_key,
                        aws_secret_access_key=secret_key)
    while counter < end_count:
        key = 'image' + str(counter)
        filename = image_data[key].filename
        image_file = image_data[key].file
        image_type = filename.split('.')[-1]
        if image_type == 'jpg':
            image_type = 'jpeg'
        print(f"IMAGE TYPE: {image_type}")
        # See if file has already been saved
        try:
            with db.connect() as conn:
                query_stmt = (images.select()
                              .where(and_(images.c.filename == filename, images.c.user_id == current_user)))
                selected_images = conn.execute(query_stmt)
                file_exists = False
                for i in selected_images:
                    if i[4] == filename:
                        data['warnings'].append(f"Image {filename} already exists!")
                        counter += 1
                        file_exists = True
                        break
                if file_exists:
                    continue
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
                    try:
                        with open(os.path.join('../frontend/photo-app/public/user_images/', filename), 'wb') as f:
                            video_contents = image_file.read()
                            f.write(video_contents)

                        # No exif for video files
                        vid_creation_date = datetime.datetime.today()

                        with db.connect() as conn:
                            update_date_stmt = (images.update()
                                                .where(images.c.filename == filename)
                                                .values(date_taken=vid_creation_date))
                            conn.execute(update_date_stmt)

                        # print(f"creation_date for {filename}: {vid_creation_date}")
                        data['upload_successful'] = True

                        counter += 1
                    except exc.SQLAlchemyError as err:
                        data['upload_successful'] = False
                        data['error'] = err
                        print(f"Could not save video: {err}")
                        return web.json_response(data)
                else:
                    # used to be 'assets/images/'
                    # with open(os.path.join('../frontend/photo-app/public/user_images/', filename), 'wb') as f:
                    #     image_contents = image_file.read()
                    #     f.write(image_contents)

                    upload_result = await upload_media(image_file, filename)
                    print(f"DID PHOTO UPLOAD? {upload_result}")
                    if not upload_result:
                        data['upload_successful'] = False
                        data['error'] = "Unable to save file."
                        print(f"Could not save image file.")
                        return web.json_response(data)

                    # Get exif for date taken
                    #presigned_url = await create_presigned_url(MY_BUCKET_NAME, filename)
                    #print(f"PRESIGNED URL: {presigned_url}")
                    #img = Image.open(image_file)
                    #img = Image.open(urllib.request.urlopen(presigned_url).read())
                    # Below is from Stackoverflow
                    bucket = s3.Bucket(MY_BUCKET_NAME)
                    object = bucket.Object(filename)
                    response = object.get()
                    file_stream = response['Body']
                    img = Image.open(file_stream)
                    exif_data = img.getexif()
                    creation_exif_date = exif_data.get(36867)
                    img = fix_image_orientation(img)

                    if creation_exif_date is None:
                        creation_date = datetime.datetime.today()
                    else:
                        date_portion = creation_exif_date.split(' ')[0]
                        time_portion = creation_exif_date.split(' ')[1]
                        creation_year = date_portion.split(':')[0]
                        creation_month = date_portion.split(':')[1]
                        creation_day = date_portion.split(':')[2]
                        creation_date = creation_year + '-' + creation_month + '-' + creation_day + 'T' + time_portion

                    # Resize for web and save
                    orig_size = img.size
                    width_percent = (300/float(orig_size[0]))
                    new_height = int((float(orig_size[1]) * float(width_percent)))
                    web_resized_img = img.resize((300, new_height))
                    web_size_filename = 'web_' + filename
                    web_mem_file = io.BytesIO()
                    web_resized_img.save(web_mem_file, image_type.upper(), quality=95)
                    web_mem_file.seek(0)
                    #web_resized_img.save('../frontend/photo-app/public/user_images/' + web_size_filename, image_type.upper(), quality=95)
                    web_upload_result = await upload_media(web_mem_file, web_size_filename)
                    if not web_upload_result:
                        data['upload_successful'] = False
                        data['error'] = "Unable to save web file."
                        print(f"Could not save web image file.")
                        return web.json_response(data)


                    # Create thumbnail and save
                    thumb_size = 128, 128
                    thumb_filename = 'thumb_' + filename
                    img.thumbnail(thumb_size)
                    thumb_mem_file = io.BytesIO()
                    img.save(thumb_mem_file, image_type.upper(), quality=95)
                    thumb_mem_file.seek(0)
                    #img.save('../frontend/photo-app/public/user_images/' + thumb_filename, image_type.upper(), quality=95)
                    thumb_upload_result = await upload_media(thumb_mem_file, thumb_filename)
                    if not thumb_upload_result:
                        data['upload_successful'] = False
                        data['error'] = "Unable to save thumbnail."
                        print(f"Could not save thumbnail.")
                        return web.json_response(data)

                    try:
                        with db.connect() as conn:
                            update_img_stmt = (images.update()
                                               .where(and_(images.c.user_id == current_user, images.c.filename == filename))
                                               .values(date_taken=creation_date,
                                                       web_size_filename=web_size_filename,
                                                       thumbnail_filename=thumb_filename))
                            conn.execute(update_img_stmt)

                        print(f"creation_date for {filename}: {creation_date}")
                        data['upload_successful'] = True
                        print(f"Upload successful")
                        counter += 1
                    except exc.SQLAlchemyError as err:
                        data['upload_successful'] = False
                        data['error'] = err
                        print(f"Unable to update image date: {err}")
                        return web.json_response(data)
    print(f"RESPONSE DATA: {data}")
    return web.json_response(data)
