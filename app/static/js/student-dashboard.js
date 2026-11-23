/*
 * app/static/js/student-dashboard.js
 * Purpose: Fills the student dashboard: counts per status, the 5 most recent
 * complaints, and the 5 latest complaint updates.
 */

(function () {
  "use strict";

  const { el, clear } = StudentApp;
  const RECENT_LIMIT = 5;

  function byNewest(field) {
    return (a, b) => String(b[field]).localeCompare(String(a[field]));
  }

  function renderStats(complaints) {
    StudentApp.STATUS_ORDER.forEach((status) => {
      const count = complaints.filter((c) => c.status === status).length;
      const node = document.querySelector('[data-stat="' + status + '"]');
      if (node) node.textContent = count;
    });

    const total = complaints.length;
    const active = complaints.filter((c) => c.status === "Open" || c.status === "In Progress").length;
    document.getElementById("dashboard-summary").textContent = total === 0
      ? "You have not submitted any complaints yet."
      : "You have submitted " + total + " complaint" + (total === 1 ? "" : "s") +
        ", " + active + " still being handled.";
  }

  function renderRecent(complaints) {
    const box = document.getElementById("recent-complaints");
    clear(box);
    if (complaints.length === 0) {
      box.appendChild(el("div", { className: "empty-state" }, [
        el("h3", { text: "No complaints yet" }),
        el("p", { text: "When you submit a complaint, it will appear here." }),
        el("a", { className: "btn btn-primary", href: "/student/complaints/new", text: "Submit your first complaint" })
      ]));
      return;
    }
    const list = el("ul", { className: "complaint-list" });
    complaints.slice().sort(byNewest("created_at")).slice(0, RECENT_LIMIT)
      .forEach((c) => list.appendChild(StudentApp.complaintListItem(c)));
    box.appendChild(list);
  }

  function renderActivity(complaints) {
    const box = document.getElementById("latest-activity");
    clear(box);

    // Collect every update together with the complaint it belongs to.
    const updates = [];
    complaints.forEach((c) => (c.updates || []).forEach((u) => updates.push({ complaint: c, update: u })));
    updates.sort((a, b) => String(b.update.created_at).localeCompare(String(a.update.created_at)));

    if (updates.length === 0) {
      box.appendChild(el("p", { className: "empty-state", text: "No updates yet." }));
      return;
    }

    const list = el("ul", { className: "timeline" });
    updates.slice(0, RECENT_LIMIT).forEach(({ complaint, update }) => {
      list.appendChild(el("li", { className: "timeline-item" }, [
        el("div", { className: "timeline-head" }, [
          el("a", { href: StudentApp.complaintUrl(complaint.id), text: StudentApp.complaintRef(complaint.id) }),
          el("span", { className: "timeline-date", text: StudentApp.formatDateTime(update.created_at) })
        ]),
        update.new_status ? el("div", { className: "timeline-status" }, ["Status: ", StudentApp.statusBadge(update.new_status)]) : null,
        el("p", { className: "timeline-note", text: update.note })
      ]));
    });
    box.appendChild(list);
  }

  StudentApp.getComplaints()
    .then((complaints) => {
      renderStats(complaints);
      renderRecent(complaints);
      renderActivity(complaints);
    })
    .catch(() => {
      document.getElementById("dashboard-summary").textContent = "";
      const recent = document.getElementById("recent-complaints");
      clear(recent);
      recent.appendChild(StudentApp.errorMessage("Sorry, your complaints could not be loaded. Please refresh the page or try again later."));
      clear(document.getElementById("latest-activity"));
    });
})();
