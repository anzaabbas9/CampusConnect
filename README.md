# CampusConnect – Smart University Help Desk Management System

CampusConnect is a university help desk system built as a DBMS project.
Students can submit complaints (for example IT, hostel, exams, or fee issues),
and university staff can view, assign, and resolve them. Each complaint keeps a
history of complaint updates, all stored in a PostgreSQL database.

> **Status:** Early setup. The folder structure is in place; application code has not been written yet.

## Planned Features

- Secure login and sign-up with Firebase Authentication
- Role-based access: Student, Staff, Admin
- Submit, view, and track complaints
- Complaint categories, departments, and statuses
- Assign complaints to staff members
- Complaint updates (progress notes and status changes) on each complaint
- Dashboard showing complaints relevant to each user

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Python + Flask |
| Database | PostgreSQL |
| Authentication | Firebase Authentication |
| ORM | Flask-SQLAlchemy |
| Database driver | Psycopg |
| Migrations | Flask-Migrate |
| Token verification | Firebase Admin SDK |

## How It Works

1. The user logs in on the website using **Firebase Authentication**.
2. Firebase gives the browser an **ID token** (proof of who the user is).
3. The browser sends this token with every request to the **Flask** backend.
4. Flask checks the token with the **Firebase Admin SDK**.
5. Flask reads and writes data in **PostgreSQL** through **Flask-SQLAlchemy**.
6. Flask returns the result as JSON, and JavaScript updates the page.

Passwords are handled by Firebase and are never stored in our database.

## Database Design (PostgreSQL)

The planned tables are:

| # | Table | What it stores |
|---|---|---|
| 1 | `departments` | University departments that handle complaints (e.g. IT, Hostel, Examinations, Accounts) |
| 2 | `users` | Everyone who uses the system (students, staff, admins), linked to their Firebase account |
| 3 | `categories` | Types of complaint that a student can choose from |
| 4 | `statuses` | The possible states of a complaint (e.g. Open, In Progress, Resolved, Closed) |
| 5 | `complaints` | The complaints submitted by students (the main table) |
| 6 | `assignments` | Which staff member is responsible for which complaint |
| 7 | `complaint_updates` | Progress notes and status changes added to a complaint over time |

Exact columns, keys, and relationships will be finalised in the ER diagram
(kept in the `database/` folder) before the models are written.

## Project Structure

```
CampusConnect/
├── app/
│   ├── __init__.py          # Creates the Flask app
│   ├── extensions.py        # Database and migration objects
│   ├── models.py            # Database tables (7 tables, see Database Design)
│   ├── firebase_auth.py     # Firebase token verification
│   ├── routes/              # URL handlers (pages + API)
│   ├── templates/           # HTML pages
│   └── static/              # CSS, JavaScript, images
├── database/                # ER diagram, sample data, SQL notes
├── docs/                    # Project report and screenshots
├── config.py                # App settings (read from .env)
├── run.py                   # Starts the server
├── requirements.txt         # Python packages
├── .env.example             # Template for environment settings
└── README.md
```

The `migrations/` folder will be generated later by Flask-Migrate.

## Setup

Setup instructions will be added once packages are installed and the app is built.

## Security Notes

- Never commit `.env` or Firebase service account JSON files.
- Copy `.env.example` to `.env` and fill in your own values locally.
