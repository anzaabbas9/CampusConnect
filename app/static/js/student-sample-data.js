/*
 * app/static/js/student-sample-data.js
 *
 * =====================================================================
 *   SAMPLE DATA - FOR FRONTEND PREVIEW ONLY. NOT REAL COMPLAINTS.
 * =====================================================================
 *
 * Purpose: Fake complaints so the Student Module pages can be seen and
 * tested before the database tables and the complaints API exist.
 *
 * - This file is loaded ONLY when USE_SAMPLE_DATA = True in
 *   app/routes/student.py. Real pages never load it.
 * - Nothing here is stored in PostgreSQL.
 * - The field names match the JSON the real API is expected to return
 *   (see "API CONTRACT" in student-common.js), so switching to real data
 *   needs no page changes.
 * - Category, department and status names follow the planned tables in
 *   README.md and are placeholders until Member 1 finalises the database.
 */

window.STUDENT_SAMPLE_DATA = Object.freeze({
  isSample: true,

  // ---- Lookup lists (planned tables: categories, departments, statuses) ----
  categories: [
    { id: 1, name: "Wi-Fi / Internet" },
    { id: 2, name: "Computer Lab" },
    { id: 3, name: "Hostel Maintenance" },
    { id: 4, name: "Exam Results" },
    { id: 5, name: "Fee Payment" },
    { id: 6, name: "Classroom Facilities" },
    { id: 7, name: "Other" }
  ],

  departments: [
    { id: 1, name: "IT Department" },
    { id: 2, name: "Hostel Office" },
    { id: 3, name: "Examinations Office" },
    { id: 4, name: "Accounts Office" },
    { id: 5, name: "Facilities Management" }
  ],

  // In workflow order. The detail page uses this order for its progress bar.
  statuses: ["Open", "In Progress", "Resolved", "Closed"],

  // ---- Complaints of the (sample) logged-in student ----
  complaints: [
    {
      id: 1007,
      title: "Projector not working in Room B-204",
      description: "The projector in Room B-204 does not turn on. Lectures for the Database Systems course have been affected for two days.",
      category: "Classroom Facilities",
      department: "Facilities Management",
      status: "Open",
      assigned_to: null,
      created_at: "2026-11-21T09:15:00",
      updated_at: "2026-11-21T09:15:00",
      updates: [
        { id: 1, created_at: "2026-11-21T09:15:00", author_name: "Sample Student", author_role: "Student",
          note: "Complaint submitted.", old_status: null, new_status: "Open" }
      ]
    },
    {
      id: 1006,
      title: "Hostel room window lock is broken",
      description: "The window lock in Hostel Block C, Room 112 is broken and the window cannot be closed properly at night.",
      category: "Hostel Maintenance",
      department: "Hostel Office",
      status: "In Progress",
      assigned_to: "Sample Staff (Hostel Office)",
      created_at: "2026-11-18T20:40:00",
      updated_at: "2026-11-20T11:05:00",
      updates: [
        { id: 2, created_at: "2026-11-18T20:40:00", author_name: "Sample Student", author_role: "Student",
          note: "Complaint submitted.", old_status: null, new_status: "Open" },
        { id: 3, created_at: "2026-11-19T10:00:00", author_name: "Sample Staff", author_role: "Staff",
          note: "Complaint assigned to the hostel maintenance team.", old_status: "Open", new_status: "In Progress" },
        { id: 4, created_at: "2026-11-20T11:05:00", author_name: "Sample Staff", author_role: "Staff",
          note: "Replacement lock ordered. A technician will visit once it arrives.", old_status: null, new_status: null }
      ]
    },
    {
      id: 1005,
      title: "Campus Wi-Fi disconnects every few minutes",
      description: "In the library second floor, the campus Wi-Fi disconnects every 5 to 10 minutes. This happens on both my laptop and my phone.",
      category: "Wi-Fi / Internet",
      department: "IT Department",
      status: "Resolved",
      assigned_to: "Sample Staff (IT Department)",
      created_at: "2026-11-10T14:22:00",
      updated_at: "2026-11-14T16:30:00",
      updates: [
        { id: 5, created_at: "2026-11-10T14:22:00", author_name: "Sample Student", author_role: "Student",
          note: "Complaint submitted.", old_status: null, new_status: "Open" },
        { id: 6, created_at: "2026-11-11T09:10:00", author_name: "Sample Staff", author_role: "Staff",
          note: "We are checking the access points on the library second floor.", old_status: "Open", new_status: "In Progress" },
        { id: 7, created_at: "2026-11-14T16:30:00", author_name: "Sample Staff", author_role: "Staff",
          note: "A faulty access point was replaced. Please let us know if the problem continues.", old_status: "In Progress", new_status: "Resolved" }
      ]
    },
    {
      id: 1004,
      title: "Semester fee payment not showing on portal",
      description: "I paid my semester fee through the bank on 1 November but the student portal still shows the fee as unpaid.",
      category: "Fee Payment",
      department: "Accounts Office",
      status: "Closed",
      assigned_to: "Sample Staff (Accounts Office)",
      created_at: "2026-11-03T08:50:00",
      updated_at: "2026-11-07T12:00:00",
      updates: [
        { id: 8, created_at: "2026-11-03T08:50:00", author_name: "Sample Student", author_role: "Student",
          note: "Complaint submitted.", old_status: null, new_status: "Open" },
        { id: 9, created_at: "2026-11-04T10:30:00", author_name: "Sample Staff", author_role: "Staff",
          note: "Please share the bank receipt number so we can match the payment.", old_status: "Open", new_status: "In Progress" },
        { id: 10, created_at: "2026-11-06T15:45:00", author_name: "Sample Staff", author_role: "Staff",
          note: "Payment found and updated on the portal.", old_status: "In Progress", new_status: "Resolved" },
        { id: 11, created_at: "2026-11-07T12:00:00", author_name: "Sample Staff", author_role: "Staff",
          note: "No further issues reported. Complaint closed.", old_status: "Resolved", new_status: "Closed" }
      ]
    },
    {
      id: 1003,
      title: "Mid-term result missing for one course",
      description: "My mid-term result for Operating Systems is missing on the results page, while all other courses are shown.",
      category: "Exam Results",
      department: "Examinations Office",
      status: "In Progress",
      assigned_to: "Sample Staff (Examinations Office)",
      created_at: "2026-10-28T11:00:00",
      updated_at: "2026-10-30T09:20:00",
      updates: [
        { id: 12, created_at: "2026-10-28T11:00:00", author_name: "Sample Student", author_role: "Student",
          note: "Complaint submitted.", old_status: null, new_status: "Open" },
        { id: 13, created_at: "2026-10-30T09:20:00", author_name: "Sample Staff", author_role: "Staff",
          note: "We have asked the course instructor to upload the missing result.", old_status: "Open", new_status: "In Progress" }
      ]
    },
    {
      id: 1002,
      title: "Lab computers missing required software",
      description: "Computers in Lab 3 do not have PostgreSQL installed, which is needed for our DBMS lab sessions.",
      category: "Computer Lab",
      department: "IT Department",
      status: "Open",
      assigned_to: null,
      created_at: "2026-10-25T13:35:00",
      updated_at: "2026-10-25T13:35:00",
      updates: [
        { id: 14, created_at: "2026-10-25T13:35:00", author_name: "Sample Student", author_role: "Student",
          note: "Complaint submitted.", old_status: null, new_status: "Open" }
      ]
    }
  ]
});
