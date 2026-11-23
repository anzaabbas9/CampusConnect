"""
tests/test_student_pages.py

Purpose: Automated tests for the Student Module pages (app/routes/student.py).

Run from the project root, inside the activated virtual environment:
    python -m unittest discover -s tests -v

These tests do NOT need PostgreSQL or Firebase: the student pages only send
HTML, and the test settings below use a dummy database address that is never
connected to.
"""

import unittest

from app import create_app
from app.routes import student as student_routes
from config import Config


class TestConfig(Config):
    """Settings for tests only (independent of the real .env file)."""

    TESTING = True
    SECRET_KEY = "test-secret-key"
    SQLALCHEMY_DATABASE_URI = "postgresql+psycopg://test:test@localhost:5432/test_unused"


class StudentPagesTest(unittest.TestCase):

    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        # Remember the real setting so each test can change it safely.
        self.original_use_sample_data = student_routes.USE_SAMPLE_DATA
        student_routes.USE_SAMPLE_DATA = True

    def tearDown(self):
        student_routes.USE_SAMPLE_DATA = self.original_use_sample_data

    def get_text(self, url):
        response = self.client.get(url)
        return response, response.get_data(as_text=True)

    # ---------- Each page loads ----------

    def test_dashboard_page(self):
        response, html = self.get_text("/student/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("Welcome back", html)
        self.assertIn('id="stats-grid"', html)
        self.assertIn("js/student-dashboard.js", html)

    def test_dashboard_without_trailing_slash_redirects(self):
        response = self.client.get("/student")
        self.assertIn(response.status_code, (301, 308))

    def test_my_complaints_page_has_search_and_filters(self):
        response, html = self.get_text("/student/complaints")
        self.assertEqual(response.status_code, 200)
        for element_id in ("filter-search", "filter-status", "filter-category", "filter-sort"):
            self.assertIn('id="%s"' % element_id, html)
        self.assertIn("js/student-complaints.js", html)

    def test_submit_complaint_page_has_all_fields(self):
        response, html = self.get_text("/student/complaints/new")
        self.assertEqual(response.status_code, 200)
        for name in ("title", "category_id", "department_id", "description"):
            self.assertIn('name="%s"' % name, html)
        self.assertIn('maxlength="100"', html)   # title limit
        self.assertIn('maxlength="1000"', html)  # description limit
        # Validation script must load before the page script that uses it.
        self.assertLess(html.index("js/student-validation.js"),
                        html.index("js/student-submit-complaint.js"))

    def test_complaint_detail_page(self):
        response, html = self.get_text("/student/complaints/1005")
        self.assertEqual(response.status_code, 200)
        self.assertIn('data-complaint-id="1005"', html)
        self.assertIn("Complaint #1005", html)

    def test_complaint_detail_rejects_non_number_id(self):
        for bad_id in ("abc", "-1", "1.5", "1005;drop"):
            response = self.client.get("/student/complaints/" + bad_id)
            self.assertEqual(response.status_code, 404, bad_id)

    def test_active_nav_link_is_marked(self):
        _, html = self.get_text("/student/complaints")
        self.assertIn('class="active" aria-current="page">My Complaints', html)

    # ---------- Sample data is kept separate ----------

    def test_preview_mode_loads_sample_data_and_shows_banner(self):
        _, html = self.get_text("/student/")
        self.assertIn('data-use-sample-data="true"', html)
        self.assertIn("js/student-sample-data.js", html)
        self.assertIn("Preview mode:", html)
        # Sample data must load before the data layer that reads it.
        self.assertLess(html.index("js/student-sample-data.js"),
                        html.index("js/student-common.js"))

    def test_real_mode_does_not_load_sample_data(self):
        student_routes.USE_SAMPLE_DATA = False
        for url in ("/student/", "/student/complaints", "/student/complaints/new",
                    "/student/complaints/1"):
            _, html = self.get_text(url)
            self.assertIn('data-use-sample-data="false"', html, url)
            self.assertNotIn("student-sample-data.js", html, url)
            self.assertNotIn("Preview mode:", html, url)

    # ---------- Static files exist ----------

    def test_student_static_files_are_served(self):
        files = [
            "css/student.css",
            "js/student-sample-data.js",
            "js/student-common.js",
            "js/student-validation.js",
            "js/student-dashboard.js",
            "js/student-complaints.js",
            "js/student-submit-complaint.js",
            "js/student-complaint-detail.js",
        ]
        for path in files:
            response = self.client.get("/static/" + path)
            self.assertEqual(response.status_code, 200, path)
            response.close()

    def test_sample_data_file_is_clearly_labelled(self):
        response = self.client.get("/static/js/student-sample-data.js")
        text = response.get_data(as_text=True)
        response.close()
        self.assertIn("SAMPLE DATA - FOR FRONTEND PREVIEW ONLY", text)
        self.assertIn("isSample: true", text)


if __name__ == "__main__":
    unittest.main()
