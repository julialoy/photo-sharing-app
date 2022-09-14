import base64
from pathlib import Path
from typing import Awaitable, Callable

from aiohttp import web
import aiohttp_cors
import aiohttp_jinja2
import aiohttp_session
from aiohttp_session.cookie_storage import EncryptedCookieStorage
import jinja2

from db import create_tables, close_pg, init_pg, clean_invite_db, delete_all_auth_tokens
from routes import (add_person_handler, delete_tag_handler, edit_handler, index_handler, invite_handler,
                    logged_in_handler, login_handler, logout_handler, register_invite_handler, registration_handler,
                    reset_password_handler, router, upload_handler)
from settings import config, key


fernet_key = str.encode(key)
SECRET_KEY = base64.urlsafe_b64decode(fernet_key)
BASE_PATH = Path(__file__).parent
_WebHandler = Callable[[web.Request], Awaitable[web.StreamResponse]]


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
    app.router.add_static("/static", path=str(BASE_PATH / "static"), name="static")
    app.router.add_static("/images", path=str(BASE_PATH / "static/images"), name="images")
    cors = aiohttp_cors.setup(app, defaults={
        "http://www.hoard.pics": aiohttp_cors.ResourceOptions(
            allow_credentials=True,
            expose_headers=("X-Custom-Server-Header", "Content-Type"),
            allow_headers=("X-Requested-With", "Content-Type", "Set-Cookie"),
        ),
        # "http://localhost:8080": aiohttp_cors.ResourceOptions(
        #     allow_credentials=True,
        #     expose_headers=("X-Custom-Server-Header", "Content-Type"),
        #     allow_headers=("X-Requested-With", "Content-Type", "Set-Cookie"),
        # ),
    })
    # Configure CORS on all routes
    for route in list(app.router.routes()):
        cors.add(route)

    app.on_startup.append(init_pg)
    app.on_cleanup.append(close_pg)

    return app


if __name__ == '__main__':
    web.run_app(init_app())
