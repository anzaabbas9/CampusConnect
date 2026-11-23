/*
 * app/static/js/student-common.js
 *
 * Purpose: Shared code for all Student Module pages.
 *   1. Data layer  - one place that decides WHERE complaint data comes from:
 *                    the SAMPLE data file (preview mode) or the real API.
 *   2. UI helpers  - create elements safely, format dates, status badges.
 *   3. Navigation  - the mobile menu button.
 *
 * Every page script calls StudentApp.getComplaints(), StudentApp.getComplaint(),
 * etc. The pages never touch the sample data directly, so switching to the real
 * API only means setting USE_SAMPLE_DATA = False in app/routes/student.py.
 *
 * ---------------------------------------------------------------------------
 * API CONTRACT (expected backend endpoints - NOT built yet)
 * ---------------------------------------------------------------------------
 * GET  /api/student/complaints
 *      -> 200 { "complaints": [Complaint, ...] }   (only the logged-in student's)
 * GET  /api/student/complaints/<id>
 *      -> 200 { "complaint": Complaint }           (includes "updates")
 *      -> 404 if it does not exist OR belongs to another student
 * GET  /api/student/complaint-options
 *      -> 200 { "categories": [{id, name}], "departments": [{id, name}],
 *               "statuses": ["Open", "In Progress", "Resolved", "Closed"] }
 * POST /api/student/complaints
 *      body  { "title", "category_id", "department_id", "description" }
 *      -> 201 { "complaint": Complaint }
 *      -> 400 { "errors": { "<field>": "<message>" } }
 *
 * Complaint = { id, title, description, category, department, status,
 *               assigned_to (string or null), created_at, updated_at,
 *               updates: [{ id, created_at, author_name, author_role, note,
 *                           old_status, new_status }] }
 * Dates are ISO 8601 strings, e.g. "2026-11-21T09:15:00".
 * ---------------------------------------------------------------------------
 */

const StudentApp = (function () {
  "use strict";

  const useSampleData = document.body.dataset.useSampleData === "true";

  // Workflow order of statuses (used for the progress tracker and sorting).
  const STATUS_ORDER = ["Open", "In Progress", "Resolved", "Closed"];

  /* =======================================================================
   * 1A. SAMPLE source (preview mode only)
   * ======================================================================= */
  // Complaints "submitted" in preview mode are kept in sessionStorage, i.e.
  // only in this browser tab, and disappear when the tab is closed.
  const PREVIEW_STORAGE_KEY = "campusconnect.preview.submittedComplaints";

  function copy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function readPreviewSubmissions() {
    try {
      const saved = sessionStorage.getItem(PREVIEW_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return []; // Storage blocked or corrupted: just show the sample list.
    }
  }

  function savePreviewSubmissions(list) {
    try {
      sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(list));
    } catch (error) {
      /* Storage blocked: the submission is shown once but not remembered. */
    }
  }

  function nowIso() {
    // Local time without timezone, same format as the sample data.
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
      "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  }

  const sampleSource = {
    getComplaints() {
      const sample = window.STUDENT_SAMPLE_DATA;
      if (!sample) {
        return Promise.reject(new Error("Sample data file is not loaded."));
      }
      return Promise.resolve(readPreviewSubmissions().concat(copy(sample.complaints)));
    },

    getComplaint(id) {
      return this.getComplaints().then((list) => list.find((c) => c.id === id) || null);
    },

    getFormOptions() {
      const s = window.STUDENT_SAMPLE_DATA;
      return Promise.resolve({
        categories: copy(s.categories),
        departments: copy(s.departments),
        statuses: copy(s.statuses)
      });
    },

    submitComplaint(data) {
      const s = window.STUDENT_SAMPLE_DATA;
      const categoryName = (s.categories.find((c) => c.id === data.category_id) || {}).name;
      const departmentName = (s.departments.find((d) => d.id === data.department_id) || {}).name;

      return this.getComplaints().then((all) => {
        const nextId = all.reduce((max, c) => Math.max(max, c.id), 0) + 1;
        const time = nowIso();
        const complaint = {
          id: nextId,
          title: data.title,
          description: data.description,
          category: categoryName,
          department: departmentName,
          status: "Open",
          assigned_to: null,
          created_at: time,
          updated_at: time,
          updates: [{
            id: Date.now(), created_at: time, author_name: "You", author_role: "Student",
            note: "Complaint submitted.", old_status: null, new_status: "Open"
          }]
        };
        savePreviewSubmissions([complaint].concat(readPreviewSubmissions()));
        return complaint;
      });
    }
  };

  /* =======================================================================
   * 1B. REAL API source (used when USE_SAMPLE_DATA = False)
   * ======================================================================= */
  // INTEGRATION TODO: when Firebase login (auth.js) is ready, return
  // { Authorization: "Bearer <Firebase ID token>" } here so Flask knows
  // which student is making the request.
  function authHeaders() {
    return Promise.resolve({});
  }

  // Thrown when the server answers with an error status.
  class ApiError extends Error {
    constructor(status, body) {
      super("Request failed with status " + status);
      this.status = status;
      this.body = body || {};
    }
  }

  function apiRequest(method, url, body) {
    return authHeaders().then((headers) => {
      const options = { method, headers: Object.assign({ Accept: "application/json" }, headers) };
      if (body !== undefined) {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
      }
      return fetch(url, options);
    }).then((response) => {
      return response.json().catch(() => ({})).then((json) => {
        if (!response.ok) throw new ApiError(response.status, json);
        return json;
      });
    });
  }

  const apiSource = {
    getComplaints() {
      return apiRequest("GET", "/api/student/complaints").then((json) => json.complaints || []);
    },
    getComplaint(id) {
      return apiRequest("GET", "/api/student/complaints/" + encodeURIComponent(id))
        .then((json) => json.complaint)
        .catch((error) => {
          if (error instanceof ApiError && error.status === 404) return null;
          throw error;
        });
    },
    getFormOptions() {
      return apiRequest("GET", "/api/student/complaint-options");
    },
    submitComplaint(data) {
      return apiRequest("POST", "/api/student/complaints", data).then((json) => json.complaint);
    }
  };

  const source = useSampleData ? sampleSource : apiSource;

  /* =======================================================================
   * 2. UI helpers
   * ======================================================================= */

  /**
   * Create an element safely.
   *   el("a", { href: "/x", className: "link" }, ["Text", otherElement])
   * Text is always added with textContent, never as HTML, so user input such
   * as "<script>" is displayed as plain text and cannot run (prevents XSS).
   */
  function el(tag, props, children) {
    const node = document.createElement(tag);
    Object.entries(props || {}).forEach(([key, value]) => {
      if (value === null || value === undefined || value === false) return;
      if (key === "className") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key === "dataset") Object.assign(node.dataset, value);
      else node.setAttribute(key, value === true ? "" : value);
    });
    [].concat(children || []).forEach((child) => {
      if (child === null || child === undefined || child === false) return;
      node.appendChild(typeof child === "string" || typeof child === "number"
        ? document.createTextNode(String(child)) : child);
    });
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function parseDate(iso) {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  }

  function formatDate(iso) {
    const d = parseDate(iso);
    return d ? d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";
  }

  function formatDateTime(iso) {
    const d = parseDate(iso);
    return d ? d.toLocaleString(undefined, {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    }) : "—";
  }

  // "In Progress" -> "badge badge-in-progress"
  function statusBadge(status) {
    const slug = String(status || "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return el("span", { className: "badge badge-" + slug, text: status || "Unknown" });
  }

  function complaintRef(id) {
    return "#" + id;
  }

  function complaintUrl(id) {
    return "/student/complaints/" + encodeURIComponent(id);
  }

  /** One row of a complaint list (used on the dashboard and My Complaints). */
  function complaintListItem(c) {
    return el("li", { className: "complaint-item" }, [
      el("a", { className: "complaint-link", href: complaintUrl(c.id) }, [
        el("span", { className: "complaint-title" }, [
          el("span", { className: "complaint-ref", text: complaintRef(c.id) + " " }),
          c.title
        ]),
        statusBadge(c.status),
        el("span", {
          className: "complaint-meta",
          text: c.category + " · " + c.department + " · Submitted " + formatDate(c.created_at) +
            " · Updated " + formatDate(c.updated_at)
        })
      ])
    ]);
  }

  /** Friendly error box shown when data cannot be loaded. */
  function errorMessage(text) {
    return el("div", { className: "alert alert-error", role: "alert" }, [text]);
  }

  /* =======================================================================
   * 3. Mobile navigation toggle
   * ======================================================================= */
  function setUpNavToggle() {
    const button = document.querySelector(".nav-toggle");
    const nav = document.getElementById("main-nav");
    if (!button || !nav) return;
    button.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
  }
  setUpNavToggle();

  // Public interface used by the page scripts.
  return {
    useSampleData,
    STATUS_ORDER,
    getComplaints: () => source.getComplaints(),
    getComplaint: (id) => source.getComplaint(id),
    getFormOptions: () => source.getFormOptions(),
    submitComplaint: (data) => source.submitComplaint(data),
    ApiError,
    el,
    clear,
    formatDate,
    formatDateTime,
    statusBadge,
    complaintRef,
    complaintUrl,
    complaintListItem,
    errorMessage
  };
})();
