"""
app/__init__.py

Purpose: Creates the Flask app (the 'application factory') and connects the
database, migrations and routes.

An "application factory" is a function that builds and returns a new app.
Using one (instead of a global app object) makes it easy to create apps with
different settings later, for example a separate app for automated tests.
"""

from flask import Flask

from app.extensions import db, migrate
from app.routes.pages import pages_bp
from config import Config

# Settings the app cannot run without, and the .env variable each one comes from.
REQUIRED_SETTINGS = {
    "SECRET_KEY": "SECRET_KEY",
    "SQLALCHEMY_DATABASE_URI": "DATABASE_URL",
}


def create_app(config_class=Config):
    """Build and return a configured Flask app."""

    # 1. Create the app. __name__ tells Flask where to find the
    #    templates/ and static/ folders (inside the app/ package).
    app = Flask(__name__)

    # 2. Load the settings from config.py.
    app.config.from_object(config_class)

    # 3. Stop early with a clear message if a required setting is missing,
    #    instead of failing later with a confusing error.
    missing = [env_name for key, env_name in REQUIRED_SETTINGS.items()
               if not app.config.get(key)]
    if missing:
        raise RuntimeError(
            "Missing required setting(s): " + ", ".join(missing) + ". "
            "Copy .env.example to .env and fill in real values."
        )

    # 4. Connect the shared extensions to this app.
    db.init_app(app)
    migrate.init_app(app, db)

    # 5. Register blueprints (groups of routes).
    #    Only "pages" is ready. The users and complaints blueprints will be
    #    registered here once they have routes.
    app.register_blueprint(pages_bp)

    return app
