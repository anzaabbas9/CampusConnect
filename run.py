"""
run.py

Purpose: Entry point - the file you run to start the Flask development server.

Two ways to start the app (inside the activated virtual environment):
    python run.py
    flask run          (uses FLASK_APP=run.py from .env)

Debug mode is controlled by FLASK_DEBUG in .env (1 = on, 0 = off).
"""

from app import create_app

# Build the app using the application factory.
# The "flask" command also finds this `app` variable.
app = create_app()

if __name__ == "__main__":
    # This only runs for "python run.py", not when the file is imported.
    # app.config["DEBUG"] comes from the DEBUG setting in config.py, so debug
    # mode is on only when .env says FLASK_DEBUG=1.
    app.run(debug=app.config["DEBUG"])
