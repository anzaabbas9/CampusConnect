/*
 * app/static/js/student-complaint-detail.js
 * Purpose: Complaint details page - shows the complaint, a status progress
 * tracker (Open -> In Progress -> Resolved -> Closed) and the update history.
 */

(function () {
  "use strict";

  const { el, clear } = StudentApp;
  const container = document.getElementById("complaint-detail");
  const complaintId = Number(container.dataset.complaintId);

  function metaItem(label, value) {
    return el("div", {}, [el("dt", { text: label }), el("dd", {}, [value])]);
  }

  function renderHeader(c) {
    return el("section", { className: "card" }, [
      el("div", { className: "detail-header" }, [
        el("div", {}, [StudentApp.statusBadge(c.status)]),
        el("h1", {}, [el("span", { className: "complaint-ref", text: StudentApp.complaintRef(c.id) + " " }), c.title])
      ]),
      el("dl", { className: "detail-meta" }, [
        metaItem("Category", c.category || "—"),
        metaItem("Department", c.department || "—"),
        metaItem("Assigned to", c.assigned_to || "Not assigned yet"),
        metaItem("Submitted", StudentApp.formatDateTime(c.created_at)),
        metaItem("Last updated", StudentApp.formatDateTime(c.updated_at)),
        metaItem("Current status", c.status)
      ])
    ]);
  }

  function renderDescription(c) {
    return el("section", { className: "card", "aria-labelledby": "description-heading" }, [
      el("h2", { id: "description-heading", text: "Description" }),
      el("p", { className: "description-text", text: c.description })
    ]);
  }

  function renderProgress(c) {
    const steps = StudentApp.STATUS_ORDER;
    const current = steps.indexOf(c.status);
    const list = el("ol", { className: "status-steps" });
    steps.forEach((step, index) => {
      // Steps before the current one are done. The final step (Closed) counts
      // as done when the complaint has reached it.
      const done = index < current || (index === current && index === steps.length - 1);
      const isCurrent = index === current && !done;
      list.appendChild(el("li", {
        className: "status-step" + (done ? " done" : "") + (isCurrent ? " current" : ""),
        "aria-current": isCurrent ? "step" : null
      }, [step]));
    });
    return el("section", { className: "card", "aria-labelledby": "progress-heading" }, [
      el("h2", { id: "progress-heading", text: "Status" }),
      el("p", { className: "visually-hidden", text: "Current status: " + c.status }),
      list
    ]);
  }

  function renderHistory(c) {
    // Newest update first.
    const updates = (c.updates || []).slice()
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

    let body;
    if (updates.length === 0) {
      body = el("p", { className: "empty-state", text: "No updates yet." });
    } else {
      body = el("ol", { className: "timeline" });
      updates.forEach((u) => {
        let statusLine = null;
        if (u.new_status && u.old_status) {
          statusLine = el("div", { className: "timeline-status" }, [
            "Status changed: ", StudentApp.statusBadge(u.old_status), " → ", StudentApp.statusBadge(u.new_status)
          ]);
        } else if (u.new_status) {
          statusLine = el("div", { className: "timeline-status" }, ["Status: ", StudentApp.statusBadge(u.new_status)]);
        }
        body.appendChild(el("li", { className: "timeline-item" }, [
          el("div", { className: "timeline-head" }, [
            el("span", { className: "timeline-author", text: u.author_name || "Unknown" }),
            u.author_role ? el("span", { className: "timeline-role", text: "(" + u.author_role + ")" }) : null,
            el("time", { className: "timeline-date", datetime: u.created_at, text: StudentApp.formatDateTime(u.created_at) })
          ]),
          statusLine,
          u.note ? el("p", { className: "timeline-note", text: u.note }) : null
        ]));
      });
    }

    return el("section", { className: "card", "aria-labelledby": "history-heading" }, [
      el("div", { className: "card-header" }, [
        el("h2", { id: "history-heading", text: "Update history" }),
        el("span", { className: "results-summary", text: updates.length + " update" + (updates.length === 1 ? "" : "s") })
      ]),
      body
    ]);
  }

  function renderNotFound() {
    clear(container);
    container.appendChild(el("section", { className: "card empty-state" }, [
      el("h1", { text: "Complaint not found" }),
      el("p", { text: "This complaint does not exist, or it was not submitted by you." }),
      el("a", { className: "btn btn-primary", href: "/student/complaints", text: "Back to My Complaints" })
    ]));
    document.title = "Complaint not found · CampusConnect";
  }

  function render(c) {
    clear(container);
    container.appendChild(renderHeader(c));
    container.appendChild(el("div", { className: "detail-layout" }, [
      el("div", {}, [renderDescription(c), renderHistory(c)]),
      el("div", {}, [renderProgress(c)])
    ]));
  }

  StudentApp.getComplaint(complaintId)
    .then((complaint) => (complaint ? render(complaint) : renderNotFound()))
    .catch(() => {
      clear(container);
      container.appendChild(StudentApp.errorMessage("Sorry, this complaint could not be loaded. Please refresh the page or try again later."));
    });
})();
