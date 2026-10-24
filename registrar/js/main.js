/* ==========================================================================
   Registrar — Free School Management System Template
   main.js · vanilla JavaScript, no jQuery, no chart library
   Author: uiCookies · https://uicookies.com/ · Licence: https://uicookies.com/license/

   1. Demo data ....... the fictional Harbourview Academy, generated from the
                        small arrays below with a seeded random generator, so
                        every page and every reload shows the same school
   2. Helpers
   3. Layout .......... theme, sidebar, search, notifications, toasts
   4. Charts .......... hand-built SVG line and column charts with a hover layer
   5. Pages ........... dashboard, students, profile, attendance, fees,
                        timetable, sign-in

   To connect a real back end, replace the builders in section 1 with data
   from your API; the page functions only read STUDENTS, INVOICES, CLASSES
   and TEACHERS.
   ========================================================================== */
(() => {
  'use strict';

  /* ------------------------------------------------------------------------
     1. DEMO DATA
     ------------------------------------------------------------------------ */

  const SCHOOL = {
    name: 'Harbourview Academy',
    year: '2026–27',
    term: 'Term 1',
    today: new Date(2026, 9, 15),        // the demo's "today": Thu 15 Oct 2026
    termStart: new Date(2026, 8, 8),
    termEnd: new Date(2026, 11, 18),
    invoiceDate: new Date(2026, 7, 14),
    feeDue: new Date(2026, 8, 15),
  };
  const TODAY = SCHOOL.today;
  const USER = { name: 'Eleanor Hughes', first: 'Eleanor', role: 'Registrar' };
  const HOLIDAYS = {
    '2026-10-12': 'Thanksgiving Day',
    '2026-11-11': 'Remembrance Day',
    '2026-11-20': 'Professional development day',
  };

  // Seeded random numbers (a SplitMix32-style counter with an avalanche mix):
  // the same seed always builds the same school.
  const mix = (x) => {
    x = Math.imul(x ^ (x >>> 16), 0x21f0aaad);
    x = Math.imul(x ^ (x >>> 15), 0x735a2d97);
    return ((x ^ (x >>> 15)) >>> 0) / 4294967296;
  };
  let seed = 20261015;
  const rand = () => { seed = (seed + 0x9e3779b9) | 0; return mix(seed); };
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const between = (min, max) => min + rand() * (max - min);
  const noise = (a, b) => mix(Math.imul(a + 1, 0x85ebca6b) ^ Math.imul(b + 7, 0xc2b2ae35) ^ 0x27d4eb2f);
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const round50 = (v) => Math.round(v / 50) * 50;

  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromIso = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const daysBetween = (a, b) => Math.round((b - a) / 86400000);
  const weekday = (d) => (d.getDay() === 6 ? addDays(d, -1) : d.getDay() === 0 ? addDays(d, -2) : d);
  const dateBetween = (a, b) => { const d = new Date(a.getTime() + rand() * (b - a)); d.setHours(0, 0, 0, 0); return d; };

  const FIRST = ['Amara', 'Liam', 'Priya', 'Noah', 'Mei', 'Ethan', 'Sofia', 'Lucas', 'Aaliyah', 'Owen', 'Hana', 'Mateo', 'Zara', 'Benjamin', 'Arjun', 'Isla', 'Kai', 'Nadia', 'Samuel', 'Leila', 'Elijah', 'Maya', 'Omar', 'Grace', 'Theo', 'Ananya', 'Felix', 'Yuki', 'Jonah', 'Ines', 'Rohan', 'Clara', 'Tariq', 'Emma', 'Declan', 'Ayesha', 'Hugo', 'Nora', 'Malik', 'Ruby', 'Dev', 'Freya', 'Isaac', 'Lina', 'Caleb', 'Selin', 'Mason', 'Ava', 'Kofi', 'Julia', 'Ravi', 'Elena', 'Finn', 'Mariam', 'Oscar', 'Keira', 'Idris', 'Lucy', 'Tomas', 'Harper', 'Rafael', 'Chloe', 'Aiden', 'Imani'];
  const LAST = ['Okafor', 'Tremblay', 'Sharma', 'Gagnon', 'Chen', 'MacDonald', 'Nguyen', 'Roy', 'Patel', 'Campbell', 'Kim', 'Fraser', 'Haddad', 'Singh', 'Murphy', 'Ali', 'Bouchard', 'Wong', 'Mensah', 'Morrison', 'Ahmed', 'Leblanc', 'Park', 'Sinclair', 'Kaur', 'Robertson', 'Okonkwo', 'Pelletier', 'Lee', 'McKenzie', 'Rahman', 'Grant', 'Hosseini', 'Doucette', 'Tanaka', 'Stewart', 'Mohamed', 'Boudreau', 'Santos', 'Ferguson', 'Chowdhury', 'Lavoie', 'Yilmaz', 'Reid', 'Abara', 'Cormier', 'Nakamura', 'Walsh', 'Ibrahim', 'Duarte', 'Petrov', 'Byrne'];
  const ADULT_F = ['Adaeze', 'Sunita', 'Lin', 'Rosa', 'Fatima', 'Aiko', 'Grace', 'Julie', 'Esther', 'Mariam', 'Sophie', 'Leah', 'Karen', 'Monique', 'Yasmin', 'Heather', 'Colleen', 'Irene', 'Anjali', 'Nadia'];
  const ADULT_M = ['Michael', 'Pierre', 'David', 'James', 'Kevin', 'Carlos', 'Robert', 'Marc', 'Hassan', 'Thomas', 'Paul', 'Andrew', 'Daniel', 'Chinedu', 'Ahmed', 'Brian', 'Luis', 'Vikram', 'Omar', 'Steven'];
  const HOUSES = ['Anchor', 'Beacon', 'Compass', 'Tide'];
  const ROUTES = ['Route 1, Harbour Road', 'Route 2, Cove Street', 'Route 3, North Ridge', 'Route 4, Lighthouse Lane', 'Route 5, Mill Creek'];
  const MEDICAL = ['Peanut allergy, adrenaline auto-injector kept in the office', 'Asthma, carries an inhaler', 'Type 1 diabetes, care plan on file', 'Wears prescription glasses', 'Lactose intolerant'];
  const PREV_SCHOOLS = ['Seaside Elementary', 'Northfield Middle School', 'Bayview Public School', 'St. Brendan Elementary', 'Cove Road School', 'Lighthouse Point Academy'];

  const SUBJECTS = {
    MA: { name: 'Mathematics', task: 'Unit 2 test: linear relations' },
    EN: { name: 'English', task: 'Personal essay' },
    SC: { name: 'Science', task: 'Lab report: density' },
    FR: { name: 'French', task: 'Oral presentation' },
    HI: { name: 'History', task: 'Source analysis' },
    GE: { name: 'Geography', task: 'Map skills quiz' },
    PE: { name: 'Phys. Ed.', task: 'Fitness assessment' },
    AR: { name: 'Visual Arts', task: 'Still-life study' },
    MU: { name: 'Music', task: 'Ensemble performance' },
    CS: { name: 'Computing', task: 'Python project 1' },
  };
  const SUBJECT_CODES = Object.keys(SUBJECTS);

  // [id, title, first, last, subject, grades taught, specialist room]
  const TEACHERS = [
    ['T01', 'Mr.', 'Daniel', 'Osei', 'MA', [7]], ['T02', 'Ms.', 'Priya', 'Raman', 'MA', [8]],
    ['T03', 'Mr.', 'Marc', 'Lefebvre', 'MA', [9]], ['T04', 'Dr.', 'Hannah', 'Sato', 'MA', [10]],
    ['T05', 'Mr.', 'Owen', 'Gallagher', 'MA', [11]], ['T06', 'Ms.', 'Farah', 'Siddiqui', 'MA', [12]],
    ['T07', 'Ms.', 'Claire', 'Donovan', 'EN', [7]], ['T08', 'Mr.', 'Joseph', 'Achebe', 'EN', [8]],
    ['T09', 'Ms.', 'Laura', 'Kowalski', 'EN', [9]], ['T10', 'Mr.', 'Samuel', 'Reyes', 'EN', [10]],
    ['T11', 'Ms.', 'Nicole', 'Fortin', 'EN', [11]], ['T12', 'Mr.', 'Graham', 'Whitfield', 'EN', [12]],
    ['T13', 'Ms.', 'Aisha', 'Karimi', 'SC', [7], 'Lab 1'], ['T14', 'Mr.', 'Victor', 'Huang', 'SC', [8], 'Lab 2'],
    ['T15', 'Dr.', 'Emily', 'Carrington', 'SC', [9], 'Lab 3'], ['T16', 'Mr.', 'Kwame', 'Asante', 'SC', [10], 'Lab 4'],
    ['T17', 'Ms.', 'Ingrid', 'Larsen', 'SC', [11], 'Lab 5'], ['T18', 'Dr.', 'Rajesh', 'Menon', 'SC', [12], 'Lab 6'],
    ['T19', 'Mme', 'Sylvie', 'Arsenault', 'FR', [7, 8]], ['T20', 'M.', 'Olivier', 'Thibault', 'FR', [9, 10]],
    ['T21', 'Mme', 'Nathalie', 'Poirier', 'FR', [11, 12]], ['T22', 'Mr.', 'Duncan', 'MacLeod', 'HI', [7, 8, 9]],
    ['T23', 'Ms.', 'Rebecca', 'Stein', 'HI', [10, 11]], ['T24', 'Mr.', 'Adrian', 'Kostas', 'HI', [12]],
    ['T25', 'Ms.', 'Julia', 'Bergstrom', 'GE', [7, 8, 9]], ['T26', 'Mr.', 'Patrick', 'Nolan', 'GE', [10, 11, 12]],
    ['T27', 'Mr.', 'Tyler', 'Brooks', 'PE', [7, 8], 'Gym A'], ['T28', 'Ms.', 'Keisha', 'Hollis', 'PE', [9, 10], 'Gym B'],
    ['T29', 'Mr.', 'Eric', 'Johansson', 'PE', [11, 12], 'Field house'], ['T30', 'Ms.', 'Mira', 'Castellano', 'AR', [7, 8, 9], 'Art studio 1'],
    ['T31', 'Mr.', 'Jonas', 'Whitaker', 'AR', [10, 11, 12], 'Art studio 2'], ['T32', 'Ms.', 'Harriet', 'Vance', 'MU', [7, 8, 9], 'Music room'],
    ['T33', 'Mr.', 'Felipe', 'Arroyo', 'MU', [10, 11, 12], 'Band room'], ['T34', 'Ms.', 'Deepa', 'Nair', 'CS', [7, 8, 9], 'Computer lab 1'],
    ['T35', 'Mr.', 'Connor', 'Blake', 'CS', [10, 11, 12], 'Computer lab 2'],
  ].map(([id, title, first, last, subject, grades, room]) => ({
    id, title, first, last, subject, grades, room: room || '', name: `${first} ${last}`, display: `${title} ${last}`,
  }));
  const TEACHER = Object.fromEntries(TEACHERS.map((t) => [t.id, t]));
  const teacherFor = (subject, grade) => TEACHERS.find((t) => t.subject === subject && t.grades.includes(grade));

  /* Weekly timetable patterns: six teaching periods (rows) x Mon-Fri, one per
     grade. Section B shifts the pattern one day along, C two days, D three.
     The patterns were searched offline so that no teacher is ever booked
     into two rooms at once, whichever class or teacher you look at. */
  const PATTERNS = {
    7: ['EN GE MA AR SC', 'SC AR CS MU HI', 'PE HI EN GE MA', 'CS MA PE FR EN', 'MA SC FR EN PE', 'MU EN SC MA FR'],
    8: ['EN MA PE FR SC', 'SC GE FR PE MA', 'FR EN AR MA CS', 'MU HI EN SC AR', 'MA SC MU GE EN', 'CS PE MA EN HI'],
    9: ['CS HI MA MU EN', 'EN FR PE MA SC', 'MU PE SC FR MA', 'GE MA FR EN PE', 'AR SC EN HI CS', 'MA EN GE SC AR'],
    10: ['AR GE HI FR EN', 'HI MA AR EN SC', 'MU EN MA SC CS', 'MA CS SC GE HI', 'SC PE EN MA FR', 'EN SC FR PE MA'],
    11: ['SC MA FR PE EN', 'EN MU GE SC MA', 'FR AR EN MA HI', 'MA PE SC FR AR', 'HI EN MA CS SC', 'CS SC HI EN GE'],
    12: ['SC EN HI CS MA', 'MA CS SC FR HI', 'PE MA EN SC GE', 'MU HI MA EN SC', 'AR FR GE PE EN', 'EN SC AR MA FR'],
  };
  const PERIODS = [
    { label: 'Period 1', short: 'P1', start: '08:50', end: '09:40', slot: 0 },
    { label: 'Period 2', short: 'P2', start: '09:45', end: '10:35', slot: 1 },
    { label: 'Recess', start: '10:35', end: '10:55', brk: true },
    { label: 'Period 3', short: 'P3', start: '10:55', end: '11:45', slot: 2 },
    { label: 'Period 4', short: 'P4', start: '11:50', end: '12:40', slot: 3 },
    { label: 'Lunch', start: '12:40', end: '13:25', brk: true },
    { label: 'Period 5', short: 'P5', start: '13:25', end: '14:15', slot: 4 },
    { label: 'Period 6', short: 'P6', start: '14:20', end: '15:10', slot: 5 },
  ];
  const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const HOMEROOM_D = { 7: 'T22', 8: 'T19', 9: 'T25', 10: 'T20', 11: 'T23', 12: 'T26' };
  const CLASSES = [];
  [7, 8, 9, 10, 11, 12].forEach((grade) => ['A', 'B', 'C', 'D'].forEach((section, s) => {
    const homeroom = [teacherFor('MA', grade), teacherFor('EN', grade), teacherFor('SC', grade), TEACHER[HOMEROOM_D[grade]]][s];
    CLASSES.push({ code: `${grade}${section}`, grade, section, s, room: `Room ${grade - 6}0${s + 1}`, homeroom });
  }));
  const CLASS = Object.fromEntries(CLASSES.map((c) => [c.code, c]));
  const lessonAt = (cls, day, slot) => {
    const subject = PATTERNS[cls.grade][slot].split(' ')[(day - cls.s + 5) % 5];
    const teacher = teacherFor(subject, cls.grade);
    return { subject, teacher, room: teacher.room || cls.room, cls };
  };

  // School days from the first day of term up to "today".
  const isSchoolDay = (d) => d.getDay() > 0 && d.getDay() < 6 && !HOLIDAYS[iso(d)] && d >= SCHOOL.termStart && d <= SCHOOL.termEnd;
  const SCHOOL_DAYS = [];
  for (let d = new Date(SCHOOL.termStart); d <= TODAY; d = addDays(d, 1)) if (isSchoolDay(d)) SCHOOL_DAYS.push(new Date(d));
  const DAY_INDEX = Object.fromEntries(SCHOOL_DAYS.map((d, i) => [iso(d), i]));
  const TODAY_INDEX = SCHOOL_DAYS.length - 1;
  // Days with more (or fewer) absences than usual: first day, a cold going round, the Friday before the long weekend.
  const DAY_FACTOR = { '2026-09-08': 0.4, '2026-09-29': 1.35, '2026-09-30': 1.6, '2026-10-01': 1.45, '2026-10-02': 1.2, '2026-10-09': 1.8, '2026-10-13': 1.25 };

  const STUDENTS = [];
  (function buildStudents() {
    const used = new Set();
    const arrivals = SCHOOL_DAYS.filter((d) => d > addDays(SCHOOL.termStart, 5) && d < TODAY);
    const guardian = (rel, last, primary) => {
      const female = rel === 'Mother' || rel === 'Grandmother' || rel === 'Aunt' || (rel === 'Guardian' && rand() < 0.5);
      const first = pick(female ? ADULT_F : ADULT_M);
      return {
        name: `${first} ${last}`, rel, primary,
        phone: `(902) 555-01${pad(Math.floor(rand() * 100))}`,
        email: `${first[0]}.${last}@example.com`.toLowerCase().replace(/[^a-z.@]/g, ''),
      };
    };
    CLASSES.forEach((cls) => {
      const size = 25 + Math.floor(rand() * 5);
      for (let k = 0; k < size; k += 1) {
        let first; let last;
        do { first = pick(FIRST); last = pick(LAST); } while (used.has(`${first} ${last}`));
        used.add(`${first} ${last}`);
        const midTerm = rand() < 0.028;
        const base = 2026 - (cls.grade - 7);
        const entry = cls.grade === 7 ? 2026 : (rand() < 0.8 ? base : base + 1 + Math.floor(rand() * (cls.grade - 7)));
        const admitted = midTerm ? pick(arrivals) : new Date(entry, 8, entry === 2026 ? 8 : 3 + Math.floor(rand() * 5));
        let status = 'Active';
        let leave = null;
        if (midTerm) status = rand() < 0.4 ? 'Pending' : 'New';
        else if (rand() < 0.012) {
          status = 'On leave';
          leave = { from: new Date(2026, 9, 5), until: new Date(2026, 9, 30), reason: pick(['Medical leave', 'Family travel, approved by the principal']) };
        }
        const rel = pick(['Mother', 'Father', 'Mother', 'Father', 'Mother', 'Guardian', 'Grandmother']);
        const guardians = [guardian(rel, rand() < 0.86 ? last : pick(LAST), true)];
        if (rand() < 0.66) guardians.push(guardian(rel === 'Father' ? 'Mother' : rel === 'Mother' ? 'Father' : pick(['Aunt', 'Mother', 'Father']), rand() < 0.8 ? last : pick(LAST), false));
        STUDENTS.push({
          first, last, name: `${first} ${last}`, cls: cls.code, grade: cls.grade, section: cls.section,
          house: pick(HOUSES), dob: new Date(2021 - cls.grade, Math.floor(rand() * 12), 1 + Math.floor(rand() * 28)),
          admitted, midTerm, status, leave, guardians,
          pAbs: rand() < 0.12 ? between(0.07, 0.14) : between(0.008, 0.05), pLate: between(0.004, 0.03),
          ability: between(58, 96), medical: rand() < 0.12 ? pick(MEDICAL) : '', bus: rand() < 0.3 ? pick(ROUTES) : '',
          bursary: rand() < 0.07 ? pick([750, 1000, 1500]) : 0,
          prevSchool: cls.grade === 7 || entry > base || midTerm ? pick(PREV_SCHOOLS) : '',
          tone: 1 + Math.floor(rand() * 6),
        });
      }
    });

    // Admission numbers run in the order students joined: HV-26001, HV-26002…
    const seq = {};
    STUDENTS.slice().sort((a, b) => a.admitted - b.admitted || a.last.localeCompare(b.last) || a.first.localeCompare(b.first)).forEach((s) => {
      const yy = String(s.admitted.getFullYear()).slice(2);
      seq[yy] = (seq[yy] || 0) + 1;
      s.id = `HV-${yy}${String(seq[yy]).padStart(3, '0')}`;
    });

    STUDENTS.forEach((s, n) => {
      s.n = n;
      s.marks = SCHOOL_DAYS.map((d, i) => {
        if (d < s.admitted) return '';
        if (s.leave && d >= s.leave.from) return 'E';
        const f = DAY_FACTOR[iso(d)] || 1;
        const u = noise(n, i);
        if (u < s.pAbs * f) return 'A';
        if (u < s.pAbs * f + s.pLate) return 'L';
        return 'P';
      });
      summariseAttendance(s);
      // Recent arrivals have no marks yet; everyone else has this term's work so far.
      s.grades = s.midTerm && s.admitted > new Date(2026, 8, 25) ? [] : SUBJECT_CODES.map((code, j) => {
        const avg = Math.round(clamp(s.ability + (noise(n, 100 + j) - 0.5) * 18, 41, 99));
        return {
          code, avg,
          prev: s.midTerm ? null : Math.round(clamp(avg + (noise(n, 200 + j) - 0.5) * 12, 40, 99)),
          last: Math.round(clamp(avg + (noise(n, 300 + j) - 0.5) * 14, 38, 100)),
          date: weekday(new Date(Math.max(new Date(2026, 9, 1 + Math.floor(noise(n, 400 + j) * 14)), addDays(s.admitted, 9)))),
          teacher: teacherFor(code, s.grade),
        };
      });
    });
  }());

  function summariseAttendance(s) {
    const c = { P: 0, L: 0, A: 0, E: 0 };
    s.marks.forEach((m) => { if (m) c[m] += 1; });
    s.att = c;
    const counted = c.P + c.L + c.A;
    s.rate = counted ? ((c.P + c.L) / counted) * 100 : null;
  }

  const STUDENT = (id) => STUDENTS.find((s) => s.id === id);

  const METHODS = [['Card', 0.45], ['Bank transfer', 0.38], ['Cheque', 0.12], ['Cash', 0.05]];
  const payment = (date, amount, method) => {
    let m = method;
    if (!m) { let u = rand(); m = METHODS.find(([, w]) => (u -= w) < 0)?.[0] || 'Card'; }
    const ref = m === 'Card' ? `Visa ending ${1000 + Math.floor(rand() * 9000)}`
      : m === 'Bank transfer' ? `EFT ${10000 + Math.floor(rand() * 90000)}`
        : m === 'Cheque' ? `Cheque ${1000 + Math.floor(rand() * 9000)}` : `Receipt R-${100 + Math.floor(rand() * 900)}`;
    return { date, amount, method: m, ref };
  };

  const INVOICES = [];
  (function buildInvoices() {
    STUDENTS.forEach((s) => {
      const issued = s.midTerm ? s.admitted : SCHOOL.invoiceDate;
      const due = s.midTerm ? addDays(s.admitted, 14) : SCHOOL.feeDue;
      const fullTuition = s.grade <= 9 ? 4850 : 5350;
      const share = s.midTerm ? (SCHOOL.termEnd - s.admitted) / (SCHOOL.termEnd - SCHOOL.termStart) : 1;
      const lines = [{ desc: `Term 1 tuition, Grade ${s.grade}${s.midTerm ? ' (prorated)' : ''}`, amount: Math.round((fullTuition * share) / 10) * 10 }];
      lines.push(s.grade <= 9 ? { desc: 'Learning materials fee', amount: 120 } : { desc: 'Lab and materials fee', amount: 180 });
      if (s.bus) lines.push({ desc: `Bus pass, ${s.bus}`, amount: 420 });
      const credits = s.bursary ? [{ desc: 'Bursary award', amount: s.bursary }] : [];
      const total = lines.reduce((a, l) => a + l.amount, 0) - credits.reduce((a, l) => a + l.amount, 0);
      const payments = [];
      const u = rand();
      if (s.midTerm) {
        payments.push(payment(s.admitted, rand() < 0.4 ? total : round50(total * between(0.35, 0.6))));
      } else if (u < 0.085) {
        // nothing paid yet: overdue
      } else if (u < 0.22) {
        payments.push(payment(dateBetween(new Date(2026, 7, 18), new Date(2026, 8, 25)), round50(total * between(0.3, 0.7))));
        if (rand() < 0.35) payments.push(payment(dateBetween(new Date(2026, 9, 1), addDays(TODAY, -1)), round50(total * 0.1)));
      } else if (rand() < 0.3) {
        const half = round50(total / 2);
        payments.push(payment(dateBetween(new Date(2026, 7, 17), new Date(2026, 7, 31)), half));
        payments.push(payment(dateBetween(new Date(2026, 8, 8), new Date(2026, 9, 9)), total - half));
      } else {
        payments.push(payment(dateBetween(new Date(2026, 7, 17), new Date(2026, 8, 30)), total));
      }
      INVOICES.push({ student: s, issued, due, lines, credits, total, payments });
    });
    INVOICES.sort((a, b) => a.issued - b.issued || a.student.last.localeCompare(b.student.last) || a.student.first.localeCompare(b.student.first));
    INVOICES.forEach((inv, i) => {
      inv.no = `INV-26-${String(i + 1).padStart(4, '0')}`;
      inv.student.invoice = inv;
      settle(inv);
    });
  }());

  function settle(inv) {
    inv.paid = inv.payments.reduce((a, p) => a + p.amount, 0);
    inv.balance = Math.max(0, inv.total - inv.paid);
    inv.status = inv.balance === 0 ? 'Paid' : inv.paid > 0 ? 'Partial' : 'Overdue';
    inv.overdue = inv.balance > 0 && inv.due < TODAY ? daysBetween(inv.due, TODAY) : 0;
  }

  // Collections for earlier terms (last school year) plus this term's real payments.
  const PAST_COLLECTIONS = [[2025, 10, 214300], [2025, 11, 96800], [2026, 0, 1618400], [2026, 1, 1082500], [2026, 2, 318900], [2026, 3, 1547200], [2026, 4, 1123600], [2026, 5, 402700], [2026, 6, 61500]];
  const monthlyCollections = () => {
    const rows = PAST_COLLECTIONS.map(([y, m, v]) => ({ y, m, value: v }));
    [7, 8, 9].forEach((m) => {
      const value = INVOICES.reduce((a, inv) => a + inv.payments.filter((p) => p.date.getFullYear() === 2026 && p.date.getMonth() === m).reduce((b, p) => b + p.amount, 0), 0);
      rows.push({ y: 2026, m, value, current: m === TODAY.getMonth() });
    });
    return rows;
  };

  /* ------------------------------------------------------------------------
     2. HELPERS
     ------------------------------------------------------------------------ */

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fmtDate = (d, year = true) => `${d.getDate()} ${MONTHS[d.getMonth()]}${year ? ` ${d.getFullYear()}` : ''}`;
  const fmtDay = (d) => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const money = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const moneyShort = (n) => (n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e4 ? `$${Math.round(n / 1e3)}k` : `$${num(Math.round(n))}`);
  const num = (n) => n.toLocaleString('en-US');
  const pct = (n, dp = 1) => (n == null ? '—' : `${n.toFixed(dp)}%`);
  const initials = (name) => name.split(' ').map((p) => p[0]).slice(0, 2).join('');
  const param = (key) => new URLSearchParams(window.location.search).get(key);
  const ageOn = (dob, d) => d.getFullYear() - dob.getFullYear() - (d < new Date(d.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const svg = (paths) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
  const ICON = {
    eye: svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    mail: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
    phone: svg('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.8.7a2 2 0 0 1 1.7 2z"/>'),
    check: svg('<path d="M20 6 9 17l-5-5"/>'),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    alert: svg('<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>'),
    file: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>'),
    up: svg('<path d="M12 19V5M5 12l7-7 7 7"/>'),
    down: svg('<path d="M12 5v14M19 12l-7 7-7-7"/>'),
    flat: svg('<path d="M5 12h14"/>'),
    chevL: svg('<path d="m15 18-6-6 6-6"/>'),
    chevR: svg('<path d="m9 18 6-6-6-6"/>'),
    sort: svg('<path d="m8 9 4-4 4 4M16 15l-4 4-4-4"/>'),
    card: svg('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>'),
    user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    calendar: svg('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
    school: svg('<path d="m2 10 10-6 10 6-10 6z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>'),
    bell: svg('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>'),
    receipt: svg('<path d="M4 2v20l3-2 3 2 2-2 2 2 3-2 3 2V2l-3 2-3-2-2 2-2-2-3 2z"/><path d="M8 8h8M8 12h8M8 16h5"/>'),
  };

  const avatar = (name, tone, size) => `<span class="avatar av-${tone}${size ? ` avatar-${size}` : ''}" aria-hidden="true">${esc(initials(name))}</span>`;
  const STATUS_TONE = { Active: 'success', New: 'info', Pending: 'warning', 'On leave': 'neutral', Paid: 'success', Partial: 'warning', Overdue: 'danger', Verified: 'success', Received: 'info', Missing: 'danger', 'Awaiting signature': 'warning' };
  const badge = (label) => `<span class="status status-${STATUS_TONE[label] || 'neutral'}">${esc(label)}</span>`;
  const meter = (value, tone) => `<span class="meter${tone ? ` meter-${tone}` : ''}" aria-hidden="true"><span style="width:${clamp(value || 0, 0, 100).toFixed(1)}%"></span></span>`;
  const rateTone = (r) => (r == null ? '' : r >= 95 ? 'good' : r >= 90 ? 'ok' : 'low');
  const letter = (v) => (v >= 90 ? 'A+' : v >= 85 ? 'A' : v >= 80 ? 'A−' : v >= 77 ? 'B+' : v >= 73 ? 'B' : v >= 70 ? 'B−' : v >= 67 ? 'C+' : v >= 63 ? 'C' : v >= 60 ? 'C−' : v >= 50 ? 'D' : 'F');
  const fill = (key, html) => { const el = $(`[data-render="${key}"]`); if (el) el.innerHTML = html; return el; };
  const setText = (key, text) => { const el = $(`[data-render="${key}"]`); if (el) el.textContent = text; };
  const mailGuardian = (s, subject) => `mailto:${s.guardians[0].email}?subject=${encodeURIComponent(subject || `${s.name} (${s.cls})`)}`;

  function toast(message, tone = 'success') {
    const region = $('#toastRegion');
    if (!region) return;
    const el = document.createElement('div');
    el.className = `app-toast is-${tone}`;
    el.innerHTML = tone === 'success' ? ICON.check : ICON.alert;
    const text = document.createElement('span');
    text.textContent = message;
    el.appendChild(text);
    region.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-in'));
    setTimeout(() => { el.classList.remove('is-in'); setTimeout(() => el.remove(), 350); }, 4600);
  }

  function downloadCsv(filename, rows) {
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function pager(host, total, page, size, onGo) {
    if (!host) return;
    const pages = Math.max(1, Math.ceil(total / size));
    const from = total ? (page - 1) * size + 1 : 0;
    const to = Math.min(total, page * size);
    const list = [];
    for (let p = 1; p <= pages; p += 1) {
      if (p === 1 || p === pages || Math.abs(p - page) <= 1) list.push(p);
      else if (list[list.length - 1] !== '…') list.push('…');
    }
    host.innerHTML = `<p class="pager-info">Showing <strong>${num(from)}–${num(to)}</strong> of <strong>${num(total)}</strong></p>
      <ul class="pager">
        <li><button type="button" class="pager-btn" data-go="${page - 1}" ${page <= 1 ? 'disabled' : ''} aria-label="Previous page">${ICON.chevL}</button></li>
        ${list.map((p) => (p === '…' ? '<li><span class="pager-gap" aria-hidden="true">…</span></li>'
    : `<li><button type="button" class="pager-btn${p === page ? ' is-current' : ''}" data-go="${p}" aria-label="Page ${p}"${p === page ? ' aria-current="page"' : ''}>${p}</button></li>`)).join('')}
        <li><button type="button" class="pager-btn" data-go="${page + 1}" ${page >= pages ? 'disabled' : ''} aria-label="Next page">${ICON.chevR}</button></li>
      </ul>`;
    if (!host.dataset.bound) {
      host.dataset.bound = '1';
      host.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-go]');
        if (!btn || btn.disabled) return;
        host._onGo(Number(btn.dataset.go));
      });
    }
    host._onGo = onGo;
  }

  function sortHeaders(table, state, onSort) {
    if (!table) return;
    const sync = () => $$('th[data-sort]', table).forEach((th) => {
      th.setAttribute('aria-sort', th.dataset.sort === state.sort ? (state.dir > 0 ? 'ascending' : 'descending') : 'none');
    });
    table.addEventListener('click', (e) => {
      const btn = e.target.closest('th[data-sort] button');
      if (!btn) return;
      const key = btn.closest('th').dataset.sort;
      state.dir = state.sort === key ? -state.dir : (btn.closest('th').dataset.first === 'desc' ? -1 : 1);
      state.sort = key;
      state.page = 1;
      sync();
      onSort();
    });
    sync();
  }

  /* ------------------------------------------------------------------------
     3. LAYOUT
     ------------------------------------------------------------------------ */

  function initTheme() {
    const root = document.documentElement;
    const buttons = $$('[data-theme-toggle]');
    if (!buttons.length) return;
    const sync = () => {
      const dark = root.getAttribute('data-bs-theme') === 'dark';
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(dark)));
    };
    buttons.forEach((b) => b.addEventListener('click', () => {
      const next = root.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-bs-theme', next);
      try { localStorage.setItem('registrar-theme', next); } catch (e) { /* storage unavailable */ }
      sync();
    }));
    sync();
  }

  function initSidebar() {
    const btn = $('#sidebarCollapse');
    const root = document.documentElement;
    if (!btn) return;
    const sync = () => btn.setAttribute('aria-expanded', String(!root.classList.contains('sidebar-collapsed')));
    let anim = 0;
    btn.addEventListener('click', () => {
      // Animate only on a user toggle, never on load or resize.
      root.classList.add('sidebar-anim');
      clearTimeout(anim);
      anim = setTimeout(() => root.classList.remove('sidebar-anim'), 320);
      root.classList.toggle('sidebar-collapsed');
      try { localStorage.setItem('registrar-sidebar', root.classList.contains('sidebar-collapsed') ? 'collapsed' : 'open'); } catch (e) { /* storage unavailable */ }
      sync();
    });
    sync();
    // Close the mobile off-canvas menu when a link inside it is followed.
    const sidebar = $('#sidebar');
    if (sidebar) {
      sidebar.addEventListener('click', (e) => {
        if (!e.target.closest('a') || window.innerWidth >= 992 || !window.bootstrap) return;
        const oc = window.bootstrap.Offcanvas.getInstance(sidebar);
        if (oc) oc.hide();
      });
    }
  }

  function initGlobalSearch() {
    const input = $('#globalSearch');
    if (!input) return;
    const q = param('q');
    if (q && document.body.dataset.page === 'students') input.value = q;
    document.addEventListener('keydown', (e) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      e.preventDefault();
      input.focus();
      input.select();
    });
  }

  function renderNotifications() {
    const today = STUDENTS.filter((s) => s.midTerm).sort((a, b) => b.admitted - a.admitted)[0];
    const late = INVOICES.filter((i) => i.status === 'Overdue').sort((a, b) => b.overdue - a.overdue || b.balance - a.balance)[0];
    const items = [
      { href: 'attendance.html?class=9B', icon: ICON.clock, tone: 'warning', title: '9B morning register has 2 students unmarked', meta: 'Today, 08:47' },
      today && { href: `student.html?id=${today.id}`, icon: ICON.user, tone: 'info', title: `${today.name} joined ${today.cls}${today.status === 'Pending' ? ', documents outstanding' : ''}`, meta: fmtDay(today.admitted) },
      late && { href: 'fees.html?status=overdue', icon: ICON.receipt, tone: 'danger', title: `${late.no} for ${late.student.name} is ${late.overdue} days overdue`, meta: 'Fees reminder' },
      { href: 'index.html#noticesTitle', icon: ICON.calendar, tone: 'primary', title: 'Parent–teacher conference sign-ups close on Monday', meta: 'Notice board' },
    ].filter(Boolean);
    fill('notifications', items.map((n) => `<li><a class="notif is-unread" href="${n.href}"><span class="notif-icon tone-${n.tone}">${n.icon}</span><span class="notif-text"><span class="notif-title">${esc(n.title)}</span><span class="notif-meta">${esc(n.meta)}</span></span></a></li>`).join(''));
  }

  function initNotifications() {
    const btn = $('[data-mark-read]');
    const bell = $('#notifToggle');
    if (!btn || !bell) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      $$('.notif.is-unread').forEach((n) => n.classList.remove('is-unread'));
      const dot = $('.notif-count', bell);
      if (dot) dot.remove();
      bell.setAttribute('aria-label', 'Notifications, all read');
      btn.disabled = true;
      btn.textContent = 'All caught up';
    });
  }

  /* ------------------------------------------------------------------------
     4. CHARTS — plain SVG. Colours come from CSS classes, so light and dark
        mode restyle the same markup. Each chart has a table view twin.
     ------------------------------------------------------------------------ */

  function niceStep(max, count) {
    const raw = max / count;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const n = raw / mag;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
  }

  function lineChart(host, data, o) {
    const W = Math.max(280, Math.round(host.clientWidth || 640));
    const H = Math.max(o.height || 250, Math.round(host.clientHeight || 0));
    const m = { t: 20, r: W < 420 ? 44 : 54, b: 30, l: 40 };
    const iw = W - m.l - m.r;
    const ih = H - m.t - m.b;
    const n = data.length;
    const X = (i) => m.l + (n > 1 ? (i * iw) / (n - 1) : iw / 2);
    const Y = (v) => m.t + ih - ((v - o.min) / (o.max - o.min)) * ih;
    let s = `<svg class="viz" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">`;
    o.ticks.forEach((t) => {
      s += `<line class="viz-grid" x1="${m.l}" x2="${W - m.r}" y1="${Y(t)}" y2="${Y(t)}"/>`;
      s += `<text class="viz-tick" x="${m.l - 8}" y="${Y(t) + 4}" text-anchor="end">${o.tick(t)}</text>`;
    });
    const every = W < 480 ? 7 : 4;
    data.forEach((p, i) => {
      if ((n - 1 - i) % every === 0) s += `<text class="viz-tick" x="${X(i)}" y="${H - 8}" text-anchor="middle">${esc(p.label)}</text>`;
    });
    if (o.target != null) s += `<line class="viz-target" x1="${m.l}" x2="${W - m.r}" y1="${Y(o.target)}" y2="${Y(o.target)}"/>`;
    const pts = data.map((p, i) => [X(i), Y(p.value)]);
    const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');
    s += `<path class="viz-area" d="${d}L${pts[n - 1][0].toFixed(1)},${m.t + ih}L${pts[0][0].toFixed(1)},${m.t + ih}Z"/>`;
    s += `<line class="viz-axis" x1="${m.l}" x2="${W - m.r}" y1="${m.t + ih}" y2="${m.t + ih}"/>`;
    s += `<path class="viz-line" d="${d}"/>`;
    // Label the extreme and the latest value only.
    let lo = 0;
    data.forEach((p, i) => { if (p.value < data[lo].value) lo = i; });
    if (lo !== n - 1) {
      s += `<circle class="viz-dot-soft" cx="${pts[lo][0]}" cy="${pts[lo][1]}" r="4"/>`;
      s += `<text class="viz-note" x="${pts[lo][0]}" y="${Math.min(pts[lo][1] + 20, m.t + ih - 6)}" text-anchor="middle">Low ${o.format(data[lo].value)}</text>`;
    }
    s += `<circle class="viz-dot" cx="${pts[n - 1][0]}" cy="${pts[n - 1][1]}" r="4.5"/>`;
    s += `<text class="viz-value" x="${pts[n - 1][0] + 9}" y="${pts[n - 1][1] + 4}">${o.format(data[n - 1].value)}</text>`;
    s += `<line class="viz-cross" x1="0" x2="0" y1="${m.t}" y2="${m.t + ih}" visibility="hidden"/><circle class="viz-hover" r="5" cx="0" cy="0" visibility="hidden"/></svg>`;
    host.innerHTML = s;
    const svgEl = $('svg', host);
    host._geo = {
      xs: pts.map((p) => p[0]), ys: pts.map((p) => p[1]), width: W,
      mark: (i) => {
        const cross = $('.viz-cross', svgEl);
        const dot = $('.viz-hover', svgEl);
        if (i == null) { cross.setAttribute('visibility', 'hidden'); dot.setAttribute('visibility', 'hidden'); return; }
        cross.setAttribute('x1', pts[i][0]); cross.setAttribute('x2', pts[i][0]); cross.setAttribute('visibility', 'visible');
        dot.setAttribute('cx', pts[i][0]); dot.setAttribute('cy', pts[i][1]); dot.setAttribute('visibility', 'visible');
      },
    };
  }

  function columnChart(host, data, o) {
    const W = Math.max(280, Math.round(host.clientWidth || 640));
    const H = Math.max(o.height || 250, Math.round(host.clientHeight || 0));
    const m = { t: 24, r: 8, b: 30, l: 48 };
    const iw = W - m.l - m.r;
    const ih = H - m.t - m.b;
    const max = Math.max(...data.map((d) => d.value));
    const step = niceStep(max, 4);
    const top = Math.ceil(max / step) * step;
    const Y = (v) => m.t + ih - (v / top) * ih;
    const band = iw / data.length;
    const bw = Math.min(24, band * 0.58);
    let s = `<svg class="viz" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">`;
    for (let t = 0; t <= top + 1; t += step) {
      s += `<line class="viz-grid" x1="${m.l}" x2="${W - m.r}" y1="${Y(t)}" y2="${Y(t)}"/>`;
      s += `<text class="viz-tick" x="${m.l - 8}" y="${Y(t) + 4}" text-anchor="end">${o.tick(t)}</text>`;
    }
    let hi = 0;
    data.forEach((d, i) => { if (d.value > data[hi].value) hi = i; });
    const xs = [];
    const ys = [];
    data.forEach((d, i) => {
      const cx = m.l + band * i + band / 2;
      const x0 = cx - bw / 2;
      const y0 = Y(d.value);
      const yb = Y(0);
      const r = Math.min(4, (yb - y0) / 2, bw / 2);
      xs.push(cx); ys.push(y0);
      s += `<path class="viz-bar${d.current ? ' is-current' : ''}" data-i="${i}" d="M${x0.toFixed(1)},${yb}V${(y0 + r).toFixed(1)}Q${x0.toFixed(1)},${y0.toFixed(1)} ${(x0 + r).toFixed(1)},${y0.toFixed(1)}H${(x0 + bw - r).toFixed(1)}Q${(x0 + bw).toFixed(1)},${y0.toFixed(1)} ${(x0 + bw).toFixed(1)},${(y0 + r).toFixed(1)}V${yb}Z"/>`;
      if (band >= 34 || (data.length - 1 - i) % 2 === 0) s += `<text class="viz-tick${d.current ? ' is-strong' : ''}" x="${cx}" y="${H - 8}" text-anchor="middle">${esc(d.label)}</text>`;
      if (i === hi || d.current) {
        const edge = cx + 24 > W ? ['end', x0 + bw] : ['middle', cx];
        s += `<text class="viz-value" x="${edge[1]}" y="${y0 - 7}" text-anchor="${edge[0]}">${o.format(d.value)}</text>`;
      }
    });
    s += `<line class="viz-axis" x1="${m.l}" x2="${W - m.r}" y1="${Y(0)}" y2="${Y(0)}"/></svg>`;
    host.innerHTML = s;
    const svgEl = $('svg', host);
    host._geo = {
      xs, ys, width: W,
      mark: (i) => $$('.viz-bar', svgEl).forEach((b) => b.classList.toggle('is-hover', Number(b.dataset.i) === i)),
    };
  }

  // One hover/keyboard layer for any chart whose marks sit at known x positions.
  function bindChart(host, describe) {
    const wrap = host.closest('.viz-wrap');
    const tip = wrap && $('.viz-tip', wrap);
    if (!tip || host.dataset.bound) return;
    host.dataset.bound = '1';
    let current = null;
    const show = (i) => {
      const g = host._geo;
      if (!g) return;
      current = clamp(i, 0, g.xs.length - 1);
      g.mark(current);
      const info = describe(current);
      tip.replaceChildren();
      const title = document.createElement('p');
      title.className = 'viz-tip-title';
      title.textContent = info.title;
      tip.appendChild(title);
      info.rows.forEach(([label, value, key]) => {
        const row = document.createElement('p');
        row.className = 'viz-tip-row';
        if (key) { const k = document.createElement('span'); k.className = `viz-key ${key}`; row.appendChild(k); }
        const v = document.createElement('strong'); v.textContent = value;
        const l = document.createElement('span'); l.textContent = label;
        row.append(v, l);
        tip.appendChild(row);
      });
      tip.hidden = false;
      const tw = tip.offsetWidth;
      const th = tip.offsetHeight;
      let left = g.xs[current] + 14;
      if (left + tw > g.width - 4) left = g.xs[current] - tw - 14;
      tip.style.left = `${Math.max(4, left)}px`;
      tip.style.top = `${Math.max(0, g.ys[current] - th - 8)}px`;
    };
    const hide = () => { current = null; if (host._geo) host._geo.mark(null); tip.hidden = true; };
    host.addEventListener('pointermove', (e) => {
      const g = host._geo;
      if (!g) return;
      const x = e.clientX - host.getBoundingClientRect().left;
      let best = 0;
      g.xs.forEach((gx, i) => { if (Math.abs(gx - x) < Math.abs(g.xs[best] - x)) best = i; });
      show(best);
    });
    host.addEventListener('pointerleave', hide);
    host.addEventListener('blur', hide);
    host.addEventListener('focus', () => show(host._geo ? host._geo.xs.length - 1 : 0));
    host.addEventListener('keydown', (e) => {
      const g = host._geo;
      if (!g) return;
      const last = g.xs.length - 1;
      const map = { ArrowLeft: (current ?? last) - 1, ArrowRight: (current ?? 0) + 1, Home: 0, End: last };
      if (!(e.key in map)) { if (e.key === 'Escape') hide(); return; }
      e.preventDefault();
      show(map[e.key]);
    });
  }

  // Redraw on resize; keep the frame while it happens.
  function responsive(host, draw) {
    draw();
    if (!('ResizeObserver' in window)) return;
    let w = host.clientWidth;
    let h = host.clientHeight;
    let raf = 0;
    new ResizeObserver(() => {
      if (!host.clientWidth || (Math.abs(host.clientWidth - w) < 2 && Math.abs(host.clientHeight - h) < 2)) return;
      w = host.clientWidth;
      h = host.clientHeight;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { draw(); h = host.clientHeight; });
    }).observe(host);
  }

  function initViewToggles() {
    $$('[data-view-toggle]').forEach((group) => {
      const panel = group.closest('.panel');
      if (!panel) return;
      group.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-view]');
        if (!btn) return;
        $$('button[data-view]', group).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        panel.classList.toggle('show-table', btn.dataset.view === 'table');
      });
    });
  }

  /* ------------------------------------------------------------------------
     5. PAGES
     ------------------------------------------------------------------------ */

  const dayStats = (idx, list = STUDENTS) => {
    const c = { P: 0, L: 0, A: 0, E: 0 };
    list.forEach((s) => { const mk = s.marks[idx]; if (mk) c[mk] += 1; });
    const counted = c.P + c.L + c.A;
    return { ...c, counted, rate: counted ? ((c.P + c.L) / counted) * 100 : null };
  };

  /* ---- Dashboard ---- */
  function initDashboard() {
    if (document.body.dataset.page !== 'dashboard') return;
    const hour = new Date().getHours();
    setText('greeting', `${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}, ${USER.first}`);

    const today = dayStats(TODAY_INDEX);
    const yesterday = dayStats(TODAY_INDEX - 1);
    const billed = INVOICES.reduce((a, i) => a + i.total, 0);
    const collected = INVOICES.reduce((a, i) => a + i.paid, 0);
    const overdue = INVOICES.filter((i) => i.overdue > 0);
    const overdueAmt = overdue.reduce((a, i) => a + i.balance, 0);
    const joined = STUDENTS.filter((s) => s.midTerm).length;

    setText('kpi-enrolment', num(STUDENTS.length));
    fill('kpi-enrolment-note', `<span class="delta is-up">${ICON.up}+${joined}</span> joined since ${fmtDate(SCHOOL.termStart, false)}`);
    setText('kpi-attendance', pct(today.rate));
    const diff = today.rate - yesterday.rate;
    fill('kpi-attendance-note', `<span class="delta ${diff >= 0 ? 'is-up' : 'is-down'}">${diff >= 0 ? ICON.up : ICON.down}${Math.abs(diff).toFixed(1)} pts</span> vs yesterday · ${num(today.A)} absent, ${num(today.L)} late`);
    setText('kpi-fees', moneyShort(collected));
    setText('kpi-fees-of', `of ${moneyShort(billed)}`);
    fill('kpi-fees-meter', meter((collected / billed) * 100));
    fill('kpi-fees-note', `<strong>${Math.round((collected / billed) * 100)}%</strong> of Term 1 billing · ${moneyShort(overdueAmt)} past due on ${num(overdue.length)} invoices`);

    // Attendance, last 30 days (school days only).
    const from = addDays(TODAY, -29);
    const series = SCHOOL_DAYS.map((d, i) => ({ d, i })).filter(({ d }) => d >= from).map(({ d, i }) => {
      const st = dayStats(i);
      return { label: fmtDate(d, false), date: d, value: st.rate, st };
    });
    const avg = series.reduce((a, p) => a + p.value, 0) / series.length;
    setText('att-sub', `${series.length} school days · average ${pct(avg)}`);
    const attHost = $('[data-render="att-chart"]');
    if (attHost) {
      const low = Math.min(90, Math.floor((Math.min(...series.map((p) => p.value)) - 1) / 2) * 2);
      const ticks = [];
      for (let t = low; t <= 100; t += 2) ticks.push(t);
      responsive(attHost, () => lineChart(attHost, series, {
        min: low, max: 100, ticks, tick: (t) => `${t}%`, format: (v) => pct(v), target: 95,
      }));
      bindChart(attHost, (i) => ({
        title: fmtDay(series[i].date),
        rows: [['attended', pct(series[i].value), 'key-line'], ['absent', num(series[i].st.A)], ['late', num(series[i].st.L)]],
      }));
    }
    fill('att-table', series.slice().reverse().map((p) => `<tr><th scope="row">${esc(fmtDay(p.date))}</th><td class="num">${pct(p.value)}</td><td class="num">${num(p.st.P)}</td><td class="num">${num(p.st.L)}</td><td class="num">${num(p.st.A)}</td></tr>`).join(''));

    // Attendance by grade, today.
    fill('grade-bars', [7, 8, 9, 10, 11, 12].map((g) => {
      const st = dayStats(TODAY_INDEX, STUDENTS.filter((s) => s.grade === g));
      return `<li><span class="bar-label">Grade ${g}</span>${meter(st.rate, rateTone(st.rate))}<span class="bar-value num">${pct(st.rate)}</span></li>`;
    }).join(''));
    fill('today-split', `<li><span class="split-key is-p"></span>Present <strong>${num(today.P)}</strong></li><li><span class="split-key is-l"></span>Late <strong>${num(today.L)}</strong></li><li><span class="split-key is-a"></span>Absent <strong>${num(today.A)}</strong></li><li><span class="split-key is-e"></span>On leave <strong>${num(today.E)}</strong></li>`);

    // Fee collection by month.
    const months = monthlyCollections().map((r) => ({ ...r, label: MONTHS[r.m] }));
    const feeHost = $('[data-render="fee-chart"]');
    if (feeHost) {
      responsive(feeHost, () => columnChart(feeHost, months, {
        tick: (t) => (t === 0 ? '$0' : t >= 1e6 ? `$${(t / 1e6).toFixed(1)}M` : `$${Math.round(t / 1e3)}k`), format: moneyShort,
      }));
      bindChart(feeHost, (i) => ({
        title: `${MONTHS_LONG[months[i].m]} ${months[i].y}${months[i].current ? ' (to date)' : ''}`,
        rows: [['collected', money(months[i].value), months[i].current ? 'key-accent' : 'key-bar']],
      }));
    }
    const termTotal = months.filter((r) => r.y === 2026 && r.m >= 7).reduce((a, r) => a + r.value, 0);
    setText('fee-sub', `Last 12 months · ${moneyShort(termTotal)} received since Term 1 invoices went out`);
    fill('fee-table', months.map((r) => `<tr><th scope="row">${MONTHS_LONG[r.m]} ${r.y}${r.current ? ' (to date)' : ''}</th><td class="num">${money(r.value)}</td></tr>`).join(''));

    // Recent admissions.
    const recent = STUDENTS.filter((s) => s.midTerm).sort((a, b) => b.admitted - a.admitted).slice(0, 6);
    fill('admissions', recent.map((s) => `<tr>
      <td class="cell-main" data-label="Student"><div class="person">${avatar(s.name, s.tone)}<div><a class="person-name" href="student.html?id=${s.id}">${esc(s.name)}</a><span class="person-meta">${s.id}</span></div></div></td>
      <td data-label="Class"><span class="class-tag">${s.cls}</span></td>
      <td data-label="Admitted" class="num">${fmtDate(s.admitted, false)}</td>
      <td data-label="Guardian">${esc(s.guardians[0].name)}<span class="cell-sub">${esc(s.guardians[0].rel)}</span></td>
      <td data-label="Documents">${s.status === 'Pending' ? `<span class="status status-warning">2 missing</span>` : '<span class="status status-success">Complete</span>'}</td>
    </tr>`).join(''));
  }

  /* ---- Students directory ---- */
  function studentRow(s) {
    const inv = s.invoice;
    const g = s.guardians[0];
    const fees = inv ? `${badge(inv.status)}<span class="cell-sub num">${inv.balance ? `${money(inv.balance)} due` : 'No balance'}</span>` : '<span class="cell-sub">Not yet invoiced</span>';
    return `<tr${s.justAdded ? ' class="is-new"' : ''}>
      <td class="cell-main" data-label="Student"><div class="person">${avatar(s.name, s.tone)}<div><a class="person-name" href="student.html?id=${s.id}">${esc(s.last)}, ${esc(s.first)}</a><span class="person-meta">${s.id}</span></div></div></td>
      <td data-label="Class"><span class="class-tag">${s.cls}</span></td>
      <td data-label="House"><span class="house house-${s.house.toLowerCase()}">${s.house}</span></td>
      <td data-label="Guardian" class="cell-guardian">${esc(g.name)}<span class="cell-sub num">${esc(g.phone)}</span></td>
      <td data-label="Attendance" class="cell-att">${s.rate == null ? '<span class="cell-sub">No days yet</span>' : `<span class="att">${meter(s.rate, rateTone(s.rate))}<span class="num">${pct(s.rate)}</span></span>`}</td>
      <td data-label="Fees">${fees}</td>
      <td data-label="Status">${badge(s.status)}</td>
      <td class="cell-actions"><div class="row-actions"><a class="icon-btn icon-btn-sm" href="student.html?id=${s.id}" aria-label="Open profile for ${esc(s.name)}" title="Open profile">${ICON.eye}</a><a class="icon-btn icon-btn-sm" href="${mailGuardian(s)}" aria-label="Email ${esc(s.name)}'s guardian" title="Email guardian">${ICON.mail}</a></div></td>
    </tr>`;
  }

  function initStudents() {
    const tbody = $('[data-render="students-rows"]');
    if (!tbody) return;
    const form = $('#studentFilters');
    const state = { q: param('q') || '', grade: '', section: '', status: '', sort: 'cls', dir: 1, page: 1, size: 15 };
    const cls = param('class');
    if (cls && CLASS[cls]) { state.grade = String(CLASS[cls].grade); state.section = CLASS[cls].section; }
    if (param('sort') === 'admitted') { state.sort = 'admitted'; state.dir = -1; }
    const st = param('status');
    if (st) state.status = ['Active', 'New', 'Pending', 'On leave'].find((x) => x.toLowerCase() === st.toLowerCase()) || '';

    const fields = { q: $('#fSearch'), grade: $('#fGrade'), section: $('#fSection'), status: $('#fStatus'), size: $('#fSize') };
    const syncFields = () => Object.entries(fields).forEach(([k, el]) => { if (el) el.value = state[k]; });
    syncFields();

    const keyFn = {
      name: (s) => `${s.last} ${s.first}`.toLowerCase(),
      cls: (s) => s.grade * 10 + s.section.charCodeAt(0),
      attendance: (s) => (s.rate == null ? 101 : s.rate),
      balance: (s) => (s.invoice ? s.invoice.balance : -1),
      admitted: (s) => s.admitted.getTime(),
    };
    const results = () => {
      const q = state.q.trim().toLowerCase();
      return STUDENTS.filter((s) => (!state.grade || String(s.grade) === state.grade)
        && (!state.section || s.section === state.section)
        && (!state.status || s.status === state.status)
        && (!q || `${s.name} ${s.id} ${s.cls} ${s.guardians.map((g) => g.name).join(' ')}`.toLowerCase().includes(q)))
        .sort((a, b) => {
          const ka = keyFn[state.sort](a);
          const kb = keyFn[state.sort](b);
          return (ka > kb ? 1 : ka < kb ? -1 : 0) * state.dir || a.last.localeCompare(b.last);
        });
    };
    const render = () => {
      const list = results();
      const pages = Math.max(1, Math.ceil(list.length / state.size));
      state.page = clamp(state.page, 1, pages);
      const slice = list.slice((state.page - 1) * state.size, state.page * state.size);
      tbody.innerHTML = slice.length ? slice.map(studentRow).join('')
        : `<tr class="empty-row"><td colspan="8"><div class="empty"><p class="empty-title">No students match these filters</p><p>Try a different name or clear the filters.</p><button type="button" class="btn btn-outline-primary btn-sm" data-reset>Clear filters</button></div></td></tr>`;
      const active = [state.q && `“${state.q}”`, state.grade && `Grade ${state.grade}`, state.section && `Section ${state.section}`, state.status].filter(Boolean);
      setText('students-count', `${num(list.length)} ${list.length === 1 ? 'student' : 'students'}${active.length ? ` · ${active.join(', ')}` : ''}`);
      pager($('[data-render="students-pager"]'), list.length, state.page, state.size, (p) => {
        state.page = p;
        render();
        const dir = $('#directory');
        if (dir) dir.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
      });
      renderStrip();
    };
    // One tile per grade: head count, classes and today's attendance. Tiles filter the table.
    const strip = $('[data-render="grade-strip"]');
    const renderStrip = () => {
      if (!strip) return;
      strip.innerHTML = [7, 8, 9, 10, 11, 12].map((g) => {
        const list = STUDENTS.filter((s) => s.grade === g);
        const st = dayStats(TODAY_INDEX, list);
        const on = state.grade === String(g);
        return `<button type="button" class="grade-tile${on ? ' is-active' : ''}" data-grade="${g}" aria-pressed="${on}"><span class="grade-tile-label">Grade ${g}</span><span class="grade-tile-value">${num(list.length)}</span><span class="grade-tile-meta">${pct(st.rate, 0)} in today</span></button>`;
      }).join('');
    };
    if (strip) strip.addEventListener('click', (e) => {
      const b = e.target.closest('[data-grade]');
      if (!b) return;
      state.grade = state.grade === b.dataset.grade ? '' : b.dataset.grade;
      state.page = 1;
      syncFields();
      render();
    });
    let timer = 0;
    const scope = $('#directory') || form;
    if (scope) {
      scope.addEventListener('input', (e) => {
        const key = Object.keys(fields).find((k) => fields[k] === e.target);
        if (!key) return;
        state[key] = key === 'size' ? Number(e.target.value) : e.target.value;
        state.page = 1;
        clearTimeout(timer);
        timer = setTimeout(render, key === 'q' ? 160 : 0);
      });
    }
    if (form) form.addEventListener('submit', (e) => e.preventDefault());
    const reset = () => { Object.assign(state, { q: '', grade: '', section: '', status: '', page: 1 }); syncFields(); render(); };
    document.addEventListener('click', (e) => { if (e.target.closest('[data-reset]')) reset(); });

    // The topbar search filters in place on this page.
    const top = $('#globalSearchForm');
    if (top) top.addEventListener('submit', (e) => { e.preventDefault(); state.q = $('#globalSearch').value; state.page = 1; syncFields(); render(); });

    sortHeaders($('#studentsTable'), state, render);

    const exp = $('#exportStudents');
    if (exp) exp.addEventListener('click', () => {
      const rows = [['Admission no.', 'First name', 'Last name', 'Class', 'House', 'Status', 'Attendance %', 'Fee balance', 'Guardian', 'Phone', 'Email']];
      results().forEach((s) => rows.push([s.id, s.first, s.last, s.cls, s.house, s.status, s.rate == null ? '' : s.rate.toFixed(1), s.invoice ? s.invoice.balance.toFixed(2) : '', s.guardians[0].name, s.guardians[0].phone, s.guardians[0].email]));
      downloadCsv('harbourview-students.csv', rows);
      toast(`Exported ${num(rows.length - 1)} students to CSV`);
    });

    initAddStudent(state, render, syncFields);
    render();
  }

  function initAddStudent(state, render, syncFields) {
    const form = $('#addStudentForm');
    const panel = $('#addStudent');
    if (!form || !panel) return;
    const done = $('#addStudentDone');
    const grade = $('#asGrade');
    const section = $('#asSection');
    const showForm = () => { form.hidden = false; if (done) done.hidden = true; };
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const dob = $('#asDob');
      if (dob && dob.value) {
        const age = ageOn(fromIso(dob.value), TODAY);
        dob.setCustomValidity(age < 10 || age > 19 ? 'Students at Harbourview are aged 10 to 19. Check the date of birth.' : '');
      }
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        const bad = $(':invalid', form);
        if (bad) bad.focus();
        return;
      }
      const v = (id) => $(`#${id}`).value.trim();
      const code = `${grade.value}${section.value}`;
      const yy = '26';
      const max = STUDENTS.filter((s) => s.id.startsWith(`HV-${yy}`)).reduce((a, s) => Math.max(a, Number(s.id.slice(5))), 0);
      const first = v('asFirst');
      const last = v('asLast');
      const s = {
        first, last, name: `${first} ${last}`, cls: code, grade: Number(grade.value), section: section.value,
        house: v('asHouse'), dob: fromIso(v('asDob')), admitted: fromIso(v('asStart')), midTerm: true, status: 'Pending', leave: null,
        guardians: [{ name: v('asGuardian'), rel: v('asRelation'), primary: true, phone: v('asPhone'), email: v('asEmail') }],
        medical: v('asNotes'), bus: '', bursary: 0, prevSchool: v('asPrev'), tone: 1 + (STUDENTS.length % 6),
        id: `HV-${yy}${String(max + 1).padStart(3, '0')}`, n: STUDENTS.length, marks: SCHOOL_DAYS.map(() => ''), grades: [], justAdded: true,
      };
      summariseAttendance(s);
      STUDENTS.forEach((x) => { x.justAdded = false; });
      STUDENTS.push(s);
      Object.assign(state, { q: '', grade: '', section: '', status: '', sort: 'admitted', dir: -1, page: 1 });
      syncFields();
      $$('#studentsTable th[data-sort]').forEach((th) => th.setAttribute('aria-sort', 'none'));
      render();
      form.reset();
      form.classList.remove('was-validated');
      form.hidden = true;
      if (done) {
        setText('add-done-name', `${s.name} was added to ${code}`);
        setText('add-done-meta', `Admission number ${s.id}. Status is Pending until their documents are in.`);
        done.hidden = false;
        const focus = $('[data-add-another]', done);
        if (focus) focus.focus();
      }
      toast(`${s.name} added to ${code}`);
    });
    $$('[data-add-another]').forEach((b) => b.addEventListener('click', () => { showForm(); $('#asFirst').focus(); }));
    panel.addEventListener('hidden.bs.offcanvas', showForm);
    const start = $('#asStart');
    if (start) start.value = iso(TODAY);
    if (window.location.hash === '#add-student' && window.bootstrap) window.bootstrap.Offcanvas.getOrCreateInstance(panel).show();
  }

  /* ---- Student profile ---- */
  function defaultStudent() {
    return STUDENTS.find((s) => s.cls === '9B' && s.invoice.status === 'Partial' && s.att.A >= 1 && s.att.L >= 1 && s.guardians.length > 1 && !s.midTerm)
      || STUDENTS.find((s) => s.cls === '9B') || STUDENTS[0];
  }

  function initProfile() {
    if (document.body.dataset.page !== 'student') return;
    const s = STUDENT(param('id') || '') || defaultStudent();
    const cls = CLASS[s.cls];
    const inv = s.invoice;
    document.title = `${s.name} · Student profile · Registrar`;
    setText('crumb-name', s.name);

    const avg = s.grades.length ? s.grades.reduce((a, g) => a + g.avg, 0) / s.grades.length : null;
    fill('profile-head', `
      <div class="profile-id">
        ${avatar(s.name, s.tone, 'xl')}
        <div>
          <h1 class="profile-name">${esc(s.name)}</h1>
          <p class="profile-tags"><span class="class-tag">${s.cls}</span><span class="house house-${s.house.toLowerCase()}">${s.house} House</span>${badge(s.status)}<span class="mono">${s.id}</span></p>
          <p class="profile-meta">Homeroom ${esc(cls.homeroom.display)} · ${cls.room} · Admitted ${fmtDate(s.admitted)}</p>
        </div>
      </div>
      <dl class="profile-stats">
        <div><dt>Attendance this term</dt><dd>${pct(s.rate)}</dd></div>
        <div><dt>Average grade</dt><dd>${avg == null ? '—' : `${Math.round(avg)}%`}</dd></div>
        <div><dt>Fee balance</dt><dd>${inv ? money(inv.balance) : '—'}</dd></div>
      </dl>
      <div class="profile-actions">
        <a class="btn btn-primary" href="${mailGuardian(s)}">${ICON.mail}<span>Email guardian</span></a>
        <a class="btn btn-outline-secondary" href="attendance.html?class=${s.cls}">${ICON.clock}<span>Class register</span></a>
        <button type="button" class="btn btn-outline-secondary" data-print>${svg('<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>')}<span>Print</span></button>
      </div>`);

    fill('profile-details', `
      <div><dt>Date of birth</dt><dd>${fmtDate(s.dob)} <span class="text-muted-2">(age ${ageOn(s.dob, TODAY)})</span></dd></div>
      <div><dt>Class</dt><dd>Grade ${s.grade}, section ${s.section}</dd></div>
      <div><dt>House</dt><dd>${s.house}</dd></div>
      <div><dt>Homeroom teacher</dt><dd>${esc(cls.homeroom.display)}</dd></div>
      <div><dt>Admitted</dt><dd>${fmtDate(s.admitted)}</dd></div>
      <div><dt>Previous school</dt><dd>${esc(s.prevSchool || 'Harbourview since Grade 7')}</dd></div>
      <div><dt>Transport</dt><dd>${esc(s.bus || 'Makes own way')}</dd></div>
      <div><dt>Medical notes</dt><dd>${s.medical ? `<span class="note-flag">${ICON.alert}${esc(s.medical)}</span>` : 'None recorded'}</dd></div>
      ${s.leave ? `<div><dt>Leave</dt><dd>${esc(s.leave.reason)}, ${fmtDate(s.leave.from, false)} to ${fmtDate(s.leave.until, false)}</dd></div>` : ''}`);

    fill('profile-guardians', s.guardians.map((g) => `<li class="guardian">
      ${avatar(g.name, ((s.tone + 2) % 6) + 1, 'sm')}
      <div class="guardian-body">
        <p class="guardian-name">${esc(g.name)} ${g.primary ? '<span class="chip">Primary contact</span>' : ''}</p>
        <p class="guardian-rel">${esc(g.rel)} · authorised for pick-up</p>
        <p class="guardian-links"><a href="tel:${g.phone.replace(/[^0-9]/g, '')}">${ICON.phone}<span class="num">${esc(g.phone)}</span></a><a href="mailto:${esc(g.email)}">${ICON.mail}<span>${esc(g.email)}</span></a></p>
      </div></li>`).join(''));

    // Attendance calendar: Sep–Dec, Mon–Fri.
    const cell = (d) => {
      const key = iso(d);
      let state = 'O';
      let text = 'Outside term';
      if (HOLIDAYS[key]) { state = 'H'; text = HOLIDAYS[key]; }
      else if (d < SCHOOL.termStart || d > SCHOOL.termEnd) { state = 'O'; text = 'Outside term'; }
      else if (d > TODAY) { state = 'F'; text = 'Upcoming'; }
      else if (d < s.admitted) { state = 'O'; text = 'Before admission'; }
      else { state = s.marks[DAY_INDEX[key]] || 'O'; text = { P: 'Present', L: 'Late', A: 'Absent', E: 'Approved leave', O: 'No record' }[state]; }
      return `<span class="cal-day is-${state}${key === iso(TODAY) ? ' is-today' : ''}" role="img" aria-label="${fmtDay(d)}: ${text}" data-tip="${fmtDay(d)} · ${text}">${d.getDate()}</span>`;
    };
    const months = [8, 9, 10, 11].map((m) => {
      const first = new Date(2026, m, 1);
      let d = addDays(first, -((first.getDay() + 6) % 7));
      let rows = '';
      while (d.getMonth() <= m || d.getFullYear() < 2026) {
        const week = [0, 1, 2, 3, 4].map((k) => addDays(d, k));
        if (week.some((x) => x.getMonth() === m)) rows += week.map((x) => (x.getMonth() === m ? cell(x) : '<span class="cal-day is-blank" aria-hidden="true"></span>')).join('');
        d = addDays(d, 7);
        if (d.getFullYear() > 2026 || (d.getMonth() > m && d.getFullYear() === 2026)) break;
      }
      return `<div class="cal-month"><p class="cal-title">${MONTHS_LONG[m]}</p><div class="cal-grid"><span class="cal-dow" aria-hidden="true">M</span><span class="cal-dow" aria-hidden="true">T</span><span class="cal-dow" aria-hidden="true">W</span><span class="cal-dow" aria-hidden="true">T</span><span class="cal-dow" aria-hidden="true">F</span>${rows}</div></div>`;
    }).join('');
    const listDays = (mk) => SCHOOL_DAYS.filter((d, i) => s.marks[i] === mk).map((d) => fmtDate(d, false));
    const absences = listDays('A');
    const lates = listDays('L');
    fill('profile-attendance', `
      <ul class="att-summary">
        <li><span class="split-key is-p"></span>Present <strong>${s.att.P}</strong></li>
        <li><span class="split-key is-l"></span>Late <strong>${s.att.L}</strong></li>
        <li><span class="split-key is-a"></span>Absent <strong>${s.att.A}</strong></li>
        ${s.att.E ? `<li><span class="split-key is-e"></span>On leave <strong>${s.att.E}</strong></li>` : ''}
        <li class="att-rate">Term rate <strong>${pct(s.rate)}</strong></li>
      </ul>
      <div class="cal-months">${months}</div>
      <p class="cal-list"><strong>Absent:</strong> ${absences.length ? esc(absences.join(', ')) : 'none this term'} · <strong>Late:</strong> ${lates.length ? esc(lates.join(', ')) : 'none this term'}</p>`);

    fill('profile-grades', s.grades.length ? s.grades.map((g) => {
      const change = g.prev == null ? null : g.avg - g.prev;
      return `<tr>
        <th scope="row" data-label="Subject"><span class="subj-name"><span class="subj-dot subj-${g.code.toLowerCase()}" aria-hidden="true"></span>${SUBJECTS[g.code].name}</span><span class="cell-sub">${esc(g.teacher.display)}</span></th>
        <td data-label="Term average" class="cell-grade"><span class="att">${meter(g.avg, g.avg >= 80 ? 'good' : g.avg >= 65 ? 'ok' : 'low')}<span class="num">${g.avg}%</span></span></td>
        <td data-label="Grade"><span class="grade-letter">${letter(g.avg)}</span></td>
        <td data-label="Change" class="num">${change == null ? '<span class="cell-sub">New</span>' : `<span class="delta ${change > 0 ? 'is-up' : change < 0 ? 'is-down' : 'is-flat'}">${change > 0 ? ICON.up : change < 0 ? ICON.down : ICON.flat}${change > 0 ? '+' : change < 0 ? '−' : ''}${Math.abs(change)}</span>`}</td>
        <td data-label="Latest assessment">${esc(SUBJECTS[g.code].task)}<span class="cell-sub num">${fmtDate(g.date, false)} · ${g.last}%</span></td>
      </tr>`;
    }).join('') : '<tr><td colspan="5"><p class="empty-inline">No marks recorded yet.</p></td></tr>');
    setText('profile-grade-avg', avg == null ? '' : `Average ${Math.round(avg)}% · ${letter(avg)}`);

    if (inv) {
      const entries = [
        ...inv.lines.map((l) => ({ date: inv.issued, desc: l.desc, debit: l.amount })),
        ...inv.credits.map((c) => ({ date: inv.issued, desc: c.desc, credit: c.amount })),
        ...inv.payments.map((p) => ({ date: p.date, desc: `Payment, ${p.method.toLowerCase()} (${p.ref})`, credit: p.amount })),
      ].sort((a, b) => a.date - b.date);
      let bal = 0;
      fill('profile-ledger', entries.map((e) => {
        bal += (e.debit || 0) - (e.credit || 0);
        return `<tr><td class="num" data-label="Date">${fmtDate(e.date, false)}</td><td data-label="Description">${esc(e.desc)}</td><td class="num text-end" data-label="Charge">${e.debit ? money(e.debit) : ''}</td><td class="num text-end" data-label="Credit">${e.credit ? money(e.credit) : ''}</td><td class="num text-end" data-label="Balance">${money(bal)}</td></tr>`;
      }).join(''));
      fill('profile-ledger-foot', `<tr><th scope="row" colspan="4">${inv.balance ? `Balance due${inv.overdue ? ` · ${inv.overdue} days past the ${fmtDate(inv.due, false)} due date` : ` by ${fmtDate(inv.due, false)}`}` : 'Paid in full'}</th><td class="num text-end">${money(inv.balance)}</td></tr>`);
      fill('profile-invoice', `${inv.no} · ${badge(inv.status)}${inv.balance ? ` <a class="link-arrow" href="fees.html?invoice=${inv.no}">Record payment</a>` : ''}`);
    } else {
      fill('profile-ledger', '<tr><td colspan="5"><p class="empty-inline">No invoice issued yet. The Term 1 invoice is created when the admission is confirmed.</p></td></tr>');
      fill('profile-ledger-foot', '');
      fill('profile-invoice', '');
    }

    const docs = [
      ['Birth certificate', 'PDF · 412 KB', s.status === 'Pending' ? 'Received' : 'Verified'],
      ['Immunization record', 'PDF · 238 KB', s.status === 'Pending' ? 'Missing' : 'Verified'],
      ['Proof of address', 'PDF · 180 KB', s.status === 'Pending' ? 'Missing' : 'Verified'],
      ['Previous school report', 'PDF · 1.2 MB', s.prevSchool ? 'Verified' : null],
      ['Photo and media consent', 'Form', noise(s.n, 999) < 0.15 ? 'Awaiting signature' : 'Verified'],
      s.medical ? ['Medical action plan', 'PDF · 96 KB', 'Verified'] : null,
    ].filter((d) => d && d[2]);
    fill('profile-docs', docs.map(([name, meta, status]) => `<li class="doc">
      <span class="doc-icon">${ICON.file}</span>
      <span class="doc-body"><span class="doc-name">${name}</span><span class="doc-meta">${status === 'Missing' ? 'Not received yet' : meta}</span></span>
      ${badge(status)}
      ${status === 'Missing' || status === 'Awaiting signature' ? `<a class="icon-btn icon-btn-sm" href="${mailGuardian(s, `${name} for ${s.name}`)}" aria-label="Request ${name.toLowerCase()} from the guardian" title="Request from guardian">${ICON.mail}</a>` : ''}
    </li>`).join(''));

    bindCalendarTips();
    document.addEventListener('click', (e) => { if (e.target.closest('[data-print]')) window.print(); });
  }

  function bindCalendarTips() {
    const wrap = $('.cal-wrap');
    const tip = wrap && $('.viz-tip', wrap);
    if (!tip) return;
    wrap.addEventListener('pointerover', (e) => {
      const day = e.target.closest('.cal-day[data-tip]');
      if (!day) { tip.hidden = true; return; }
      tip.textContent = day.dataset.tip;
      tip.hidden = false;
      const r = day.getBoundingClientRect();
      const w = wrap.getBoundingClientRect();
      tip.style.left = `${clamp(r.left - w.left + r.width / 2 - tip.offsetWidth / 2, 0, w.width - tip.offsetWidth)}px`;
      tip.style.top = `${r.top - w.top - tip.offsetHeight - 6}px`;
    });
    wrap.addEventListener('pointerleave', () => { tip.hidden = true; });
  }

  /* ---- Attendance register ---- */
  const REASONS = { A: ['Illness', 'Medical appointment', 'Family reason', 'Unexplained'], L: ['Transport delay', 'Medical appointment', 'Overslept', 'Other'] };

  function initAttendance() {
    const list = $('[data-render="roll"]');
    if (!list) return;
    const selClass = $('#rcClass');
    const selDate = $('#rcDate');
    const markAll = $('#rcMarkAll');
    const saveBtns = $$('[data-save]');
    const bar = $('.save-bar');
    let reg = null;

    selClass.innerHTML = [7, 8, 9, 10, 11, 12].map((g) => `<optgroup label="Grade ${g}">${CLASSES.filter((c) => c.grade === g).map((c) => `<option value="${c.code}">${c.code} · ${esc(c.homeroom.display)}</option>`).join('')}</optgroup>`).join('');
    const qc = param('class');
    selClass.value = qc && CLASS[qc] ? qc : '9B';
    selDate.min = iso(SCHOOL.termStart);
    selDate.max = iso(TODAY);
    selDate.value = param('date') || iso(TODAY);

    const storeKey = (c, d) => `registrar-register-${c}-${d}`;
    const load = (code, dateIso) => {
      const date = fromIso(dateIso);
      const cls = CLASS[code];
      const out = { code, dateIso, date, cls, closed: '' };
      if (Number.isNaN(date.getTime())) out.closed = 'Choose a date to open the register.';
      else if (date > TODAY) out.closed = 'Registers open on the day. Pick today or an earlier school day.';
      else if (date < SCHOOL.termStart) out.closed = `Term 1 started on ${fmtDay(SCHOOL.termStart)}. Pick a date from then on.`;
      else if (HOLIDAYS[dateIso]) out.closed = `${HOLIDAYS[dateIso]}: no school, so there is no register.`;
      else if (date.getDay() === 0 || date.getDay() === 6) out.closed = 'That date is a weekend. Pick a school day.';
      if (out.closed) return out;
      const idx = DAY_INDEX[dateIso];
      out.students = STUDENTS.filter((s) => s.cls === code && s.admitted <= date).sort((a, b) => a.last.localeCompare(b.last) || a.first.localeCompare(b.first));
      let saved = null;
      try { saved = JSON.parse(localStorage.getItem(storeKey(code, dateIso)) || 'null'); } catch (e) { saved = null; }
      out.entries = {};
      const isToday = dateIso === iso(TODAY);
      let unmarked = 0;
      out.students.forEach((s, k) => {
        const mk = s.marks[idx] || '';
        let mark = mk === 'E' ? 'E' : mk;
        // Today's register is still being taken: leave two students unmarked.
        if (isToday && mark !== 'E' && (k === 4 || k === 11) && unmarked < 2) { mark = ''; unmarked += 1; }
        const reasons = REASONS[mark];
        out.entries[s.id] = { mark, reason: reasons ? reasons[Math.floor(noise(s.n, idx + 500) * reasons.length)] : '' };
      });
      if (saved && saved.entries) { Object.assign(out.entries, saved.entries); out.saved = true; out.savedAt = saved.savedAt; out.savedBy = saved.savedBy; }
      else if (isToday) out.saved = false;
      else { out.saved = true; out.savedAt = `08:${pad(38 + Math.floor(noise(cls.s + cls.grade, idx) * 9))}`; out.savedBy = cls.homeroom.display; }
      return out;
    };

    const counts = () => {
      const c = { P: 0, L: 0, A: 0, E: 0, '': 0 };
      reg.students.forEach((s) => { c[reg.entries[s.id].mark] += 1; });
      return c;
    };

    const segment = (s, mark) => ['P', 'A', 'L'].map((m) => {
      const label = { P: 'Present', A: 'Absent', L: 'Late' }[m];
      const icon = { P: ICON.check, A: ICON.x, L: ICON.clock }[m];
      return `<input type="radio" class="seg-input" name="att-${s.id}" id="att-${s.id}-${m}" value="${m}"${mark === m ? ' checked' : ''}><label class="seg-opt seg-${m}" for="att-${s.id}-${m}">${icon}<span>${label}</span></label>`;
    }).join('');

    const rowHtml = (s, k) => {
      const e = reg.entries[s.id];
      if (e.mark === 'E') {
        return `<li class="roll-row is-E" data-id="${s.id}"><span class="roll-no num">${k + 1}</span><div class="person">${avatar(s.name, s.tone)}<div><a class="person-name" href="student.html?id=${s.id}">${esc(s.name)}</a><span class="person-meta">${s.id}</span></div></div><p class="roll-leave">${ICON.calendar}<span>On approved leave until ${fmtDate(s.leave.until, false)}</span></p></li>`;
      }
      const reasons = REASONS[e.mark] || REASONS.A;
      return `<li class="roll-row${e.mark ? ` is-${e.mark}` : ' is-unmarked'}" data-id="${s.id}">
        <span class="roll-no num">${k + 1}</span>
        <div class="person">${avatar(s.name, s.tone)}<div><a class="person-name" href="student.html?id=${s.id}">${esc(s.name)}</a><span class="person-meta">${s.id} · ${pct(s.rate)} this term</span></div></div>
        <fieldset class="seg-att"><legend class="visually-hidden">Attendance for ${esc(s.name)}</legend>${segment(s, e.mark)}</fieldset>
        <div class="roll-reason"${e.mark === 'A' || e.mark === 'L' ? '' : ' hidden'}><label class="visually-hidden" for="rsn-${s.id}">Reason for ${esc(s.name)}</label>
          <select class="form-select form-select-sm" id="rsn-${s.id}" data-reason="${s.id}">${reasons.map((r) => `<option${r === e.reason ? ' selected' : ''}>${r}</option>`).join('')}</select></div>
      </li>`;
    };

    const renderSummary = () => {
      const c = counts();
      const total = reg.students.length;
      const counted = c.P + c.L + c.A;
      const seg = (k, n) => (n ? `<span class="split-seg is-${k.toLowerCase()}" style="flex-grow:${n}"></span>` : '');
      fill('roll-summary', `
        <ul class="roll-counts">
          <li class="is-p"><span class="rc-label">Present</span><strong class="rc-value">${c.P}</strong></li>
          <li class="is-l"><span class="rc-label">Late</span><strong class="rc-value">${c.L}</strong></li>
          <li class="is-a"><span class="rc-label">Absent</span><strong class="rc-value">${c.A}</strong></li>
          <li class="is-u"><span class="rc-label">Unmarked</span><strong class="rc-value">${c['']}</strong></li>
        </ul>
        <div class="split-bar" aria-hidden="true">${seg('P', c.P)}${seg('L', c.L)}${seg('A', c.A)}${seg('E', c.E)}${seg('U', c[''])}</div>
        <p class="roll-rate">${counted ? `<strong>${pct(((c.P + c.L) / counted) * 100)}</strong> in school` : 'No marks yet'} · ${total} on roll${c.E ? `, ${c.E} on leave` : ''}</p>`);
      const status = $('[data-render="roll-status"]');
      if (status) {
        status.className = `roll-status ${reg.saved ? 'is-saved' : c[''] ? 'is-warn' : 'is-dirty'}`;
        status.innerHTML = reg.saved
          ? `${ICON.check}<span>Register saved at ${esc(reg.savedAt)} by ${esc(reg.savedBy)}</span>`
          : c[''] ? `${ICON.alert}<span>${c['']} ${c[''] === 1 ? 'student is' : 'students are'} unmarked · not saved</span>` : `${ICON.clock}<span>All marked · changes not saved yet</span>`;
      }
      saveBtns.forEach((b) => { b.disabled = !!reg.saved; b.textContent = reg.saved ? 'Saved' : 'Save register'; });
      setText('roll-foot', `${total} students on the ${reg.code} roll · ${c['']} unmarked`);
      if (bar) bar.classList.toggle('is-dirty', !reg.saved);
    };

    const renderSide = () => {
      const cls = reg.cls;
      fill('roll-class', `
        <div><dt>Homeroom teacher</dt><dd>${esc(cls.homeroom.title)} ${esc(cls.homeroom.name)}</dd></div>
        <div><dt>Room</dt><dd>${cls.room}</dd></div>
        <div><dt>On roll</dt><dd>${STUDENTS.filter((s) => s.cls === cls.code).length} students</dd></div>
        <div><dt>Registration</dt><dd>08:30–08:45 daily</dd></div>`);
      // The week around the chosen date.
      const monday = addDays(reg.date, -((reg.date.getDay() + 6) % 7));
      const roster = STUDENTS.filter((s) => s.cls === cls.code);
      fill('roll-week', [0, 1, 2, 3, 4].map((k) => {
        const d = addDays(monday, k);
        const idx = DAY_INDEX[iso(d)];
        let rate = null;
        if (iso(d) === reg.dateIso) {
          const c = counts();
          rate = c.P + c.L + c.A ? ((c.P + c.L) / (c.P + c.L + c.A)) * 100 : null;
        } else if (idx != null) rate = dayStats(idx, roster).rate;
        const label = HOLIDAYS[iso(d)] ? 'Holiday' : d > TODAY ? 'Upcoming' : rate == null ? '—' : pct(rate, 0);
        return `<li class="${iso(d) === reg.dateIso ? 'is-current' : ''}"><span class="wk-bar"><span style="height:${rate == null ? 0 : clamp((rate - 70) / 30, 0.04, 1) * 100}%"></span></span><span class="wk-value num">${label}</span><span class="wk-day">${DAYS[d.getDay()]} ${d.getDate()}</span></li>`;
      }).join(''));
      // Students with 2+ absences in the last 10 school days.
      const end = DAY_INDEX[reg.dateIso];
      const watch = roster.map((s) => ({ s, n: s.marks.slice(Math.max(0, end - 9), end + 1).filter((m) => m === 'A').length })).filter((x) => x.n >= 2).sort((a, b) => b.n - a.n);
      fill('roll-followups', watch.length ? watch.map(({ s, n }) => `<li class="follow">${avatar(s.name, s.tone, 'sm')}<span class="follow-body"><a href="student.html?id=${s.id}">${esc(s.name)}</a><span class="cell-sub">${n} absences · ${pct(s.rate)} this term</span></span><a class="icon-btn icon-btn-sm" href="${mailGuardian(s, `Attendance: ${s.name}`)}" aria-label="Email ${esc(s.name)}'s guardian" title="Email guardian">${ICON.mail}</a></li>`).join('')
        : '<li class="follow-empty">No one in this class has missed two or more days recently.</li>');
    };

    const render = () => {
      reg = load(selClass.value, selDate.value);
      setText('roll-title', reg.closed ? `Register for ${reg.code}` : `Register for ${reg.code} · ${fmtDay(reg.date)}`);
      const closedBox = $('[data-render="roll-closed"]');
      if (reg.closed) {
        list.innerHTML = '';
        if (closedBox) { closedBox.hidden = false; closedBox.textContent = reg.closed; }
        fill('roll-summary', '');
        const status = $('[data-render="roll-status"]');
        if (status) { status.className = 'roll-status'; status.textContent = 'No register for this date'; }
        saveBtns.forEach((b) => { b.disabled = true; });
        setText('roll-foot', '');
        if (markAll) markAll.disabled = true;
        return;
      }
      if (closedBox) closedBox.hidden = true;
      if (markAll) markAll.disabled = false;
      list.innerHTML = reg.students.map(rowHtml).join('');
      renderSummary();
      renderSide();
    };

    const dirty = () => { reg.saved = false; renderSummary(); renderSide(); };

    list.addEventListener('change', (e) => {
      const t = e.target;
      if (t.matches('.seg-input')) {
        const row = t.closest('.roll-row');
        const id = row.dataset.id;
        reg.entries[id].mark = t.value;
        row.className = `roll-row is-${t.value}`;
        const reason = $('.roll-reason', row);
        const select = $('select', reason);
        const options = REASONS[t.value];
        if (options) {
          select.innerHTML = options.map((r) => `<option>${r}</option>`).join('');
          reg.entries[id].reason = options[0];
          reason.hidden = false;
        } else { reason.hidden = true; reg.entries[id].reason = ''; }
        dirty();
      } else if (t.matches('[data-reason]')) {
        reg.entries[t.dataset.reason].reason = t.value;
        dirty();
      }
    });

    if (markAll) markAll.addEventListener('click', () => {
      if (!reg || reg.closed) return;
      reg.students.forEach((s) => { if (reg.entries[s.id].mark !== 'E') reg.entries[s.id] = { mark: 'P', reason: '' }; });
      list.innerHTML = reg.students.map(rowHtml).join('');
      dirty();
      toast(`Everyone in ${reg.code} marked present`);
    });

    saveBtns.forEach((saveBtn) => saveBtn.addEventListener('click', () => {
      if (!reg || reg.closed) return;
      const c = counts();
      if (c['']) {
        const first = $('.roll-row.is-unmarked .seg-input', list);
        toast(`Mark ${c['']} more ${c[''] === 1 ? 'student' : 'students'} before saving`, 'warning');
        if (first) { first.closest('.roll-row').scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' }); first.focus(); }
        return;
      }
      const now = new Date();
      reg.saved = true;
      reg.savedAt = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      reg.savedBy = USER.name;
      try { localStorage.setItem(storeKey(reg.code, reg.dateIso), JSON.stringify({ entries: reg.entries, savedAt: reg.savedAt, savedBy: reg.savedBy })); } catch (e) { /* storage unavailable */ }
      renderSummary();
      toast(`${reg.code} register saved in this browser`);
    }));

    selClass.addEventListener('change', render);
    selDate.addEventListener('change', render);
    const rollForm = $('#rollForm');
    if (rollForm) rollForm.addEventListener('submit', (e) => e.preventDefault());
    render();
  }

  /* ---- Fees & invoices ---- */
  function initFees() {
    const tbody = $('[data-render="invoice-rows"]');
    if (!tbody) return;
    const state = { status: '', q: param('q') || '', sort: 'no', dir: -1, page: 1, size: 12 };
    const qs = param('status');
    if (qs) state.status = ['Paid', 'Partial', 'Overdue'].find((x) => x.toLowerCase() === qs.toLowerCase()) || '';
    const search = $('#invSearch');
    if (search) search.value = state.q;

    const keyFn = {
      no: (i) => i.no, student: (i) => `${i.student.last} ${i.student.first}`.toLowerCase(), total: (i) => i.total,
      balance: (i) => i.balance, due: (i) => i.due.getTime() * 10 - (i.overdue ? 1 : 0),
    };
    const results = () => {
      const q = state.q.trim().toLowerCase();
      return INVOICES.filter((i) => (!state.status || i.status === state.status) && (!q || `${i.no} ${i.student.name} ${i.student.id} ${i.student.cls}`.toLowerCase().includes(q)))
        .sort((a, b) => {
          const ka = keyFn[state.sort](a);
          const kb = keyFn[state.sort](b);
          return (ka > kb ? 1 : ka < kb ? -1 : 0) * state.dir || b.balance - a.balance || a.no.localeCompare(b.no);
        });
    };

    const renderSummary = () => {
      const billed = INVOICES.reduce((a, i) => a + i.total, 0);
      const collected = INVOICES.reduce((a, i) => a + i.paid, 0);
      const outstanding = billed - collected;
      const overdue = INVOICES.filter((i) => i.status === 'Overdue');
      const partial = INVOICES.filter((i) => i.status === 'Partial');
      const paid = INVOICES.filter((i) => i.status === 'Paid');
      setText('fee-billed', moneyShort(billed));
      setText('fee-billed-note', `${num(INVOICES.length)} Term 1 invoices`);
      setText('fee-collected', moneyShort(collected));
      fill('fee-collected-note', `${meter((collected / billed) * 100)}<span>${Math.round((collected / billed) * 100)}% of billed</span>`);
      setText('fee-outstanding', moneyShort(outstanding));
      setText('fee-outstanding-note', `${num(partial.length)} part-paid, ${num(overdue.length)} unpaid`);
      setText('fee-overdue', moneyShort(overdue.reduce((a, i) => a + i.balance, 0)));
      setText('fee-overdue-note', `${num(overdue.length)} invoices with nothing paid`);
      const seg = (cls, n) => `<span class="split-seg ${cls}" style="flex-grow:${n}"></span>`;
      fill('fee-split', `<div class="split-bar split-bar-lg" aria-hidden="true">${seg('is-p', paid.length)}${seg('is-l', partial.length)}${seg('is-a', overdue.length)}</div>
        <ul class="split-legend"><li><span class="split-key is-p"></span>Paid <strong>${num(paid.length)}</strong></li><li><span class="split-key is-l"></span>Partial <strong>${num(partial.length)}</strong></li><li><span class="split-key is-a"></span>Overdue <strong>${num(overdue.length)}</strong></li></ul>`);
      $$('[data-count]').forEach((el) => {
        const k = el.dataset.count;
        el.textContent = num(k ? INVOICES.filter((i) => i.status === k).length : INVOICES.length);
      });
      // Methods this term.
      const methods = {};
      let total = 0;
      INVOICES.forEach((i) => i.payments.forEach((p) => { methods[p.method] = (methods[p.method] || 0) + p.amount; total += p.amount; }));
      fill('fee-methods', METHODS.map(([m]) => `<li><span class="bar-label">${m}</span>${meter(((methods[m] || 0) / total) * 100)}<span class="bar-value num">${Math.round(((methods[m] || 0) / total) * 100)}%</span></li>`).join(''));
      // Overdue watch list.
      const watch = INVOICES.filter((i) => i.overdue > 0).sort((a, b) => b.overdue - a.overdue || b.balance - a.balance).slice(0, 6);
      fill('fee-overdue-list', watch.map((i) => `<li class="follow">
        ${avatar(i.student.name, i.student.tone, 'sm')}
        <span class="follow-body"><a href="student.html?id=${i.student.id}">${esc(i.student.name)}</a><span class="cell-sub"><strong class="follow-amt num">${money(i.balance)}</strong> · ${i.student.cls} · ${i.overdue} days</span></span>
        <span class="follow-actions"><a class="icon-btn icon-btn-sm" href="${mailGuardian(i.student, `Fee reminder: ${i.no}`)}" aria-label="Email a reminder about ${i.no}" title="Email reminder">${ICON.mail}</a><button type="button" class="icon-btn icon-btn-sm" data-pay="${i.no}" aria-label="Record payment for ${i.no}" title="Record payment">${ICON.card}</button></span>
      </li>`).join(''));
    };

    const row = (i) => `<tr${i.justPaid ? ' class="is-new"' : ''}>
      <td data-label="Invoice" class="num"><span class="mono nowrap">${i.no}</span></td>
      <td class="cell-main" data-label="Student"><div class="person">${avatar(i.student.name, i.student.tone)}<div><a class="person-name" href="student.html?id=${i.student.id}">${esc(i.student.name)}</a><span class="person-meta">${i.student.cls} · ${i.student.id}</span></div></div></td>
      <td data-label="Due" class="num">${fmtDate(i.due, false)}${i.overdue ? `<span class="cell-sub is-danger">${i.overdue} days late</span>` : ''}</td>
      <td data-label="Balance" class="num text-end"><span class="amt">${i.balance ? money(i.balance) : money(0)}</span><span class="cell-sub">of ${money(i.total)}</span></td>
      <td data-label="Status">${badge(i.status)}</td>
      <td class="cell-actions">${i.balance ? `<button type="button" class="btn btn-sm btn-outline-primary" data-pay="${i.no}" aria-label="Record payment for ${i.no}">${ICON.card}<span>Pay</span></button>` : `<span class="paid-note">${ICON.check}Paid ${fmtDate(i.payments[i.payments.length - 1].date, false)}</span>`}</td>
    </tr>`;

    const render = () => {
      const list = results();
      const pages = Math.max(1, Math.ceil(list.length / state.size));
      state.page = clamp(state.page, 1, pages);
      const slice = list.slice((state.page - 1) * state.size, state.page * state.size);
      tbody.innerHTML = slice.length ? slice.map(row).join('')
        : '<tr class="empty-row"><td colspan="6"><div class="empty"><p class="empty-title">No invoices found</p><p>Try another name, class or invoice number.</p></div></td></tr>';
      $$('[data-status-filter] button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.status === state.status)));
      pager($('[data-render="invoice-pager"]'), list.length, state.page, state.size, (p) => { state.page = p; render(); });
    };

    const filters = $('[data-status-filter]');
    if (filters) filters.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-status]');
      if (!b) return;
      state.status = b.dataset.status;
      state.page = 1;
      render();
    });
    let timer = 0;
    if (search) search.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => { state.q = search.value; state.page = 1; render(); }, 160); });
    const invForm = $('#invoiceSearch');
    if (invForm) invForm.addEventListener('submit', (e) => e.preventDefault());
    sortHeaders($('#invoiceTable'), state, render);

    const exp = $('#exportInvoices');
    if (exp) exp.addEventListener('click', () => {
      const rows = [['Invoice', 'Student', 'Admission no.', 'Class', 'Issued', 'Due', 'Amount', 'Paid', 'Balance', 'Status']];
      results().forEach((i) => rows.push([i.no, i.student.name, i.student.id, i.student.cls, iso(i.issued), iso(i.due), i.total.toFixed(2), i.paid.toFixed(2), i.balance.toFixed(2), i.status]));
      downloadCsv('harbourview-invoices.csv', rows);
      toast(`Exported ${num(rows.length - 1)} invoices to CSV`);
    });

    initPaymentModal(() => { renderSummary(); render(); });
    renderSummary();
    render();
  }

  function initPaymentModal(onPaid) {
    const modalEl = $('#paymentModal');
    const form = $('#paymentForm');
    if (!modalEl || !form) return;
    const select = $('#payInvoice');
    const amount = $('#payAmount');
    const date = $('#payDate');
    const info = $('[data-render="pay-info"]');
    const done = $('#paymentDone');
    const byNo = (no) => INVOICES.find((i) => i.no === no);

    const fillOptions = (selected) => {
      const open = INVOICES.filter((i) => i.balance > 0).sort((a, b) => a.student.last.localeCompare(b.student.last));
      select.innerHTML = `<option value="">Choose an invoice…</option>${open.map((i) => `<option value="${i.no}"${i.no === selected ? ' selected' : ''}>${i.student.last}, ${i.student.first} (${i.student.cls}) · ${i.no} · ${money(i.balance)} due</option>`).join('')}`;
    };
    const syncInfo = () => {
      const inv = byNo(select.value);
      amount.max = inv ? inv.balance : '';
      if (inv && !amount.value) amount.value = inv.balance.toFixed(2);
      if (info) info.innerHTML = inv ? `<span>Invoice total <strong class="num">${money(inv.total)}</strong></span><span>Paid so far <strong class="num">${money(inv.paid)}</strong></span><span>Balance <strong class="num">${money(inv.balance)}</strong></span>` : '<span>Pick an invoice to see its balance.</span>';
    };
    const open = (no) => {
      form.hidden = false;
      if (done) done.hidden = true;
      form.reset();
      form.classList.remove('was-validated');
      fillOptions(no);
      date.value = iso(TODAY);
      date.max = iso(TODAY);
      syncInfo();
      if (window.bootstrap) window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
    };
    select.addEventListener('change', () => { amount.value = ''; syncInfo(); });
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pay]');
      if (!b) return;
      open(b.dataset.pay);
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const inv = byNo(select.value);
      const value = Number(amount.value);
      amount.setCustomValidity(inv && (value <= 0 || value > inv.balance + 0.001) ? `Enter an amount between $0.01 and ${money(inv.balance)}.` : '');
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        const bad = $(':invalid', form);
        if (bad) bad.focus();
        return;
      }
      const method = $('#payMethod').value;
      const ref = $('#payRef').value.trim() || `${method} payment`;
      inv.payments.push({ date: fromIso(date.value), amount: Math.round(value * 100) / 100, method, ref });
      settle(inv);
      INVOICES.forEach((i) => { i.justPaid = false; });
      inv.justPaid = true;
      onPaid();
      form.hidden = true;
      if (done) {
        setText('pay-done-title', `${money(value)} recorded against ${inv.no}`);
        setText('pay-done-meta', inv.balance ? `${inv.student.name} now owes ${money(inv.balance)}. The invoice is marked Partial.` : `${inv.student.name}'s Term 1 invoice is now paid in full.`);
        done.hidden = false;
      }
      toast(`Payment of ${money(value)} recorded for ${inv.student.name}`);
    });
    const invParam = param('invoice');
    if (invParam && byNo(invParam)) open(invParam);
    else if (window.location.hash === '#record-payment') open('');
    $$('[data-pay-new]').forEach((b) => b.addEventListener('click', () => open('')));
  }

  /* ---- Timetable ---- */
  function initTimetable() {
    const grid = $('[data-render="tt-grid"]');
    if (!grid) return;
    const selClass = $('#ttClass');
    const selTeacher = $('#ttTeacher');
    const wrapClass = $('#ttClassWrap');
    const wrapTeacher = $('#ttTeacherWrap');
    const frame = $('.tt-frame');
    const state = { view: 'class', cls: '9B', teacher: 'T09', day: Math.min(4, Math.max(0, TODAY.getDay() - 1)) };
    const qc = param('class');
    const qt = param('teacher');
    if (qc && CLASS[qc]) state.cls = qc;
    if (qt && TEACHER[qt]) { state.teacher = qt; state.view = 'teacher'; }

    selClass.innerHTML = [7, 8, 9, 10, 11, 12].map((g) => `<optgroup label="Grade ${g}">${CLASSES.filter((c) => c.grade === g).map((c) => `<option value="${c.code}">${c.code} · ${c.room}</option>`).join('')}</optgroup>`).join('');
    selTeacher.innerHTML = SUBJECT_CODES.map((code) => `<optgroup label="${SUBJECTS[code].name}">${TEACHERS.filter((t) => t.subject === code).map((t) => `<option value="${t.id}">${esc(t.display)} (${esc(t.first)})</option>`).join('')}</optgroup>`).join('');

    const teacherLessons = (t) => {
      const map = {};
      CLASSES.filter((c) => t.grades.includes(c.grade)).forEach((c) => {
        for (let d = 0; d < 5; d += 1) for (let p = 0; p < 6; p += 1) {
          const l = lessonAt(c, d, p);
          if (l.teacher.id === t.id) map[`${d}-${p}`] = l;
        }
      });
      return map;
    };

    const render = () => {
      const isClass = state.view === 'class';
      wrapClass.hidden = !isClass;
      wrapTeacher.hidden = isClass;
      selClass.value = state.cls;
      selTeacher.value = state.teacher;
      $$('input[name="ttView"]').forEach((r) => { r.checked = r.value === state.view; });
      const cls = CLASS[state.cls];
      const t = TEACHER[state.teacher];
      const tMap = isClass ? null : teacherLessons(t);
      const homeroomOf = isClass ? null : CLASSES.find((c) => c.homeroom.id === t.id);
      const todayCol = TODAY.getDay() - 1;
      const used = {};
      const cellFor = (d, p) => {
        const l = isClass ? lessonAt(cls, d, p) : tMap[`${d}-${p}`];
        if (!l) return `<td class="tt-cell d-${d}${d === todayCol ? ' is-today' : ''}"><span class="tt-free">Free period</span></td>`;
        used[l.subject] = (used[l.subject] || 0) + 1;
        return `<td class="tt-cell d-${d}${d === todayCol ? ' is-today' : ''}"><div class="tt-lesson subj-${l.subject.toLowerCase()}"><span class="tt-subject">${SUBJECTS[l.subject].name}</span><span class="tt-who">${isClass ? esc(l.teacher.display) : `Class ${l.cls.code}`}</span><span class="tt-room">${esc(l.room)}</span></div></td>`;
      };
      const head = `<thead><tr><th scope="col" class="tt-corner"><span class="visually-hidden">Period</span></th>${WEEKDAYS.map((w, d) => `<th scope="col" class="d-${d}${d === todayCol ? ' is-today' : ''}">${w}${d === todayCol ? '<span class="tt-today">Today</span>' : ''}</th>`).join('')}</tr></thead>`;
      const homeroomRow = `<tr class="tt-break tt-homeroom"><th scope="row"><span class="tt-period">Homeroom</span><span class="tt-time num">08:30–08:45</span></th><td colspan="5">${isClass ? `Registration with ${esc(cls.homeroom.display)} in ${cls.room}` : homeroomOf ? `Homeroom ${homeroomOf.code} in ${homeroomOf.room}` : 'No homeroom class'}</td></tr>`;
      const body = PERIODS.map((p) => (p.brk
        ? `<tr class="tt-break"><th scope="row"><span class="tt-period">${p.label}</span><span class="tt-time num">${p.start}–${p.end}</span></th><td colspan="5">${p.label}</td></tr>`
        : `<tr><th scope="row"><span class="tt-period">${p.label}</span><span class="tt-time num">${p.start}–${p.end}</span></th>${[0, 1, 2, 3, 4].map((d) => cellFor(d, p.slot)).join('')}</tr>`)).join('');
      grid.innerHTML = `<caption class="visually-hidden">${isClass ? `Weekly timetable for class ${cls.code}` : `Weekly timetable for ${esc(t.display)}`}</caption>${head}<tbody>${homeroomRow}${body}</tbody>`;
      frame.dataset.day = String(state.day);
      $$('.tt-day-btn').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.day) === state.day)));

      setText('tt-title', isClass ? `Class ${cls.code}` : `${t.title} ${t.name}`);
      setText('tt-sub', isClass ? `Grade ${cls.grade} · homeroom ${cls.homeroom.display} · ${cls.room} · ${STUDENTS.filter((s) => s.cls === cls.code).length} students`
        : `${SUBJECTS[t.subject].name} · Grades ${t.grades.join(', ')}${t.room ? ` · ${t.room}` : ''}`);
      const order = SUBJECT_CODES.filter((c) => used[c]);
      fill('tt-legend', order.map((c) => `<li><span class="subj-dot subj-${c.toLowerCase()}" aria-hidden="true"></span>${SUBJECTS[c].name}</li>`).join(''));
      const totalTaught = Object.values(used).reduce((a, n) => a + n, 0);
      if (isClass) {
        setText('tt-load-title', 'Periods per week');
        fill('tt-load', order.map((c) => `<li><span class="bar-label"><span class="subj-dot subj-${c.toLowerCase()}" aria-hidden="true"></span>${SUBJECTS[c].name}</span><span class="meter meter-subj subj-${c.toLowerCase()}" aria-hidden="true"><span style="width:${(used[c] / 5) * 100}%"></span></span><span class="bar-value num">${used[c]}</span></li>`).join(''));
        setText('tt-team-title', `Teaching team for ${cls.code}`);
        fill('tt-team', SUBJECT_CODES.map((c) => {
          const tt = teacherFor(c, cls.grade);
          return `<li><span class="subj-dot subj-${c.toLowerCase()}" aria-hidden="true"></span><span class="team-subject">${SUBJECTS[c].name}</span><button type="button" class="link-btn" data-teacher="${tt.id}">${esc(tt.display)}</button></li>`;
        }).join(''));
      } else {
        const byClass = {};
        Object.values(tMap).forEach((l) => { byClass[l.cls.code] = (byClass[l.cls.code] || 0) + 1; });
        setText('tt-load-title', `${totalTaught} teaching periods · ${30 - totalTaught} free`);
        fill('tt-load', Object.keys(byClass).map((c) => `<li><span class="bar-label">Class ${c}</span>${meter((byClass[c] / 6) * 100)}<span class="bar-value num">${byClass[c]}</span></li>`).join(''));
        setText('tt-team-title', 'Classes taught');
        fill('tt-team', Object.keys(byClass).map((c) => `<li><span class="class-tag">${c}</span><span class="team-subject">${CLASS[c].room} · ${STUDENTS.filter((s) => s.cls === c).length} students</span><button type="button" class="link-btn" data-class="${c}">View class</button></li>`).join(''));
      }
    };

    $$('input[name="ttView"]').forEach((r) => r.addEventListener('change', () => { state.view = r.value; render(); }));
    selClass.addEventListener('change', () => { state.cls = selClass.value; render(); });
    selTeacher.addEventListener('change', () => { state.teacher = selTeacher.value; render(); });
    document.addEventListener('click', (e) => {
      const tb = e.target.closest('[data-teacher]');
      const cb = e.target.closest('[data-class]');
      const db = e.target.closest('.tt-day-btn');
      if (tb) { state.view = 'teacher'; state.teacher = tb.dataset.teacher; render(); $('#ttControls').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' }); }
      if (cb) { state.view = 'class'; state.cls = cb.dataset.class; render(); $('#ttControls').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' }); }
      if (db) { state.day = Number(db.dataset.day); frame.dataset.day = String(state.day); $$('.tt-day-btn').forEach((b) => b.setAttribute('aria-pressed', String(b === db))); }
      if (e.target.closest('[data-print]')) window.print();
    });
    render();
  }

  /* ---- Sign in ---- */
  function initLogin() {
    const form = $('#loginForm');
    if (!form) return;
    const pw = $('#loginPassword');
    const toggle = $('#pwToggle');
    if (toggle && pw) toggle.addEventListener('click', () => {
      const show = pw.type === 'password';
      pw.type = show ? 'text' : 'password';
      toggle.setAttribute('aria-pressed', String(show));
      toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        const bad = $(':invalid', form);
        if (bad) bad.focus();
        return;
      }
      const done = $('#loginDone');
      form.hidden = true;
      if (done) {
        setText('login-done-email', $('#loginEmail').value.trim());
        done.hidden = false;
        const go = $('a', done);
        if (go) go.focus();
      }
    });
  }

  /* ---- Boot ---- */
  const init = () => {
    initTheme();
    initSidebar();
    initGlobalSearch();
    renderNotifications();
    initNotifications();
    initViewToggles();
    initDashboard();
    initStudents();
    initProfile();
    initAttendance();
    initFees();
    initTimetable();
    initLogin();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
