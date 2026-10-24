Registrar — Free School Management System Template by uiCookies
https://uicookies.com/

Registrar is a free school management system template: an admin dashboard for a
school office, built on Bootstrap 5 with plain vanilla JavaScript. It runs a
fictional school, Harbourview Academy, with 652 students across 24 classes, so
every screen is full of believable data: a dashboard with enrolment, attendance,
fee and staff figures, a searchable student directory, student profiles with an
attendance calendar and fee ledger, a morning register with Present, Absent and
Late toggles, fee invoices with a record-payment form, and a weekly timetable by
class or teacher. Deep teal and warm amber on slate neutrals, Figtree type with
tabular figures in tables, a collapsible sidebar and a light/dark mode toggle.
Free for personal and commercial use. Attribution is optional but always welcome — https://uicookies.com/license/

WHAT'S INSIDE
  index.html            Dashboard: KPI tiles, attendance trend, fee collection,
                        attendance by grade, admissions, notices, upcoming exams
  students.html         Student directory: search, filters, sorting, pagination,
                        CSV export and an add-student form
  student.html          Student profile (open any student from the directory)
  attendance.html       Take attendance by class and date
  fees.html             Invoices, record-payment form, overdue follow-ups
  timetable.html        Weekly timetable by class or by teacher
  login.html            Staff sign-in
  css/vendor/           Bootstrap 5.3.8 (minified, self-hosted)
  css/style.css         Design layer: colour and type tokens at the top,
                        then every component, plus dark mode
  js/vendor/            Bootstrap 5.3.8 bundle (includes Popper)
  js/main.js            Demo data and all behaviour, vanilla JavaScript
  img/                  Sign-in photo and favicon
  CREDITS.txt           Source and licence of the photo

NOTES
  - Built on Bootstrap 5.3.8. No jQuery, no chart library, no other plugins.
  - All data is fictional and generated in section 1 of js/main.js from small
    arrays (names, classes, teachers, fees) with a seeded random generator, so
    every page shows the same school. Replace those builders with calls to your
    own API; the page functions only read STUDENTS, INVOICES, CLASSES and
    TEACHERS. Blocks marked data-render in the HTML are filled from that data;
    the markup inside them is a pre-rendered copy for visitors without
    JavaScript.
  - Charts are inline SVG drawn by main.js. Each chart has a Table view, and
    hover or arrow keys show the value for each day or month.
  - Forms are front-end only. New students and payments stay in the browser
    tab, saved registers are kept in localStorage, and the sign-in form checks
    the fields but sends nothing. Connect your back end or a form service
    before going live.
  - Rebrand by editing the custom properties at the top of css/style.css
    (--rg-primary, --rg-accent, the neutrals and the dark mode block).
  - The demo is set on Thursday 15 October 2026 (SCHOOL.today in js/main.js),
    week 6 of a 15-week term.
  - Replace img/campus.jpg with a photo of your own school before launch.
