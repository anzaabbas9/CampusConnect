"""
config.py

Purpose: Reads the app's settings (secret key, database URL) from environment
variables.

Real values such as the database password live in a private ".env" file in the
project root. That file is listed in .gitignore, so it is never uploaded to
GitHub. ".env.example" shows which settings the .env file needs.
"""

import os

from dotenv import load_dotenv
from flask.helpers import get_debug_flag

# The folder that contains this file, i.e. the project root (E:\CampusConnect).
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Read the .env file (if it exists) and copy its values into os.environ.
# If a variable is already set in the real environment, that value is kept.
load_dotenv(os.path.join(BASE_DIR, ".env"))


class Config:
    """Settings that Flask loads with app.config.from_object(Config)."""

    # Debug mode (auto-reload on code changes + error pages with details).
    #   FLASK_DEBUG=1   -> on
    #   FLASK_DEBUG=0   -> off
    #   not set         -> off
    # get_debug_flag() is the same rule the "flask run" command uses, so
    # "python run.py" and "flask run" always agree.
    DEBUG = get_debug_flag()

    # Flask uses this to sign session cookies. It must be long, random and secret.
    SECRET_KEY = os.environ.get("SECRET_KEY")

    # Where the PostgreSQL database is. Format:
    #   postgresql+psycopg://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
    # "+psycopg" tells SQLAlchemy to use the psycopg (version 3) driver.
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")

    # Extra options for the database connection:
    # - pool_pre_ping: before using a saved connection, quickly check it is
    #   still alive (avoids errors after PostgreSQL restarts).
    # - connect_timeout: give up after 5 seconds if PostgreSQL cannot be
    #   reached, instead of hanging for minutes.
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "connect_args": {"connect_timeout": 5},
    }
