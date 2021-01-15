import datetime
from aiohttp import web
from sqlalchemy import exc, DateTime, MetaData, Table, Column, ForeignKey, Integer, String, create_engine

from settings import config

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

    Column('id', Integer, primary_key=True, autoincrement=True, unique=True),
    Column('username', String(200), nullable=False, unique=True),
    Column('password', String(200), nullable=False),
    Column('access_level', String, nullable=False),
    Column('auth_token', String(200), nullable=True, unique=True)
)

people = Table(
    'people', meta,

    Column('id', Integer, primary_key=True, autoincrement=True, unique=True),
    Column('first_name', String, nullable=False),
    Column('last_name', String, nullable=True)
)

albums = Table(
    'albums', meta,

    Column('id', Integer, primary_key=True, autoincrement=True, unique=True),
    Column('album_name', String, nullable=True),
    Column('album_description', String, nullable=True),
    Column('created_by', Integer, ForeignKey('users.id', ondelete='CASCADE'))
)

images = Table(
    'images', meta,

    Column('id', Integer, primary_key=True, autoincrement=True, unique=True),
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
    Column('album_key', Integer, ForeignKey('albums.id', ondelete='CASCADE'), nullable=True),
    Column('person_key', Integer, ForeignKey('people.id', ondelete='CASCADE'), nullable=True),
    Column('filename', String, nullable=False),
    Column('web_size_filename', String, nullable=True),
    Column('thumbnail_filename', String, nullable=True),
    Column('url', String, nullable=True),
    Column('date_taken', DateTime, nullable=True),
    Column('title', String, nullable=True),
    Column('description', String, nullable=True)
)

invites = Table(
    'invites', meta,

    Column('id', Integer, primary_key=True, autoincrement=True, unique=True),
    Column('invited_by', Integer, ForeignKey('users.id', ondelete='CASCADE')),
    Column('invite_code', String, nullable=False, unique=True),
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


async def init_pg(app: web.Application) -> None:
    print(f"INIT_PG")
    db_url = DSN.format(**config['postgres'])
    engine = create_engine(db_url)
    print(f"IN INIT_PG, ENGINE: {engine}")
    create_tables(engine)
    clean_invite_db(engine)
    delete_all_auth_tokens(engine)
    app['db'] = engine


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
