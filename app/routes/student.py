"""
app/routes/student.py

Purpose: Serves the HTML pages of the Student Module (Member 2):
    /student/                        -> Student dashboard
    /student/complaints              -> My Complaints (search + filters)
    /student/complaints/new          -> Submit a complaint
    /student/complaints/<id>         -> Complaint details + update history

These routes only send HTML pages. The data shown on the pages is loaded by
JavaScript (see app/static/js/student-common.js).

PREVIEW MODE (sample data)
--------------------------
The database tables (app/models.py) and Firebase login (app/firebase_auth.py)
are not written yet. Until they are, USE_SAMPLE_DATA is True and the pages
show clearly labelled SAMPLE complaints from student-sample-data.js.
Nothing is read from or saved to PostgreSQL in preview mode.

When the real complaints API exists, set USE_SAMPLE_DATA to False. The pages
will then stop loading the sample file and call the API instead.
"""

from flask import Blueprint, render_template

# All URLs in this blueprint start with /student.
student_bp = Blueprint("student", __name__, url_prefix="/student")

# True  -> pages show SAMPLE data (frontend preview only, nothing is saved).
# False -> pages call the real complaints API (needs the database + login).
USE_SAMPLE_DATA = True


def render_student_page(template_name, **context):
    """Render a student page and tell it whether to use sample data."""
    return render_template(template_name, use_sample_data=USE_SAMPLE_DATA, **context)


@student_bp.get("/")
def dashboard():
    """Student dashboard: summary counts and the most recent complaints."""
    return render_student_page("student_dashboard.html", active_page="dashboard")


@student_bp.get("/complaints")
def my_complaints():
    """List of the logged-in student's complaints, with search and filters."""
    return render_student_page("student_complaints.html", active_page="complaints")


@student_bp.get("/complaints/new")
def submit_complaint():
    """Form for submitting a new complaint."""
    return render_student_page("student_submit_complaint.html", active_page="submit")


@student_bp.get("/complaints/<int:complaint_id>")
def complaint_detail(complaint_id):
    """One complaint: details, current status and its complaint updates.

    <int:complaint_id> means Flask only accepts whole numbers here, so a URL
    like /student/complaints/abc returns 404 automatically.
    """
    return render_student_page(
        "student_complaint_detail.html",
        active_page="complaints",
        complaint_id=complaint_id,
    )
