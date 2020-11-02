import base64
from pathlib import Path
from typing import Awaitable, Callable

import aiohttp_jinja2
import aiohttp_session
from aiohttp_session.cookie_storage import EncryptedCookieStorage
import jinja2
from aiohttp import web
import aiohttp_cors

from db import create_images_db, create_invites_db, create_users_db, get_db_path, init_db
# from routes import check_login, error_middleware, username_ctx_processor, router
from routes import edit_handler, index_handler, invite_handler, logged_in_handler, login_handler, logout_handler, registration_handler, router, upload_handler

fernet_key = b'7TRw6P1h4U9hUo6m9jja9YZ0Qg4RtVl2TD2u7CDOqt0='
SECRET_KEY = base64.urlsafe_b64decode(fernet_key)
BASE_PATH = Path(__file__).parent

_WebHandler = Callable[[web.Request], Awaitable[web.StreamResponse]]
# app = web.Application()


async def init_app(db_path: Path) -> web.Application:
    app = web.Application(client_max_size=100000000)
    app["DB_PATH"] = db_path
    aiohttp_session.setup(app, EncryptedCookieStorage(SECRET_KEY))
    aiohttp_jinja2.setup(
        app,
        loader=jinja2.FileSystemLoader(str(BASE_PATH / "templates")),
        # context_processors=[username_ctx_processor],
    )
    app.router.add_route("GET", "/", index_handler)
    app.router.add_route("POST", "/login", login_handler)
    app.router.add_route("POST", "/register", registration_handler)
    app.router.add_route("GET", "/logged_in", logged_in_handler)
    app.router.add_route("POST", "/logout", logout_handler)
    app.router.add_route("POST", "/upload", upload_handler)
    app.router.add_route("POST", "/edit", edit_handler)
    app.router.add_route("POST", "/invite", invite_handler)
    app.router.add_static("/static", path=str(BASE_PATH / "static"), name="static")
    app.router.add_static("/images", path=str(BASE_PATH / "static/images"), name="images")
    app.cleanup_ctx.append(init_db)
    # app.cleanup_ctx.append(persistent_session)
    # app.middlewares.append(error_middleware)
    # app.middlewares.append(check_login)
    # app.middlewares.append(username_ctx_processor)
    cors = aiohttp_cors.setup(app, defaults={
        "http://localhost:3000": aiohttp_cors.ResourceOptions(
            allow_credentials=True,
            expose_headers=("X-Custom-Server-Header", "Content-Type"),
            allow_headers=("X-Requested-With", "Content-Type", "Set-Cookie"),
        ),
        "http://localhost:8080": aiohttp_cors.ResourceOptions(
            allow_credentials=True,
            expose_headers=("X-Custom-Server-Header", "Content-Type"),
            allow_headers=("X-Requested-With", "Content-Type", "Set-Cookie"),
        ),
    })
    # Configure CORS on all routes
    for route in list(app.router.routes()):
        cors.add(route)

    return app


if __name__ == '__main__':
    create_users_db()
    create_images_db()
    create_invites_db()
    web.run_app(init_app(get_db_path()))
