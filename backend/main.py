import base64
from pathlib import Path
import os
from os.path import join, dirname
from typing import Awaitable, Callable

from aiohttp import web
import aiohttp_cors
import aiohttp_jinja2
import aiohttp_session
from aiohttp_session.cookie_storage import EncryptedCookieStorage
import boto3
from dotenv import load_dotenv
import jinja2
from pathlib import Path

from db import create_tables, close_pg, init_pg, clean_invite_db, delete_all_auth_tokens
from routes import (add_person_handler, delete_tag_handler, edit_handler, index_handler, invite_handler,
                    logged_in_handler, login_handler, logout_handler, register_invite_handler, registration_handler,
                    reset_password_handler, router, upload_handler)
from settings import config, frontend_url, access_key, secret_key
from botocore.config import Config

# Configure base path
BASE_PATH = Path(__file__).parent

# Load and configure environmental variables from production .env file
dotenv_path = join(BASE_PATH / '.venv', 'prod.env')
load_dotenv(dotenv_path)

# fernet_key = str.encode(key)
fernet_key = str.encode(os.environ.get('SECRET_KEY'))
SECRET_KEY = base64.urlsafe_b64decode(fernet_key)
# FRONTEND_URL = os.environ.get('SOURCE_URL')
FRONTEND_URL = frontend_url
_WebHandler = Callable[[web.Request], Awaitable[web.StreamResponse]]

my_bucket_config = Config(
    region_name='us-east-2',
    signature_version='s3v4',
    retries={
        'max_attempts': 10,
        'mode': 'standard'
    }
)
s3 = boto3.resource('s3',
                    config=my_bucket_config,
                    aws_access_key_id=access_key,
                    aws_secret_access_key=secret_key)


def test_boto():

    print("TESTING BOTO: ")
    for bucket in s3.buckets.all():
        print(bucket.name)
    return


async def init_app() -> web.Application:
    app = web.Application(client_max_size=100000000)
    app['config'] = config
    aiohttp_session.setup(app, EncryptedCookieStorage(SECRET_KEY))
    aiohttp_jinja2.setup(
        app,
        loader=jinja2.FileSystemLoader(str(BASE_PATH / "templates")),
    )
    app.router.add_route("GET", "/", index_handler)
    app.router.add_route("POST", "/login", login_handler)
    app.router.add_route("POST", "/register", registration_handler)
    app.router.add_route("GET", "/logged_in", logged_in_handler)
    app.router.add_route("POST", "/logout", logout_handler)
    app.router.add_route("POST", "/upload", upload_handler)
    app.router.add_route("POST", "/edit", edit_handler)
    app.router.add_route("POST", "/invite", invite_handler)
    app.router.add_route("POST", "/register-invite", register_invite_handler)
    app.router.add_route("POST", "/reset-password", reset_password_handler)
    app.router.add_route("POST", "/add-person", add_person_handler)
    app.router.add_route("POST", "/delete-tag", delete_tag_handler)
    app.router.add_static("/static", path=str(BASE_PATH / "assets"), name="static")
    app.router.add_static("/images", path=str(BASE_PATH / "assets/images"), name="images")
    cors = aiohttp_cors.setup(app, defaults={
        FRONTEND_URL: aiohttp_cors.ResourceOptions(
            allow_credentials=True,
            expose_headers=("X-Custom-Server-Header", "Content-Type"),
            allow_headers=("X-Requested-With", "Content-Type", "Set-Cookie"),
        ),
        FRONTEND_URL: aiohttp_cors.ResourceOptions(
            allow_credentials=True,
            expose_headers=("X-Custom-Server-Header", "Content-Type"),
            allow_headers=("X-Requested-With", "Content-Type", "Set-Cookie"),
        ),
    })
    # Configure CORS on all routes
    for route in list(app.router.routes()):
        cors.add(route)

    app.on_startup.append(init_pg)
    app.on_cleanup.append(close_pg)

    return app


if __name__ == '__main__':
    test_boto()
    web.run_app(init_app())
