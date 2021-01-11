# import sqlite3

# from dataclasses import dataclass
# from pathlib import Path
# from typing import AsyncIterator, List
from contextlib import contextmanager

# import aiosqlite
# import asyncio
# import asyncpg
from aiohttp import web
import datetime

import aiopg.sa
# import psycopg2
# from sqlalchemy.orm import sessionmaker
from sqlalchemy import exc, DateTime, MetaData, Table, Column, ForeignKey, Integer, String, create_engine

from settings import config

# DATABASE = 'photo_user.sqlite3'

# users access levels:
# primary -> can upload, download, delete, edit date and tags, enter title and description, invite friends/family, edit
# collaborator's permissions to restrict activity
# collaborator -> can upload, delete, download, edit date and tags, enter title and description, invite friends/family
# viewer -> can view photos, download
# restricted -> can view certain photos, cannot download
DSN = "postgresql://{user}:{password}@{host}:{port}/{database}"

__all__ = ['users', 'people', 'albums',
           'images', 'invites',
           'user_to_user_relationships',
           'people_to_user_relationships',
           'people_to_album_relationships']
meta = MetaData()

users = Table(
    'users', meta,

    Column('id', Integer, primary_key=True),
    Column('username', String(200), nullable=False),
    Column('password', String(200), nullable=False),
    Column('access_level', String, nullable=False),
    Column('auth_token', String(200), nullable=True)
)

people = Table(
    'people', meta,

    Column('id', Integer, primary_key=True),
    Column('first_name', String, nullable=False),
    Column('last_name', String, nullable=True)
)

albums = Table(
    'albums', meta,

    Column('id', Integer, primary_key=True),
    Column('album_name', String, nullable=True),
    Column('album_description', String, nullable=True),
    Column('created_by', Integer, ForeignKey('users.id', ondelete='CASCADE'))
)

images = Table(
    'images', meta,

    Column('id', Integer, primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE')),
    Column('album_key', Integer, ForeignKey('albums.id', ondelete='CASCADE')),
    Column('person_key', Integer, ForeignKey('people.id', ondelete='CASCADE')),
    Column('filename', String, nullable=False),
    Column('web_size_filename', String, nullable=True),
    Column('thumbnail_filename', String, nullable=True),
    Column('url', String, nullable=True),
    Column('date_taken', DateTime, nullable=False),
    Column('title', String, nullable=True),
    Column('description', String, nullable=True)
)

invites = Table(
    'invites', meta,

    Column('id', Integer, primary_key=True),
    Column('invited_by', Integer, ForeignKey('users.id', ondelete='CASCADE')),
    Column('invite_code', String, nullable=False),
    Column('invite_expires', DateTime, nullable=False),
    Column('access_level', String, nullable=False),
)

user_to_user_relationships = Table(
    'user_to_user_relationships', meta,

    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE')),
    Column('linked_to', Integer, ForeignKey('users.id', ondelete='CASCADE'))
)

people_to_user_relationships = Table(
    'people_to_user_relationships', meta,

    Column('person_id', Integer, ForeignKey('people.id', ondelete='CASCADE')),
    Column('linked_to', Integer, ForeignKey('users.id', ondelete='CASCADE'))
)

people_to_album_relationships = Table(
    'people_to_album_relationships', meta,

    Column('album_id', Integer, ForeignKey('albums.id', ondelete='CASCADE')),
    Column('contains', Integer, ForeignKey('people.id', ondelete='CASCADE'))
)


def create_tables(engine):
    print(f"CREATING TABLES")
    table_meta = MetaData()
    table_meta.create_all(bind=engine, tables=[users, people, albums, images, invites, user_to_user_relationships,
                                               people_to_user_relationships, people_to_album_relationships])


# @contextmanager
# def db_session_scope(engine):
#     Session = sessionmaker(bind=engine)
#     sess = Session()
#     try:
#         yield sess
#         sess.commit()
#     except exc.DatabaseError:
#         sess.rollback()
#         raise
#     finally:
#         sess.close()


async def init_pg(app: web.Application) -> None:
    print(f"INIT_PG")
    db_url = DSN.format(**config['postgres'])
    # engine = await aiopg.sa.create_engine(
    #     database=conf['database'],
    #     user=conf['user'],
    #     password=conf['password'],
    #     host=conf['host'],
    #     port=conf['port'],
    #     minsize=conf['minsize'],
    #     maxsize=conf['maxsize'],
    # )
    engine = create_engine(db_url)
    print(f"IN INIT_PG, ENGINE: {engine}")
    # create_tables(engine)
    clean_invite_db(engine)
    delete_all_auth_tokens(engine)
    # Session = sessionmaker(bind=engine)
    # db_session = Session()
    app['db'] = engine
    # app['db_session'] = db_session


async def close_pg(app: web.Application) -> None:
    print(f"CLOSE_PG")
    app['db'].close()
    await app['db'].wait_closed()
    del app['db']


def clean_invite_db(engine) -> None:
    today = str(datetime.datetime.now(datetime.timezone.utc))
    print(f"Removing invites if expiry code < {today}")
    engine.dispose()
    try:
        with engine.connect() as conn:
            conn.execute(invites.delete().where(invites.c.invite_expires < today))
    except exc.SQLAlchemyError as err:
        print(f"ERROR: {err}")


def delete_all_auth_tokens(engine) -> None:
    print(f"DELETING ALL AUTH TOKENS")
    engine.dispose()
    try:
        with engine.connect() as conn:
            conn.execute(users.update()
                         .where(users.c.auth_token is not None)
                         .values(auth_token=None))
    except exc.SQLAlchemyError as err:
        print(f"ERROR DELETING ALL AUTH TOKENS: {err}")

        # def delete_auth_tokens(cursor) -> None:
        #     print(f"REMOVING OLD AUTH TOKENS")
        #     try:
        #         cursor.execute("""
        #         UPDATE users
        #         SET auth_token=(?)
        #         """, (None,))
        #     except sqlite3.DatabaseError as err:
        #         print(f"ERROR REMOVING AUTH TOKENS: {err}")

    # def clean_invite_db(cursor) -> None:
    #     today = str(datetime.datetime.now(datetime.timezone.utc))
    #     print(f"CLEANING INVITE DATABASE FOR EXPIRY: {today} (type: {type(today)}")
    #     try:
    #         cursor.execute("""
    #         DELETE FROM invites
    #         WHERE invite_expires < (?)
    #         """, (today,))
    #     except sqlite3.DatabaseError as err:
    #         print(f"ERROR CLEANING INVITES: {err}")



# @dataclass
# class User:
#     id: int
#     username: str
#     password: str
#     access_level: str


# def get_db_path() -> Path:
#     here = Path.cwd()
#     return here / DATABASE


# async def init_db(app: web.Application) -> AsyncIterator[None]:
#     sqlite_db = get_db_path()
#     db = await aiosqlite.connect(sqlite_db)
#     db.row_factory = aiosqlite.Row
#     app["DB"] = db
#     yield
#     await db.close()

# async def init_db(app: web.Application) -> AsyncIterator[None]:
#     params = config_db()
#     conn = await asyncpg.connect(**params)
#     cur = conn.cursor()
#     await conn.close()


# def delete_auth_tokens(cursor) -> None:
#     print(f"REMOVING OLD AUTH TOKENS")
#     try:
#         cursor.execute("""
#         UPDATE users
#         SET auth_token=(?)
#         """, (None,))
#     except sqlite3.DatabaseError as err:
#         print(f"ERROR REMOVING AUTH TOKENS: {err}")
#
#
# def clean_invite_db(cursor) -> None:
#     today = str(datetime.datetime.now(datetime.timezone.utc))
#     print(f"CLEANING INVITE DATABASE FOR EXPIRY: {today} (type: {type(today)}")
#     try:
#         cursor.execute("""
#         DELETE FROM invites
#         WHERE invite_expires < (?)
#         """, (today,))
#     except sqlite3.DatabaseError as err:
#         print(f"ERROR CLEANING INVITES: {err}")


# def create_users_db() -> None:
#     print("CREATING USERS DATABASE")
#     sqlite_db = get_db_path()
#     if sqlite_db.exists():
#         print("DATABASE EXISTS")
#         try:
#             with sqlite3.connect(sqlite_db) as conn:
#                 cur = conn.cursor()
#                 cur.execute("""
#                 SELECT * from users
#                 WHERE id = 1
#                 """)
#                 print("TABLE USERS EXISTS")
#                 delete_auth_tokens(cur)
#                 print("DELETING OLD AUTH TOKENS")
#                 conn.commit()
#             return
#         except sqlite3.DatabaseError as err:
#             print(f"DatabaseError: {err}")
#
#     with sqlite3.connect(sqlite_db) as conn:
#         print("SET UP THE USERS TABLE")
#         cur = conn.cursor()
#         cur.execute(
#             """CREATE TABLE users (
#             id INTEGER PRIMARY KEY,
#             username TEXT UNIQUE,
#             password TEXT,
#             access_level TEXT,
#             auth_token TEXT UNIQUE,
#             linked_to INTEGER,
#             FOREIGN KEY (linked_to) REFERENCES users(id)
#             )"""
#         )
#         conn.commit()
#
#
# def create_images_db() -> None:
#     print("CREATING IMAGE DATABASE")
#     sqlite_db = get_db_path()
#     if sqlite_db.exists():
#         print("DATABASE EXISTS")
#         try:
#             with sqlite3.connect(sqlite_db) as conn:
#                 cur = conn.cursor()
#                 cur.execute("""
#                 SELECT * from images
#                 """)
#                 print("TABLE IMAGES EXISTS")
#             return
#         except sqlite3.DatabaseError as err:
#             print(f"DatabaseError: {err}")
#
#     with sqlite3.connect(sqlite_db) as conn:
#         print("SET UP THE IMAGES TABLE")
#         cur = conn.cursor()
#         cur.execute(
#             """CREATE TABLE images(
#             id INTEGER PRIMARY KEY,
#             user_id INTEGER,
#             album_key INTEGER,
#             child_key INTEGER,
#             filename TEXT,
#             web_size_filename TEXT,
#             thumbnail_filename TEXT,
#             url TEXT,
#             date_taken DATE,
#             title TEXT,
#             description TEXT,
#             FOREIGN KEY (user_id) REFERENCES users(id)
#             )"""
#         )
#         conn.commit()
#
#
# def create_invites_db() -> None:
#     print("CREATING INVITES DATABASE")
#     sqlite_db = get_db_path()
#     if sqlite_db.exists():
#         print("DATABASE EXISTS")
#         try:
#             with sqlite3.connect(sqlite_db) as conn:
#                 cur = conn.cursor()
#                 cur.execute("""
#                 SELECT * from invites
#                 """)
#                 print(f"TABLE INVITES EXISTS")
#                 clean_invite_db(cur)
#                 print(f"INVITE DATABASE CLEANED")
#             return
#         except sqlite3.DatabaseError as err:
#             print(f"DatabaseError: {err}")
#
#     with sqlite3.connect(sqlite_db) as conn:
#         print("SET UP THE INVITES TABLE")
#         cur = conn.cursor()
#         cur.execute("""
#         CREATE TABLE invites (
#         id INTEGER PRIMARY KEY,
#         invited_by INTEGER,
#         invite_email TEXT,
#         invite_code TEXT,
#         invite_expires DATE,
#         access_level TEXT,
#         FOREIGN KEY (invited_by) REFERENCES users(id)
#         )""")
#         conn.commit()
#
#

