"""
app/extensions.py

Purpose: Creates the shared db (Flask-SQLAlchemy) and migrate (Flask-Migrate)
objects.

They are created here "empty", without an app. create_app() in app/__init__.py
connects them to the app with init_app(). Keeping them in their own file lets
models and routes import `db` without importing the whole app, which avoids
circular-import errors.
"""

from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

# db: talks to PostgreSQL. Models (later) will use db.Model, and routes will
# use db.session to read and save data.
db = SQLAlchemy()

# migrate: adds the "flask db ..." commands that create and update database
# tables step by step (migrations). No tables exist yet.
migrate = Migrate()
