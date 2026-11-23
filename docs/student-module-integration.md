# Student Module – Integration Handoff

| | |
|---|---|
| **Module** | Student Module (Member 2) |
| **Branch** | `feature/student-module` |
| **Document date** | 2026-11-23 |
| **Current mode** | Preview mode: `USE_SAMPLE_DATA = True` (sample data only, nothing saved to the database) |
| **Audience** | Member 1 (database), Member 3 (authentication / staff), Member 2 (student module) |

This document has three clearly separated parts:

- **Part A – Confirmed existing implementation:** what is already built and tested on this branch.
- **Part B – Proposed API contract:** what the student pages *expect* from the backend. This is a **proposal by Member 2**. It has **not** been agreed by the team.
- **Part C – Decisions waiting for team confirmation:** open questions for Member 1 and Member 3.

Parts D and E cover security and the integration testing checklist.

> **Important:** No database column, relationship, endpoint owner or authentication method is decided in this document.
> The database schema has not been approved by Member 1 yet. The only schema that exists today is the list of
> 7 planned tables in `README.md`: `departments`, `users`, `categories`, `statuses`, `complaints`,
> `assignments`, `complaint_updates`. These tables have no columns yet, and `app/models.py` is still a placeholder.

---

## Part A – Confirmed existing implementation

Everything in Part A exists on the `feature/student-module` branch and has been tested (see A7).

### A1. Files owned by Member 2

All Student Module files are **new** and start with `student`, so they do not collide with other members' files.

| File | Purpose |
|---|---|
| `app/routes/student.py` | Blueprint `student_bp` (URL prefix `/student`). Serves the 4 HTML pages. Holds the `USE_SAMPLE_DATA` switch. |
| `app/templates/student_base.html` | Shared layout: header, navigation, preview banner, footer, script loading |
| `app/templates/student_dashboard.html` | Dashboard page |
| `app/templates/student_complaints.html` | My Complaints page (search and filters) |
| `app/templates/student_submit_complaint.html` | Submit Complaint form |
| `app/templates/student_complaint_detail.html` | Complaint Details page |
| `app/static/css/student.css` | Styles for all student pages (responsive) |
| `app/static/js/student-sample-data.js` | **Sample data only.** Loaded only in preview mode. |
| `app/static/js/student-common.js` | Data layer (sample or real API), the API contract comment, safe UI helpers, mobile menu |
| `app/static/js/student-validation.js` | Complaint form validation rules |
| `app/static/js/student-dashboard.js` | Dashboard page logic |
| `app/static/js/student-complaints.js` | My Complaints logic: search, filters, sorting |
| `app/static/js/student-submit-complaint.js` | Submit form logic |
| `app/static/js/student-complaint-detail.js` | Details page logic |
| `tests/test_student_pages.py` | Automated tests for the student pages |
| `docs/student-module-integration.md` | This document |

**Change to a shared file (2 lines):** `app/__init__.py` imports `student_bp` and registers it with
`app.register_blueprint(student_bp)`. Nothing else in shared files was changed.

**Not touched by Member 2:** `app/models.py`, `app/firebase_auth.py`, `app/extensions.py`, `config.py`,
`.env` / `.env.example`, `app/routes/pages.py`, `app/routes/complaints.py`, `app/routes/users.py`,
`app/templates/base.html`, `login.html`, `dashboard.html`, `complaint_detail.html`,
`app/static/css/style.css`, `app/static/js/auth.js`, `firebase-init.js`, `complaints.js`.

> `.claude/launch.json` exists locally only to start the dev server in a preview tool. It is **not** part of the module and should not be committed.

### A2. The four student pages and their routes

| Page | URL | Flask endpoint | Template | Page script |
|---|---|---|---|---|
| Student Dashboard | `/student/` | `student.dashboard` | `student_dashboard.html` | `student-dashboard.js` |
| My Complaints | `/student/complaints` | `student.my_complaints` | `student_complaints.html` | `student-complaints.js` |
| Submit Complaint | `/student/complaints/new` | `student.submit_complaint` | `student_submit_complaint.html` | `student-submit-complaint.js` |
| Complaint Details | `/student/complaints/<int:complaint_id>` | `student.complaint_detail` | `student_complaint_detail.html` | `student-complaint-detail.js` |

Notes:
- The routes only return HTML. All data is loaded afterwards by JavaScript through the data layer (A4).
- `<int:complaint_id>` accepts whole numbers only. `/student/complaints/abc` returns 404 automatically.
- My Complaints reads and writes its filters in the address bar: `?q=`, `?status=`, `?category=`, `?sort=` (`newest`, `oldest` or `updated`). The status cards on the dashboard link to e.g. `/student/complaints?status=Open`.
- **The page routes do not check login today.** See B7 and decision T3.

### A3. Preview mode (sample data)

- `USE_SAMPLE_DATA = True` in `app/routes/student.py`. **It stays `True` until integration is agreed and tested.**
- When it is `True`:
  - `<body data-use-sample-data="true">` is set, and a yellow **"Preview mode: … sample data …"** banner appears on every page.
  - `student-sample-data.js` is loaded. It contains 6 sample complaints with update history, plus sample categories, departments and statuses. The file header says "SAMPLE DATA - FOR FRONTEND PREVIEW ONLY".
  - Complaints "submitted" in preview mode are **not** saved to the database. They are kept only in the browser tab's `sessionStorage` (key `campusconnect.preview.submittedComplaints`) and disappear when the tab closes. The success message says so.
- When it is `False`:
  - The sample file is **not** loaded, no banner is shown, and every page calls the real API (Part B).
- The category and department names in the sample file are placeholders. They are not a database proposal.

### A4. Frontend data layer (`student-common.js`)

Every page gets its data through the `StudentApp` object, never directly from the sample file:

| Function | Preview mode | Real mode (`USE_SAMPLE_DATA = False`) |
|---|---|---|
| `StudentApp.getComplaints()` | sample list + tab submissions | `GET /api/student/complaints` |
| `StudentApp.getComplaint(id)` | finds one in the list, or `null` | `GET /api/student/complaints/<id>`. **A 404 becomes `null`** and the page shows "Complaint not found". |
| `StudentApp.getFormOptions()` | sample categories, departments and statuses | `GET /api/student/complaint-options` |
| `StudentApp.submitComplaint(data)` | saves to `sessionStorage` | `POST /api/student/complaints` |

How real-mode requests are made today:
- Each request is a `fetch` with `Accept: application/json`. POST requests also send `Content-Type: application/json` and a JSON body.
- **`authHeaders()` currently returns `{}`.** It is the single place where the Firebase token header must be added (see B7). It is marked `INTEGRATION TODO` in the code.
- Any non-2xx response throws `StudentApp.ApiError`, which carries `status` and the parsed JSON `body`.
- Current error handling on the pages:
  - Details page: `404` shows "Complaint not found". Any other error shows a general error box.
  - Submit form: `400` with `{"errors": {...}}` shows each message next to its field. Any other error shows a general message.
  - Dashboard and My Complaints: any error shows a general error box.
  - **`401` and `403` get no special handling yet.** There is no redirect to login (see A6).

### A5. Client-side validation (`student-validation.js`)

The submit form is checked in the browser before sending. **These checks can be bypassed, so the server must repeat them** (see D3).

| Field sent | Cleaning | Rules | Messages |
|---|---|---|---|
| `title` | trims the ends and collapses repeated spaces into one | required; 5–100 characters; must contain at least one letter (any language) | "Please enter a title for your complaint." / "The title must be at least 5 characters." / "The title must be 100 characters or fewer." / "The title must contain words, not only numbers or symbols." |
| `category_id` | converted to a positive whole number | required; must be one of the ids from `complaint-options` | "Please choose a category." / "Please choose a valid category from the list." |
| `department_id` | converted to a positive whole number | required; must be one of the ids from `complaint-options` | "Please choose a department." / "Please choose a valid department from the list." |
| `description` | trims the ends; keeps line breaks | required; 20–1000 characters; must contain at least one letter | "Please describe the problem." / "Please give more detail (at least 20 characters)." / "The description must be 1000 characters or fewer." / "The description must contain words, not only numbers or symbols." |

Other form behaviour:
- `maxlength` is 100 on title and 1000 on description.
- Character counters, inline errors and an error summary with links to the fields.
- Fields are marked with `aria-invalid`.
- The Submit button is disabled while sending, which prevents double submission.

The 100 / 1000 limits are **frontend choices**. They must be checked against Member 1's column sizes (decision M7).

### A6. Frontend assumptions that the backend must respect or that may need changing

These are facts about the current frontend code, not database decisions.

1. **The status names are fixed in the frontend:** `STATUS_ORDER = ["Open", "In Progress", "Resolved", "Closed"]`. The status counts, badge colours (CSS classes `badge-open`, `badge-in-progress`, `badge-resolved`, `badge-closed`) and the progress tracker depend on these exact names. Any other name shows a grey badge and no current step in the tracker.
2. **The dashboard reads `updates` from the list response.** Its "Latest updates" box uses `complaints[].updates`. If the list endpoint does not include `updates`, the dashboard code must change (decision T5).
3. **Search looks inside `description`**, so the list response must include `description`.
4. **The category filter matches by name** (`complaint.category === selected name`), so category names must be unique.
5. **Dates are sorted as text** (string comparison). All dates must use one consistent ISO 8601 format (decision M8).
6. **All values are displayed as plain text** using `textContent`, never as HTML. User text such as `<script>` is shown, not run.
7. **Still to do by Member 2 once authentication is decided:**
   - fill in `authHeaders()`;
   - handle `401` by sending the student to the login page;
   - handle `403`.

### A7. Tests that exist and pass

- `tests/test_student_pages.py`: **11 tests, all passing**. They need no database and no Firebase.
  - Each page returns 200 and contains its key elements.
  - Non-number complaint ids return 404.
  - The active navigation link is marked.
  - Preview mode loads the sample file and shows the banner.
  - **With `USE_SAMPLE_DATA = False`, no page loads the sample file or shows the banner.**
  - All student static files are served.
  - The sample file is labelled as sample data.

  How to run:

  ```
  .venv\Scripts\python.exe -m unittest discover -s tests -v
  ```
- Manual browser testing in preview mode:
  - 18 validation cases passed;
  - empty and valid submissions;
  - search, filters and sorting;
  - not-found complaint;
  - HTML in the title is shown as text;
  - mobile layout (375 px wide, no sideways scrolling);
  - no console errors.

---

## Part B – Proposed API contract (NOT yet agreed)

> Everything in Part B is a **proposal from Member 2**, based on what the existing pages need.
> The endpoint paths, the field names and the owner of the backend code all need team agreement (Part C).
> The field names describe the **JSON the pages read**. They are **not** database column names.
> How each field is produced from the database is for Member 1 to decide (see the mapping worksheet in C4).

### B1. Endpoints

| # | Method and path | Used by | Purpose |
|---|---|---|---|
| 1 | `GET /api/student/complaints` | Dashboard, My Complaints | All complaints of the **logged-in student only** |
| 2 | `GET /api/student/complaints/<id>` | Complaint Details | One complaint with its update history |
| 3 | `GET /api/student/complaint-options` | Submit form, My Complaints filters | Lists for the dropdowns |
| 4 | `POST /api/student/complaints` | Submit form | Create a complaint for the logged-in student |

Every request must carry the Firebase token (B7). Every response is JSON.

### B2. Request and response formats

**1. `GET /api/student/complaints`**

```json
200 OK
{
  "complaints": [ <Complaint>, <Complaint>, ... ]
}
```
- Only the logged-in student's complaints.
- An empty list is `{"complaints": []}`, not an error.
- Each item must include `description` and `updates` (see A6 items 2 and 3, and decision T5).

**2. `GET /api/student/complaints/<id>`**

```json
200 OK
{
  "complaint": <Complaint including "updates">
}
```
- `404` if the complaint does not exist **or belongs to another student** (see D1).

**3. `GET /api/student/complaint-options`**

```json
200 OK
{
  "categories":  [ { "id": <whole number>, "name": "<text>" }, ... ],
  "departments": [ { "id": <whole number>, "name": "<text>" }, ... ],
  "statuses":    [ "Open", "In Progress", "Resolved", "Closed" ]
}
```
- `statuses` must be in workflow order and use the names in A6 item 1, unless decision M5 changes them.
- If decision M3 removes the department choice, `departments` and the form field go too (a frontend change by Member 2).

**4. `POST /api/student/complaints`**

Request body (JSON):
```json
{
  "title": "<text>",
  "category_id": <whole number>,
  "department_id": <whole number>,
  "description": "<text>"
}
```
- The body must **not** contain the student's id. The server takes the student from the verified token (D1).
- The status and dates are set by the server, not sent by the browser.

Success:
```json
201 Created
{
  "complaint": <Complaint>
}
```
- The page needs at least `complaint.id` to link to the new complaint.

Validation failure:
```json
400 Bad Request
{
  "errors": {
    "title": "<message>",
    "category_id": "<message>",
    "department_id": "<message>",
    "description": "<message>"
  }
}
```
- Include only the fields that failed. The keys **must** be exactly these four field names, or the page cannot show the message next to the field.

### B3. `Complaint` object – fields the pages read

| JSON field | Type | Required | Used on | Notes |
|---|---|---|---|---|
| `id` | whole number | yes | all pages | Must be a whole number (the page route is `<int:…>`). Shown as `#<id>`. |
| `title` | text | yes | all pages | |
| `description` | text | yes | My Complaints (search), Details | Line breaks are kept on display. |
| `category` | text (name) | yes | list rows, filter, Details | A **name**, not an id. Must be unique (A6 item 4). |
| `department` | text (name) | yes | list rows, Details | A **name**. Where it comes from is undecided (M2). |
| `status` | text (name) | yes | everywhere | One of the status names (A6 item 1). |
| `assigned_to` | text or `null` | yes | Details | `null` shows "Not assigned yet". What may be shown is undecided (S1). |
| `created_at` | ISO 8601 date/time | yes | lists, Details, sorting | Format: M8 |
| `updated_at` | ISO 8601 date/time | yes | lists, Details, "Recently updated" sort | How it is produced is undecided (M4). |
| `updates` | list of `Update` | yes | Details, Dashboard | See B4. Decision T5 affects whether the list endpoint includes it. |

### B4. `Update` object (update history) – fields the pages read

| JSON field | Type | Required | Notes |
|---|---|---|---|
| `id` | whole number | yes | |
| `created_at` | ISO 8601 date/time | yes | The Details page shows newest first. |
| `author_name` | text | yes | Shown as e.g. "Sample Staff". What may be shown is undecided (S1). |
| `author_role` | text | no | Shown in brackets, e.g. "(Staff)". |
| `note` | text | no | The message text. |
| `old_status` | status name or `null` | no | If both statuses are set, the page shows "Status changed: Old → New". |
| `new_status` | status name or `null` | no | If only `new_status` is set, it shows "Status: New". |

**Students must only ever receive updates they are allowed to see.** Internal staff notes must be filtered out **on the server** (D2).

### B5. HTTP status codes (proposed)

| Code | When | Current frontend behaviour |
|---|---|---|
| 200 | Successful read | Data shown |
| 201 | Complaint created | Success message and link |
| 400 | Validation failed (`{"errors": {...}}`) | Messages shown next to the fields |
| 401 | No token, or the token is invalid or expired | General error. **A redirect to login is still to do** (A6 item 7). |
| 403 | Logged in but not a student | General error. **Still to do.** |
| 404 | Complaint not found or not owned | "Complaint not found" page |
| 500 | Server error | General error. The server must **not** send error details or stack traces to the browser. |

### B6. Server-side validation (required)

The backend must repeat the A5 rules on every `POST`:
- the same length limits (unless M7 changes them);
- `category_id` and `department_id` must exist;
- the text must not be empty after trimming;

and return `400` in the B2 format. The browser checks are for convenience only.

### B7. Firebase authentication requirements

These are the **requirements** of the Student Module. **How** authentication is built is decided by the authentication owner (decision T2). It is not decided here.

What the Student Module needs:
1. **A Firebase ID token on every API request**, from the logged-in student's browser. The frontend hook is `authHeaders()` in `student-common.js`. The header name and format are to be confirmed (decision F2). `Authorization: Bearer <token>` is the common choice.
2. **Server-side verification** of that token on every `/api/student/...` request, using the Firebase Admin SDK (already in `requirements.txt` as `firebase_admin`). `app/firebase_auth.py` is the planned place for this, but it is a placeholder today and is **not** owned by Member 2.
3. **A way to find the logged-in student's row in the `users` table** from the verified Firebase account. The README says `users` is "linked to their Firebase account". The exact column is Member 1's decision (M6).
4. **A role check:** only users with the Student role may use `/api/student/...`. How roles are stored is undecided (M6).
5. **Page protection:** a normal page visit (e.g. typing `/student/` in the address bar) does **not** send an `Authorization` header. So the Flask page routes in `student.py` cannot check the Firebase token by themselves. The team must choose how logged-out visitors are kept out of the student pages (decision T3).
6. **Token expiry:** Firebase ID tokens expire (about every hour). The frontend should ask Firebase for a current token before each request, and must handle `401` (A6 item 7).
7. **A login redirect:** after login, students must be sent to `/student/` (decision T4).

---

## Part C – Decisions waiting for team confirmation

> Nothing in this part is decided. Each item names who should decide it and which Student Module code it affects.

### C1. For Member 1 (database)

| ID | Question | Why the Student Module needs the answer | Affects |
|---|---|---|---|
| M1 | What are the final columns and keys of the 7 tables? | Every API field in B3/B4 must be mapped to the database (C4). | Backend API, worksheet C4 |
| M2 | How is a complaint connected to a **department**? | The pages show `department`, and the form currently asks for it. | `department` field, submit form |
| M3 | Does each **category** belong to one department? If so, should the student still choose a department? | If the department follows from the category, the department dropdown should be removed (a frontend change by Member 2). | Submit form, `complaint-options` |
| M4 | How is the **current status** stored, and how is **"last updated"** found (its own column, or the latest update's time)? | Needed for `status` and `updated_at`. | B3 |
| M5 | What are the exact **status names and their order**? Can they be the four in A6? | The frontend has the four names fixed. A different name breaks badges and the tracker. | `STATUS_ORDER`, CSS, `complaint-options` |
| M6 | How is a **user linked to their Firebase account**, and how are **roles** (Student / Staff / Admin) stored? Who creates the `users` row on first login? | Needed for login, ownership and the role check (B7). | All API endpoints |
| M7 | What are the **maximum lengths** of a complaint title and description in the database? | The form uses 100 / 1000. They must not exceed the database. | `student-validation.js`, form `maxlength` |
| M8 | Which **date/time type and timezone** will be stored, and in what format will the API send dates? | The pages sort dates as text, so one consistent format is required. | All dates |
| M9 | How is the **student who submitted** a complaint recorded? | Required for "my complaints" and for ownership checks (D1). | Endpoints 1, 2, 4 |
| M10 | How are **status changes** recorded in `complaint_updates` (if at all)? | The update history can show "Status changed: Old → New". | `old_status`, `new_status` |
| M11 | Can `complaint_updates` mark a note as **internal (staff-only)**? | Students must not see internal notes (D2). | Endpoints 1 and 2 |
| M12 | How do `assignments` work: one current assignment, or a history? Which one is "assigned to"? | Needed for `assigned_to`. | B3 |
| M13 | When a complaint is created, should a first "Complaint submitted" update also be created? | The sample data shows one. The real behaviour must be decided. | Update history |

### C2. For Member 3 (authentication / staff)

| ID | Question | Why it matters | Affects |
|---|---|---|---|
| F1 | Who implements Firebase token verification (`app/firebase_auth.py`), and what does it give the routes (e.g. the current user)? | The student API needs the verified current user. | All API endpoints |
| F2 | Which header and format will the browser use to send the token? | `authHeaders()` must match. | `student-common.js` |
| F3 | Which shared function will give the student pages the current Firebase ID token (e.g. from `auth.js`)? | `authHeaders()` should call it instead of duplicating Firebase code. | `student-common.js` |
| F4 | What should happen on `401` and `403`: which login page URL, and what message? | Needed for the redirect (A6 item 7). | All student pages |
| S1 | May students see the **staff member's name** in "Assigned to" and in update authors, or only a role or department? | Privacy of staff details. | `assigned_to`, `author_name` |
| S2 | Do staff write **internal notes** that students must not see? | Security requirement D2. | Endpoints 1 and 2 |
| S3 | Who may **change a complaint's status**? Only staff? | Students cannot change status in the current pages. | Confirms scope |
| S4 | Will students be allowed to **reply, edit or withdraw** a complaint later? | Not in the current Student Module requirements. It would need new pages and endpoints. | Future scope |

### C3. For the whole team (Members 1, 2 and 3)

| ID | Question | Affects |
|---|---|---|
| T1 | **Who writes the four `/api/student/...` endpoints, and in which file?** (`app/routes/complaints.py` is an existing shared placeholder. Its docstring mentions "submit, list, view, assign, and add complaint updates".) Are the paths in B1 accepted? | Backend ownership, merge conflicts |
| T2 | Who owns Firebase authentication end to end (`firebase_auth.py`, `auth.js`, `firebase-init.js`, `login.html`)? | B7 |
| T3 | How are logged-out visitors kept out of the student pages (B7 item 5)? | `student.py`, student page scripts |
| T4 | Where does a student land after login? `/student/` is proposed. | Login flow |
| T5 | Should the **list endpoint include each complaint's full `updates`**, or should the dashboard get "latest updates" another way? | `student-dashboard.js` |
| T6 | Are the JSON field names in B3/B4 accepted? Any change means a frontend change by Member 2. | All page scripts |
| T7 | Are the error formats in B2/B5 accepted? | Submit form, error handling |

### C4. Field-mapping worksheet (to be completed with Member 1)

The **Database source** column is intentionally empty. It must be filled in by Member 1 after the schema is approved.

| JSON field | Planned table (from README) | Database source (column / join / calculated) | Confirmed? |
|---|---|---|---|
| `complaint.id` | `complaints` | _TBD by Member 1_ | ☐ |
| `complaint.title` | `complaints` | _TBD_ | ☐ |
| `complaint.description` | `complaints` | _TBD_ | ☐ |
| `complaint.category` | `categories` | _TBD_ | ☐ |
| `complaint.department` | `departments` | _TBD (see M2)_ | ☐ |
| `complaint.status` | `statuses` | _TBD (see M4, M5)_ | ☐ |
| `complaint.assigned_to` | `assignments`, `users` | _TBD (see M12, S1)_ | ☐ |
| `complaint.created_at` | `complaints` | _TBD (see M8)_ | ☐ |
| `complaint.updated_at` | _undecided_ | _TBD (see M4)_ | ☐ |
| (owner of the complaint – not sent) | `complaints`, `users` | _TBD (see M9)_ | ☐ |
| `update.id` | `complaint_updates` | _TBD_ | ☐ |
| `update.created_at` | `complaint_updates` | _TBD_ | ☐ |
| `update.author_name` | `users` | _TBD (see S1)_ | ☐ |
| `update.author_role` | `users` | _TBD (see M6)_ | ☐ |
| `update.note` | `complaint_updates` | _TBD_ | ☐ |
| `update.old_status` / `new_status` | `complaint_updates`, `statuses` | _TBD (see M10)_ | ☐ |
| (internal-note flag – used to filter, not sent) | `complaint_updates` | _TBD (see M11, S2)_ | ☐ |
| `categories[].id` / `name` | `categories` | _TBD_ | ☐ |
| `departments[].id` / `name` | `departments` | _TBD_ | ☐ |
| `statuses[]` | `statuses` | _TBD (see M5)_ | ☐ |

---

## Part D – Security requirements

These are requirements for whoever builds the backend. They do not depend on the final column names.

**D1. Student ownership checks (most important)**
- The student's identity must come **only from the verified Firebase token**. Never trust a student id sent in the URL, the query string or the JSON body.
- `GET /api/student/complaints` must return **only** the logged-in student's complaints. The filter must happen in the database query, not in the browser.
- `GET /api/student/complaints/<id>` must check that the complaint belongs to the logged-in student. For someone else's complaint, the proposal is to return **`404`, the same as "does not exist"**, so students cannot discover other complaint numbers. (A `403` would also be safe; the team should agree – see T7.)
- `POST /api/student/complaints` must set the owner to the logged-in student on the server.

**D2. Internal-note visibility**
- If staff can write internal notes (S2, M11), they must be **removed on the server** before any response is sent to a student. Hiding them in the browser is **not** enough: the data would still be visible in the browser's network tools.
- The same applies to any other staff-only data (e.g. staff email addresses). Only send the fields listed in B3/B4.

**D3. Server-side validation**
- Repeat all A5 rules on the server (B6). Reject unknown `category_id` / `department_id` values.
- The status of a new complaint is set by the server. The student cannot choose it.

**D4. Authentication and roles**
- Verify the Firebase token on **every** API request (B7). Reject missing, invalid or expired tokens with `401`.
- Allow only the Student role on `/api/student/...` (`403` otherwise).

**D5. Safe output**
- The student pages already display all data as plain text (A6 item 6). Any other page that shows complaint text (e.g. staff pages) must also escape it. Jinja templates do this automatically; JavaScript must use `textContent`, not `innerHTML`.

**D6. Errors and secrets**
- Never send database errors, stack traces or tokens to the browser. Log them on the server only (as `/health` already does).
- Never commit `.env`, Firebase service-account files or tokens (already covered by `.gitignore`).

**D7. If cookies are chosen for page protection (T3)**
- If the team chooses cookie-based sessions instead of (or in addition to) a token header, state-changing requests such as `POST` need CSRF protection. This does not apply if only the `Authorization` header is used.

**D8. Sample data**
- `USE_SAMPLE_DATA` must be `False` in any real deployment. The test `test_real_mode_does_not_load_sample_data` confirms the sample file is not loaded when it is `False`.

---

## Part E – Integration testing checklist

### E1. Before switching off preview mode
- [ ] Member 1 has approved the schema, and C4 is filled in.
- [ ] Decisions M1–M13, F1–F4, S1–S4 and T1–T7 are answered and recorded in this document.
- [ ] Member 2 has updated the frontend for any changed field names, status names, the department question (M3) and the list `updates` question (T5).
- [ ] `authHeaders()` sends the agreed token header (F2, F3).
- [ ] `401` / `403` handling is added on the student pages (F4).
- [ ] Page protection for logged-out visitors is in place (T3).

### E2. API tests (backend, automated where possible)
- [ ] No token → `401` on all four endpoints.
- [ ] Invalid or expired token → `401`.
- [ ] A staff or admin token → `403` on `/api/student/...`.
- [ ] Student A's list contains **none** of student B's complaints.
- [ ] Student A requesting student B's complaint by id → `404` (or the agreed code).
- [ ] A complaint id that does not exist → `404`.
- [ ] `POST` with a `student_id` (or similar) in the body → the extra value is ignored, and the owner is still the token's student.
- [ ] `POST` with each A5 rule broken (empty, too short, too long, symbols only, unknown category/department) → `400` with the correct field keys.
- [ ] `POST` with valid data → `201` and a `complaint` that contains `id`. The row exists in PostgreSQL with the correct owner and initial status.
- [ ] Internal notes (if they exist) never appear in the responses of endpoints 1 and 2.
- [ ] Dates use the agreed format (M8) in every response.
- [ ] `complaint-options` returns statuses in workflow order with the agreed names.

### E3. Frontend tests with real data (`USE_SAMPLE_DATA = False`)
- [ ] `python -m unittest discover -s tests -v` still passes.
- [ ] No yellow preview banner. `student-sample-data.js` is not requested (check the browser's Network tab).
- [ ] Dashboard counts match the database for a test student.
- [ ] My Complaints: search by word and by number, each status filter, the category filter and all three sort orders work.
- [ ] Submit a valid complaint → it appears in My Complaints and on the dashboard, and it is in the database.
- [ ] Submit an invalid complaint → messages appear next to the fields (browser checks), and server `400` messages also appear in the correct place.
- [ ] Details page shows all fields, the correct tracker step and the update history (newest first).
- [ ] Opening another student's complaint URL shows "Complaint not found".
- [ ] Logging out, then opening `/student/`, leads to the agreed behaviour (T3).
- [ ] An expired session (`401`) leads to the agreed behaviour (F4).
- [ ] Mobile width (about 375 px): no sideways scrolling, and the menu button works.
- [ ] No errors in the browser console.

### E4. Switching to real data (only after E1–E3 are agreed)
1. Set `USE_SAMPLE_DATA = False` in `app/routes/student.py`. **Not done yet, on purpose.**
2. Run all tests in E2 and E3.
3. Keep `student-sample-data.js` in the project for future frontend previews, or remove it as a team decision. It is never loaded in real mode.

---

## Change log

| Date | Change |
|---|---|
| 2026-11-23 | First version (Member 2). Preview-mode frontend complete. API contract proposed. All database and authentication decisions open. |
