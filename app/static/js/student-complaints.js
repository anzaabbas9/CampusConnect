/*
 * app/static/js/student-complaints.js
 * Purpose: "My Complaints" page - loads the student's complaints once, then
 * searches, filters and sorts them in the browser as the student types.
 *
 * The current filters are also written to the address bar
 * (e.g. /student/complaints?status=Open), so dashboard links work and a page
 * refresh keeps the filters.
 */

(function () {
  "use strict";

  const { el, clear } = StudentApp;

  const form = document.getElementById("filters");
  const searchInput = document.getElementById("filter-search");
  const statusSelect = document.getElementById("filter-status");
  const categorySelect = document.getElementById("filter-category");
  const sortSelect = document.getElementById("filter-sort");
  const summary = document.getElementById("results-summary");
  const clearButton = document.getElementById("clear-filters");
  const results = document.getElementById("complaint-results");

  let allComplaints = [];

  function fillSelect(select, values) {
    values.forEach((value) => select.appendChild(el("option", { value, text: value })));
  }

  // Read ?q=...&status=...&category=...&sort=... from the address bar.
  function readFiltersFromUrl() {
    const params = new URLSearchParams(window.location.search);
    searchInput.value = params.get("q") || "";
    setSelectValue(statusSelect, params.get("status"));
    setSelectValue(categorySelect, params.get("category"));
    setSelectValue(sortSelect, params.get("sort"));
  }

  // Only accept values that exist in the list (ignore made-up URL values).
  function setSelectValue(select, value) {
    if (value && Array.from(select.options).some((o) => o.value === value)) {
      select.value = value;
    }
  }

  function writeFiltersToUrl(filters) {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.status) params.set("status", filters.status);
    if (filters.category) params.set("category", filters.category);
    if (filters.sort !== "newest") params.set("sort", filters.sort);
    const query = params.toString();
    history.replaceState(null, "", window.location.pathname + (query ? "?" + query : ""));
  }

  function currentFilters() {
    return {
      q: searchInput.value.trim(),
      status: statusSelect.value,
      category: categorySelect.value,
      sort: sortSelect.value
    };
  }

  function matchesSearch(c, query) {
    if (!query) return true;
    const q = query.toLowerCase().replace(/^#/, "");
    return String(c.id).includes(q) ||
      [c.title, c.description, c.category, c.department]
        .some((text) => String(text || "").toLowerCase().includes(q));
  }

  const SORTERS = {
    newest: (a, b) => String(b.created_at).localeCompare(String(a.created_at)),
    oldest: (a, b) => String(a.created_at).localeCompare(String(b.created_at)),
    updated: (a, b) => String(b.updated_at).localeCompare(String(a.updated_at))
  };

  function applyFilters() {
    const f = currentFilters();
    writeFiltersToUrl(f);

    const shown = allComplaints
      .filter((c) => !f.status || c.status === f.status)
      .filter((c) => !f.category || c.category === f.category)
      .filter((c) => matchesSearch(c, f.q))
      .sort(SORTERS[f.sort] || SORTERS.newest);

    const filtering = Boolean(f.q || f.status || f.category);
    clearButton.hidden = !filtering;
    summary.textContent = "Showing " + shown.length + " of " + allComplaints.length +
      " complaint" + (allComplaints.length === 1 ? "" : "s");

    clear(results);
    if (allComplaints.length === 0) {
      results.appendChild(el("div", { className: "empty-state" }, [
        el("h3", { text: "No complaints yet" }),
        el("p", { text: "You have not submitted any complaints." }),
        el("a", { className: "btn btn-primary", href: "/student/complaints/new", text: "Submit a complaint" })
      ]));
      return;
    }
    if (shown.length === 0) {
      results.appendChild(el("div", { className: "empty-state" }, [
        el("h3", { text: "No matching complaints" }),
        el("p", { text: "Try a different search word or clear the filters." })
      ]));
      return;
    }
    const list = el("ul", { className: "complaint-list" });
    shown.forEach((c) => list.appendChild(StudentApp.complaintListItem(c)));
    results.appendChild(list);
  }

  // Filter as the student types or changes a dropdown. The form is never
  // actually submitted (pressing Enter just keeps the current results).
  form.addEventListener("submit", (event) => event.preventDefault());
  form.addEventListener("input", applyFilters);
  form.addEventListener("change", applyFilters);

  clearButton.addEventListener("click", () => {
    searchInput.value = "";
    statusSelect.value = "";
    categorySelect.value = "";
    applyFilters();
    searchInput.focus();
  });

  Promise.all([StudentApp.getComplaints(), StudentApp.getFormOptions()])
    .then(([complaints, options]) => {
      allComplaints = complaints;
      fillSelect(statusSelect, options.statuses || StudentApp.STATUS_ORDER);
      fillSelect(categorySelect, (options.categories || []).map((c) => c.name));
      readFiltersFromUrl();
      applyFilters();
    })
    .catch(() => {
      summary.textContent = "";
      clear(results);
      results.appendChild(StudentApp.errorMessage("Sorry, your complaints could not be loaded. Please refresh the page or try again later."));
    });
})();
