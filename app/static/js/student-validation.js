/*
 * app/static/js/student-validation.js
 *
 * Purpose: Checks the "Submit Complaint" form before it is sent.
 *
 * validateComplaint(values, options) returns:
 *   { valid: true/false, errors: { fieldName: "message", ... }, cleaned: {...} }
 *
 * IMPORTANT: Browser checks only help the student fix mistakes quickly. Anyone
 * can bypass JavaScript, so the Flask API must repeat the same checks before
 * saving to the database (see the integration notes).
 */

const StudentValidation = (function () {
  "use strict";

  // The limits in one place, so the form hints and the checks always agree.
  const RULES = Object.freeze({
    TITLE_MIN: 5,
    TITLE_MAX: 100,
    DESCRIPTION_MIN: 20,
    DESCRIPTION_MAX: 1000
  });

  // At least one letter (any language) - rejects titles like "!!!!!" or "12345".
  const HAS_LETTER = /\p{L}/u;

  // Trim the ends and squash runs of spaces/tabs inside a single-line value.
  function cleanLine(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  // Trim the ends but keep line breaks the student typed in the description.
  function cleanText(value) {
    return String(value == null ? "" : value).replace(/\r\n/g, "\n").trim();
  }

  function toId(value) {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : null;
  }

  function validateTitle(title) {
    if (!title) return "Please enter a title for your complaint.";
    if (title.length < RULES.TITLE_MIN) return "The title must be at least " + RULES.TITLE_MIN + " characters.";
    if (title.length > RULES.TITLE_MAX) return "The title must be " + RULES.TITLE_MAX + " characters or fewer.";
    if (!HAS_LETTER.test(title)) return "The title must contain words, not only numbers or symbols.";
    return null;
  }

  function validateChoice(id, allowedIds, label) {
    if (id === null) return "Please choose a " + label + ".";
    if (allowedIds && allowedIds.indexOf(id) === -1) return "Please choose a valid " + label + " from the list.";
    return null;
  }

  function validateDescription(description) {
    if (!description) return "Please describe the problem.";
    if (description.length < RULES.DESCRIPTION_MIN) {
      return "Please give more detail (at least " + RULES.DESCRIPTION_MIN + " characters).";
    }
    if (description.length > RULES.DESCRIPTION_MAX) {
      return "The description must be " + RULES.DESCRIPTION_MAX + " characters or fewer.";
    }
    if (!HAS_LETTER.test(description)) return "The description must contain words, not only numbers or symbols.";
    return null;
  }

  /**
   * values:  { title, category_id, department_id, description } (raw form values)
   * options: { categoryIds: [1, 2, ...], departmentIds: [1, 2, ...] } (optional)
   */
  function validateComplaint(values, options) {
    const opts = options || {};
    const cleaned = {
      title: cleanLine(values.title),
      category_id: toId(values.category_id),
      department_id: toId(values.department_id),
      description: cleanText(values.description)
    };

    const errors = {};
    const checks = {
      title: validateTitle(cleaned.title),
      category_id: validateChoice(cleaned.category_id, opts.categoryIds, "category"),
      department_id: validateChoice(cleaned.department_id, opts.departmentIds, "department"),
      description: validateDescription(cleaned.description)
    };
    Object.keys(checks).forEach((field) => {
      if (checks[field]) errors[field] = checks[field];
    });

    return { valid: Object.keys(errors).length === 0, errors, cleaned };
  }

  /** Validate just one field (used for live feedback while typing). */
  function validateField(field, values, options) {
    return validateComplaint(values, options).errors[field] || null;
  }

  return { RULES, validateComplaint, validateField, cleanLine, cleanText };
})();
