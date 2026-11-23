/*
 * app/static/js/student-submit-complaint.js
 * Purpose: Runs the "Submit a complaint" form:
 *   - fills the Category and Department dropdowns
 *   - shows character counters
 *   - checks each field (live, and again on Submit) using StudentValidation
 *   - sends the complaint and shows a success message
 */

(function () {
  "use strict";

  const { el, clear } = StudentApp;
  const RULES = StudentValidation.RULES;
  const FIELDS = ["title", "category_id", "department_id", "description"];
  const LABELS = { title: "Title", category_id: "Category", department_id: "Department", description: "Description" };

  const form = document.getElementById("complaint-form");
  const formCard = document.getElementById("form-card");
  const submitButton = document.getElementById("submit-button");
  const errorSummary = document.getElementById("error-summary");
  const successBox = document.getElementById("submit-success");

  let options = { categoryIds: [], departmentIds: [] };
  let submitting = false;
  const touched = new Set(); // Fields the student has already left once.

  /* ---------- Helpers ---------- */
  function field(name) {
    return form.elements[name];
  }

  function formValues() {
    const values = {};
    FIELDS.forEach((name) => { values[name] = field(name).value; });
    return values;
  }

  function showFieldError(name, message) {
    const input = field(name);
    const box = document.getElementById(name + "-error");
    box.textContent = message || "";
    if (message) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }

  function fillSelect(select, items, placeholder) {
    clear(select);
    select.appendChild(el("option", { value: "", text: placeholder }));
    items.forEach((item) => select.appendChild(el("option", { value: String(item.id), text: item.name })));
  }

  function updateCounter(name, max) {
    const length = field(name).value.length;
    const counter = document.getElementById(name + "-count");
    counter.textContent = length + " / " + max;
    counter.classList.toggle("over", length > max);
  }

  function hideErrorSummary() {
    errorSummary.hidden = true;
    clear(errorSummary);
  }

  function showErrorSummary(errors) {
    clear(errorSummary);
    const names = FIELDS.filter((name) => errors[name]);
    errorSummary.appendChild(el("p", {}, [el("strong", {
      text: "Please fix " + (names.length === 1 ? "this problem" : "these " + names.length + " problems") + ":"
    })]));
    const list = el("ul");
    names.forEach((name) => {
      // Each item links to its field so the student can jump straight to it.
      const link = el("a", { href: "#" + name, text: LABELS[name] + ": " + errors[name] });
      link.addEventListener("click", (event) => {
        event.preventDefault();
        field(name).focus();
      });
      list.appendChild(el("li", {}, [link]));
    });
    errorSummary.appendChild(list);
    errorSummary.hidden = false;
    errorSummary.focus();
  }

  function showGeneralError(message) {
    clear(errorSummary);
    errorSummary.appendChild(el("p", { text: message }));
    errorSummary.hidden = false;
    errorSummary.focus();
  }

  function setSubmitting(on) {
    submitting = on;
    submitButton.disabled = on;
    submitButton.textContent = on ? "Submitting…" : "Submit complaint";
  }

  /* ---------- Live validation ---------- */
  function validateOne(name) {
    showFieldError(name, StudentValidation.validateField(name, formValues(), options));
  }

  FIELDS.forEach((name) => {
    const input = field(name);
    // Check a field when the student leaves it...
    input.addEventListener("blur", () => {
      touched.add(name);
      validateOne(name);
    });
    // ...and re-check while typing once it has been visited, so errors
    // disappear as soon as they are fixed.
    input.addEventListener("input", () => {
      if (touched.has(name)) validateOne(name);
    });
    input.addEventListener("change", () => {
      if (input.tagName === "SELECT") { touched.add(name); validateOne(name); }
    });
  });

  field("title").addEventListener("input", () => updateCounter("title", RULES.TITLE_MAX));
  field("description").addEventListener("input", () => updateCounter("description", RULES.DESCRIPTION_MAX));

  /* ---------- Success message ---------- */
  function showSuccess(complaint) {
    clear(successBox);
    const children = [
      el("p", {}, [el("strong", { text: "Your complaint has been submitted." })]),
      el("p", {}, [
        "Reference number: ",
        el("a", { href: StudentApp.complaintUrl(complaint.id), text: StudentApp.complaintRef(complaint.id) }),
        ". You can follow its status on the complaint page."
      ])
    ];
    if (StudentApp.useSampleData) {
      children.push(el("p", {
        text: "Preview only: this complaint was NOT saved to the database. It is kept in this browser tab until you close it."
      }));
    }
    const again = el("button", { type: "button", className: "btn btn-secondary", text: "Submit another complaint" });
    again.addEventListener("click", resetForm);
    children.push(el("div", { className: "form-actions" }, [
      el("a", { className: "btn btn-primary", href: StudentApp.complaintUrl(complaint.id), text: "View complaint" }),
      again
    ]));

    successBox.appendChild(el("div", { className: "alert alert-success", role: "status" }, children));
    successBox.hidden = false;
    formCard.hidden = true;
    successBox.querySelector("a").focus();
  }

  function resetForm() {
    form.reset();
    touched.clear();
    FIELDS.forEach((name) => showFieldError(name, null));
    hideErrorSummary();
    updateCounter("title", RULES.TITLE_MAX);
    updateCounter("description", RULES.DESCRIPTION_MAX);
    successBox.hidden = true;
    formCard.hidden = false;
    field("title").focus();
  }

  /* ---------- Submit ---------- */
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (submitting) return; // Ignore double clicks.

    const result = StudentValidation.validateComplaint(formValues(), options);
    FIELDS.forEach((name) => { touched.add(name); showFieldError(name, result.errors[name]); });

    if (!result.valid) {
      showErrorSummary(result.errors);
      return;
    }

    hideErrorSummary();
    setSubmitting(true);
    StudentApp.submitComplaint(result.cleaned)
      .then((complaint) => {
        setSubmitting(false);
        showSuccess(complaint);
      })
      .catch((error) => {
        setSubmitting(false);
        // The server rejected some fields (HTTP 400): show its messages.
        const serverErrors = error instanceof StudentApp.ApiError && error.body.errors;
        if (serverErrors && FIELDS.some((name) => serverErrors[name])) {
          FIELDS.forEach((name) => showFieldError(name, serverErrors[name]));
          showErrorSummary(serverErrors);
        } else {
          showGeneralError("Sorry, your complaint could not be submitted. Please check your connection and try again.");
        }
      });
  });

  /* ---------- Start ---------- */
  updateCounter("title", RULES.TITLE_MAX);
  updateCounter("description", RULES.DESCRIPTION_MAX);
  submitButton.disabled = true; // Until the dropdowns are loaded.

  StudentApp.getFormOptions()
    .then((opts) => {
      fillSelect(field("category_id"), opts.categories || [], "Choose a category…");
      fillSelect(field("department_id"), opts.departments || [], "Choose a department…");
      options = {
        categoryIds: (opts.categories || []).map((c) => c.id),
        departmentIds: (opts.departments || []).map((d) => d.id)
      };
      submitButton.disabled = false;
    })
    .catch(() => {
      showGeneralError("Sorry, the form could not be loaded. Please refresh the page or try again later.");
    });
})();
