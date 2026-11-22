"""
app/routes/pages.py

Purpose: Serves the HTML pages (login, dashboard, complaint detail).

For now it only has a simple home page and a health-check route. The real
pages will be added in a later step.
"""

from flask import Blueprint, current_app, jsonify
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.extensions import db

# A blueprint is a named group of routes. create_app() registers it on the app.
pages_bp = Blueprint("pages", __name__)


@pages_bp.get("/")
def home():
    """Home page: shows that the Flask app is running."""
    return "<h1>CampusConnect</h1><p>The Flask app is running.</p>"


@pages_bp.get("/health")
def health():
    """Health check: reports whether the app and the database are working.

    Returns JSON with HTTP 200 when everything is fine,
    or HTTP 503 ("Service Unavailable") when the database cannot be reached.
    """
    try:
        # The simplest possible query. It reads no tables, so it works
        # before any tables exist.
        db.session.execute(text("SELECT 1"))
        database = "connected"
    except SQLAlchemyError as error:
        # Write the details to the server log only, never to the web page.
        current_app.logger.warning("Health check: database unreachable: %s", error)
        # Clean up the failed session so it does not affect later requests.
        db.session.rollback()
        database = "unreachable"

    if database == "connected":
        return jsonify(status="ok", database=database), 200
    return jsonify(status="error", database=database), 503
