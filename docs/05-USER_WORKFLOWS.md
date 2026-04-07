# User Workflows & Processes

## Complete User Journey Documentation

---

## Workflow 1: Student Lab Submission Process

### Scenario: John (Student) submits his first lab report

```
Timeline: Lab session on Apr 1, 2026, 10:00-12:00 AM
Deadline: Apr 1, 2026, 1:00 PM (On-time)
Late deadline: Apr 1, 2026, 2:00 PM (with 10% penalty)

┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Authentication (2 minutes before submission)        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 1. John opens SmartLab on his phone/laptop                 │
│ 2. Enters University ID: CSE-20210001                       │
│ 3. Enters Password                                          │
│ 4. System validates credentials                            │
│    → Checks if account is active                           │
│    → Verifies password hash                                │
│    → Generates JWT tokens                                  │
│ 5. John logged in successfully                             │
│    → Redirected to student dashboard                       │
│    → Display active sessions                               │
│                                                              │
│ Database Activity:                                          │
│ - Query: users table (university_id = "CSE-20210001")      │
│ - Update: last_login timestamp                             │
│ - Cache: JWT token in Redis (15-min TTL)                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Scan/Locate Session (5 minutes)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ OPTION A: QR Code Scanning                                 │
│ ─────────────────────────────────────────                  │
│ 1. John taps "Scan QR Code" button                         │
│ 2. Browser requests camera permission                      │
│ 3. John points camera at displayed QR code                │
│ 4. Frontend QR scanner (jsQR) detects QR                   │
│ 5. QR decoded to: "https://api.smartlab.edu/submit?       │
│                    session=sess-20260401-001"              │
│ 6. Frontend extracts session ID                            │
│ 7. No server call needed (QR endpoint info embedded)       │
│                                                              │
│ OPTION B: Manual Selection                                 │
│ ─────────────────────────────────────────                  │
│ 1. John taps "Select Subject & Session"                    │
│ 2. Dropdown shows active sessions for his classes          │
│ 3. John selects "DS & Algorithms - Lab 1"                 │
│ 4. Session details populate                                │
│                                                              │
│ Database Activity (both paths):                             │
│ - Query: sessions table (status = 'active')                │
│ - Verify: session_date <= today <= late_deadline           │
│ - Load: deadline info, subject details                     │
│                                                              │
│ Validation Checks:                                          │
│ ✓ Is session active?                                       │
│ ✓ Is current time within acceptable window?                │
│ ✓ QR code not expired?                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Submission (2 minutes)                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 1. John sees submission confirmation screen                │
│    - Session: "DS & Algorithms - Lab 1"                    │
│    - Deadline: "Apr 1, 2026, 1:00 PM"                      │
│    - Current time: "Apr 1, 2026, 12:30 PM"                 │
│    - Status: "On-time" (green indicator)                   │
│                                                              │
│ 2. John taps "Confirm & Submit"                            │
│    → OR cancels and tries again                            │
│                                                              │
│ 3. System checks for duplicates:                           │
│    SELECT * FROM submissions                               │
│    WHERE session_id = 'sess-20260401-001'                  │
│      AND student_id = john_id;                             │
│                                                              │
│ 4. If no duplicate:                                         │
│    - Record submission in database                         │
│    - Calculate submission status                           │
│    - Generate receipt                                      │
│    - Queue email notification                              │
│                                                              │
│ 5. If duplicate detected:                                   │
│    - Display error: "You have already submitted for        │
│      this session"                                         │
│    - Show previous submission time                         │
│    - Option to view previous submission                    │
│                                                              │
│ Submission Record Created:                                  │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ id: uuid-sub-20260401-001                              │ │
│ │ session_id: sess-20260401-001                          │ │
│ │ student_id: user-cse20210001                           │ │
│ │ submission_time: 2026-04-01T12:30:45Z                  │ │
│ │ status: 'on_time'                                      │ │
│ │ submission_method: 'qr_scan'                           │ │
│ │ ip_address: 192.168.1.100                              │ │
│ │ device_info: {userAgent: "...", browser: "Chrome"}    │ │
│ │ created_at: 2026-04-01T12:30:45Z                       │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ Time-Based Status Logic:                                    │
│ ───────────────────────                                    │
│ IF submission_time <= session.submission_deadline           │
│    → status = 'on_time'                                    │
│ ELSE IF submission_time <= session.late_submission_deadline │
│    → status = 'late'                                       │
│    → late_penalty_flag = true                              │
│ ELSE                                                        │
│    → status = 'closed' (do not accept)                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Confirmation & Notification (1 minute)              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 1. Display success screen:                                  │
│    ✅ Submission Successful!                                │
│    Session: "DS & Algorithms - Lab 1"                      │
│    Submitted: Apr 1, 2026, 12:30 PM                        │
│    Status: ✅ On-time                                       │
│    Receipt ID: RCP-20260401-001                            │
│                                                              │
│ 2. Send email notification:                                │
│    From: system@smartlab.university.edu                     │
│    To: john@university.edu                                  │
│    Subject: Lab Submission Confirmed                        │
│    Body: Confirms submission details, receipt ID           │
│                                                              │
│ 3. Create in-app notification:                             │
│    Title: "Lab Submitted Successfully"                     │
│    Message: "Your submission for DS & Algorithms Lab 1     │
│              has been recorded."                            │
│    Related: submission-id                                  │
│                                                              │
│ 4. Update rep dashboard (real-time via WebSocket):         │
│    - Increment submission count for session                │
│    - Add John to submitted list                            │
│    - Update progress bar                                   │
│                                                              │
│ Background Jobs Triggered:                                 │
│ - Send email (Celery/Bull job)                             │
│ - Invalidate rep dashboard cache                           │
│ - Log audit entry                                          │
│                                                              │
│ Audit Log Entry:                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ action: 'submission_created'                           │ │
│ │ user_id: user-cse20210001                              │ │
│ │ entity_type: 'submission'                              │ │
│ │ entity_id: uuid-sub-20260401-001                       │ │
│ │ new_values: {submission data}                          │ │
│ │ ip_address: 192.168.1.100                              │ │
│ │ timestamp: 2026-04-01T12:30:45Z                        │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ 5. Student options after submission:                       │
│    [View Dashboard] [Submit Another Lab] [Download Receipt] │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Failure Scenarios

#### Scenario 1: Late Submission (1:30 PM)
```
John's second attempt to submit after deadline:

1. Scans QR code again
2. System checks:
   - submission_time = 2026-04-01T13:30:00Z
   - session.submission_deadline = 2026-04-01T13:00:00Z
   - session.late_submission_deadline = 2026-04-01T14:00:00Z

3. Logic evaluates:
   IF 13:30 <= 14:00 (late deadline)
       → ALLOW submission
       → status = 'late'

4. Create submission record with status = 'late'

5. Display warning:
   ⚠️  Late Submission
   Your submission is being recorded as LATE
   A penalty may be applied by the instructor
   Submission Time: Apr 1, 2026, 1:30 PM
   Deadline Was: Apr 1, 2026, 1:00 PM
   [Confirm] or [Cancel]

6. If admin configured penalty:
   When marks are assigned:
   - obtained_marks = 18
   - late_penalty_percentage = 10%
   - final_marks = 18 - (18 * 0.10) = 16.2/20
```

#### Scenario 2: Duplicate Submission (12:45 PM)
```
John tries to submit again 15 minutes after first submission:

1. Scans QR code
2. System checks:
   SELECT COUNT(*) FROM submissions
   WHERE session_id = 'sess-20260401-001'
     AND student_id = 'user-cse20210001'

3. Count = 1 (already submitted)

4. Display error screen:
   ❌ Duplicate Submission Detected
   You have already submitted for this session
   
   Previous Submission:
   Time: Apr 1, 2026, 12:30 PM
   Status: ✅ On-time
   
   [View Previous] [Back to Dashboard]

5. Log failed attempt in audit logs
```

#### Scenario 3: Session Closed (2:15 PM)
```
John tries to submit after both deadlines closed:

1. Current time: 2026-04-01T14:15:00Z
2. System checks:
   - submission_deadline = 2026-04-01T13:00:00Z
   - late_submission_deadline = 2026-04-01T14:00:00Z
   - 14:15 > 14:00? YES

3. Status = 'closed' (do not accept)

4. Display error:
   ❌ Submission Window Closed
   This session no longer accepts submissions
   
   Submission Deadline: Apr 1, 2026, 1:00 PM
   Late Deadline: Apr 1, 2026, 2:00 PM
   Current Time: Apr 1, 2026, 2:15 PM
   
   Please contact your instructor for late submissions
```

---

## Workflow 2: Class Representative Session Management

### Scenario: Sarah (Class Rep) organizes lab session

```
Timeline: 1 day before session

┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Login & Navigation (2 minutes)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 1. Sarah logs in with credentials (CSE-2021012)            │
│ 2. Role check: role = 'representative'                      │
│ 3. Approved permissions: create_sessions, view_submissions  │
│ 4. Directed to Rep Dashboard                                │
│ 5. Sees: "Create New Session" button (prominent)           │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Create Session (10 minutes)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Form Inputs:                                                │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Subject: [Data Structures & Algorithms ▼]              ││
│ │ Lab Title: Lab 1: Introduction to Algorithms           ││
│ │ Session Date: April 1, 2026                            ││
│ │ Start Time: 10:00 AM                                   ││
│ │ End Time: 12:00 PM                                     ││
│ │ Submission Deadline: April 1, 2026, 1:00 PM            ││
│ │ Allow Late Submissions: ☑ Yes                          ││
│ │ Late Window Duration: 60 minutes                        ││
│ │ Notes: "Submit via QR code only. Use classroom device"││
│ └─────────────────────────────────────────────────────────┘│
│                                                              │
│ 1. Sarah fills form                                         │
│ 2. Clicks "Create & Generate QR"                           │
│ 3. Frontend validates:                                      │
│    ✓ All required fields filled                            │
│    ✓ Deadline > session_date                              │
│    ✓ subject_id is valid                                  │
│                                                              │
│ 4. Backend processes (POST /sessions):                      │
│    a) Verify Sarah has 'representative' role               │
│    b) Verify subject_id exists and belongs to Sarah's dept  │
│    c) Insert session record:                               │
│       ┌──────────────────────────────────────────────────┐ │
│       │ id: sess-20260401-001                            │ │
│       │ subject_id: subj-ds-algo                         │ │
│       │ created_by: user-cse-2021012 (Sarah)            │ │
│       │ session_title: "Lab 1: Introduction..."          │ │
│       │ session_date: 2026-04-01                         │ │
│       │ start_time: 10:00:00                             │ │
│       │ end_time: 12:00:00                               │ │
│       │ submission_deadline: 2026-04-01T13:00:00Z        │ │
│       │ late_submission_deadline: 2026-04-01T14:00:00Z   │ │
│       │ status: 'active'                                 │ │
│       │ created_at: 2026-03-31T14:30:00Z                 │ │
│       └──────────────────────────────────────────────────┘ │
│                                                              │
│    d) Generate unique QR code:                             │
│       - Create QR entry with unique code                  │
│       - Encode: "https://api.smartlab.edu/submit?         │
│                  session=sess-20260401-001"               │
│       - Generate QR image (PNG)                            │
│       - Store in cloud storage                             │
│       - Return QR image URL                                │
│                                                              │
│ 5. Database creates related records:                        │
│    - sessions table (1 record)                             │
│    - qr_codes table (1 record)                             │
│    - Update Redis cache with new session                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STEP 3: QR Distribution (5 minutes)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Display options:                                            │
│ ┌─────────────────────────────────────────────────────────┐│
│ │         QR Code Generated Successfully                 ││
│ │                                                        ││
│ │  ┌──────────────────────────────────┐                 ││
│ │  │                                  │                 ││
│ │  │       [QR CODE IMAGE]            │                 ││
│ │  │                                  │                 ││
│ │  │   Session: sess-20260401-001     │                 ││
│ │  └──────────────────────────────────┘                 ││
│ │                                                        ││
│ │ [Print QR]  [Display on Screen]  [Email] [Copy Link]  ││
│ └─────────────────────────────────────────────────────────┘│
│                                                              │
│ Option A: Display on Screen                               │
│ ─────────────────────────────────                         │
│ - QR image shown full-screen in classroom                 │
│ - Students point phones to scan                            │
│                                                              │
│ Option B: Print QR                                         │
│ ─────────────────────────────────                         │
│ - Download PDF with QR                                    │
│ - Print and put on whiteboard                              │
│                                                              │
│ Option C: Email to Students                               │
│ ─────────────────────────────────                         │
│ - Send email based on session attendee list               │
│ - Subject: "Lab 1 Submission - Click to Submit"           │
│ - Body: QR image + direct submission link                 │
│                                                              │
│ Option D: Copy Submission Link                            │
│ ─────────────────────────────────                         │
│ - Copy link: https://smartlab.edu/submit?session=...      │
│ - Paste in LMS, email, or announcement                    │
│ - Students click link directly                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Real-Time Monitoring (Session day, continuous)     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Sarah opens "Session Monitor" dashboard on her laptop:      │
│                                                              │
│ Real-time updates (WebSocket connection):                   │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Lab 1: Algorithms - LIVE MONITORING                    ││
│ │                                                        ││
│ │ Progress: 45 / 50 students (90%) ▓▓▓▓▓▓▓▓▓░░░        ││
│ │ On-time: 44 ✅  |  Late: 1 🟡  |  Pending: 5 ⏳       ││
│ │ Time: Apr 1, 12:50 PM (10 min until deadline)         ││
│ │ Status: ACTIVE 🟢                                     ││
│ │                                                        ││
│ │ Submitted Students:                                   ││
│ │ ┌────────────────────────────────────────────────────┐││
│ │ │ 1. John Doe      12:30 PM ✅ On-time             │││
│ │ │ 2. Jane Smith    12:35 PM ✅ On-time             │││
│ │ │ 3. Mike Brown    12:45 PM ✅ On-time             │││
│ │ │ ...                                                 │││
│ │ │ 45. Sarah Jones  12:55 PM 🟡 Late (5 min)        │││
│ │ └────────────────────────────────────────────────────┘││
│ │                                                        ││
│ │ Not Yet Submitted:                                   ││
│ │ - Student A, Student B, Student C, Student D, E       ││
│ │                                                        ││
│ │ Actions:                                              ││
│ │ [Send Reminder Email] [Extend Deadline] [Export]     ││
│ │                                                        ││
│ └─────────────────────────────────────────────────────────┘│
│                                                              │
│ Real-time Updates:                                          │
│ When any student submits:                                  │
│ 1. Database: INSERT into submissions                       │
│ 2. Redis: Increment submission_count                       │
│ 3. WebSocket: Push update to Sarah's dashboard            │
│ 4. Animation: Submission count increases in real-time     │
│ 5. Sound: Optional notification sound                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Post-Submission Management (After deadline)        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 1:00 PM - Deadline hits:                                    │
│    - No new on-time submissions accepted                   │
│    - Display: "Submission window closed for on-time"       │
│    - Late window now active (if configured)                │
│                                                              │
│ 2:00 PM - Late deadline hits:                              │
│    - No submissions accepted at all                        │
│    - Session status: 'closed'                              │
│    - Display: "Session closed. No more submissions"        │
│                                                              │
│ Post-deadline actions:                                      │
│ [Export Submissions] [Close Session] [View Marks Status]   │
│ [Send Feedback Email] [Archive Session]                    │
│                                                              │
│ Export generates CSV with:                                  │
│ - Student ID, Name                                          │
│ - Submission timestamp                                      │
│ - Status (on-time/late)                                     │
│ - File name                                                 │
│ - Receipt ID                                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Workflow 3: Admin Marking & Evaluation

### Scenario: Dr. Smith (Admin) marks submissions

```
Timeline: 1 day after submission deadline

┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Access Marking Interface (3 minutes)                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 1. Dr. Smith opens Admin Dashboard                         │
│ 2. Sees: "47 Submissions Awaiting Marks"                   │
│ 3. Clicks on "Lab 1: Algorithms" session                   │
│ 4. System loads:                                            │
│    a) Fetch all submissions for session from DB             │
│    b) Load marks status (reviewed/pending)                  │
│    c) Sort by submission time (oldest first)                │
│    d) Load QR codes, student details                        │
│ 5. Displays submission queue (45 submissions)               │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Review Submission (3-5 minutes per submission)     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ First submission: John Doe (CSE-20210001)                   │
│                                                              │
│ 1. Load submission details:                                 │
│    - Download PDF file from cloud storage                  │
│    - Display in embedded viewer                            │
│    - Show metadata (submission time, status)                │
│                                                              │
│ 2. Review submission (read file)                           │
│    - Examine algorithms implemented                        │
│    - Check code quality and comments                       │
│    - Verify correctness                                     │
│                                                              │
│ 3. Dr. Smith enters marks:                                  │
│    ┌─────────────────────────────────────────────────────┐ │
│    │                                                      │ │
│    │ Total Marks: 20                                     │ │
│    │ Obtained: [18]                                      │ │
│    │                                                      │ │
│    │ Rubric Points:                                      │ │
│    │  • Correctness (0-8): [8] ✓                         │ │
│    │  • Efficiency (0-7): [7] ✓                          │ │
│    │  • Code Quality (0-5): [3]                          │ │
│    │                                                      │ │
│    │ Feedback:                                            │ │
│    │ ┌──────────────────────────────────────────────────┐│ │
│    │ │ Good algorithm design with efficient sorting.    ││ │
│    │ │ Code could include more comments. Variables      ││ │
│    │ │ names should be more descriptive.               ││ │
│    │ └──────────────────────────────────────────────────┘│ │
│    │                                                      │ │
│    │ Late Penalty: ☑ Checkbox → ❌ Unchecked            │ │
│    │ (John submitted on-time, so no penalty)            │ │
│    │                                                      │ │
│    │ Visibility: ◉ Show to Student                      │ │
│    │                                                      │ │
│    │ [Save & Next] [Save as Draft] [Cancel]             │ │
│    └─────────────────────────────────────────────────────┘ │
│                                                              │
│ 4. Validation on save:                                      │
│    ✓ obtained_marks <= total_marks                          │
│    ✓ obtained_marks >= 0                                    │
│    ✓ Feedback provided                                      │
│                                                              │
│ 5. Database INSERT/UPDATE marks:                            │
│    ┌──────────────────────────────────────────────────────┐ │
│    │ id: mark-uuid                                        │ │
│    │ submission_id: uuid-sub-20260401-001                │ │
│    │ grader_id: user-admin-dr-smith                      │ │
│    │ total_marks: 20                                      │ │
│    │ obtained_marks: 18                                   │ │
│    │ marks_percentage: 90.0                               │ │
│    │ feedback: "Good algorithm design..."                │ │
│    │ late_penalty_percentage: 0                           │ │
│    │ final_marks: 18                                      │ │
│    │ is_reviewed: TRUE                                    │ │
│    │ reviewed_at: 2026-04-02T10:15:00Z                    │ │
│    │ visibility_to_student: TRUE                          │ │
│    │ created_at: 2026-04-02T10:15:00Z                     │ │
│    └──────────────────────────────────────────────────────┘ │
│                                                              │
│ 6. Audit log created:                                       │
│    action: 'marks_assigned'                                │
│    user_id: user-admin-dr-smith                            │
│    entity_id: mark-uuid                                    │
│    old_values: {} (new record)                              │
│    new_values: {marks data}                                │
│                                                              │
│ 7. Notifications generated:                                 │
│    Type: 'marks_released'                                   │
│    To: john@university.edu                                  │
│    Title: "Your marks are now available"                    │
│    Message: "Your submission for DS & Algorithms Lab 1      │
│              has been marked and is ready for viewing."     │
│                                                              │
│ 8. Click "Save & Next"                                      │
│    → System marks current submission complete              │
│    → Loads next submission (Jane Smith)                    │
│    → Progress updates: 1/45 ✅                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Handle Late Submission (2nd in queue)              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Student: Mike Brown (submitted 30 min after deadline)       │
│                                                              │
│ 1. Load submission details                                  │
│ 2. Display alert: ⚠️ LATE SUBMISSION (Submitted 30 min late)│
│ 3. Dr. Smith marks:                                         │
│    obtained_marks: 17                                       │
│    late_penalty_percentage: 10 (as per system rules)        │
│    final_marks: 17 - (17 * 0.10) = 15.3                    │
│                                                              │
│ Checkbox: ☑ Apply Late Penalty                             │
│                                                              │
│ 4. System automatically calculates penalties:               │
│    late_penalty_amount = 17 * 0.10 = 1.7                   │
│    final_marks = 17 - 1.7 = 15.3                            │
│                                                              │
│ Display:                                                    │
│ Original Marks: 17/20                                       │
│ Late Penalty (10%): -1.7                                    │
│ Final Marks: 15.3/20                                        │
│                                                              │
│ 5. Feedback includes note about penalty:                    │
│    "Good work, but submitted late. 10% penalty applied     │
│     per course rule. Final marks: 15.3/20"                 │
│                                                              │
│ 6. Save marks with late_penalty_applied = TRUE              │
│    → Creates marks record with penalty_percentage = 10      │
│    → Stores final_marks = 15.3                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Batch Save & Export (After marking all)             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ After marking all 45 submissions:                           │
│                                                              │
│ Dashboard shows:                                            │
│ ✅ 45 / 45 Marked (100%)                                   │
│ 📊 Statistics:                                              │
│    - Average marks: 17.2/20                                │
│    - Highest: 20                                            │
│    - Lowest: 12                                             │
│    - With penalties: 8 submissions                          │
│                                                              │
│ Export Options:                                             │
│ [Export as CSV] [Export as PDF] [Print]                    │
│                                                              │
│ CSV Export contents:                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Student ID, Name, Submitted, Status, Marks, Grade, .... │ │
│ │ CSE-2021001, John Doe, 2026-04-01T12:30Z, On-time, 18, A+
│ │ CSE-2021002, Jane Smith, 2026-04-01T12:35Z, On-time, 19, A+
│ │ CSE-2021034, Mike Brown, 2026-04-01T13:30Z, Late, 15.3, B
│ │ ...                                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ After successful export:                                    │
│ - File generated and downloaded                            │
│ - Email copy to Dr. Smith (optional)                        │
│ - Archive export reference                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Mark Release & Notifications (Batch action)        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Option 1: Release Immediately                              │
│ ─────────────────────────────────────────                  │
│ [Release All Marks] button                                  │
│                                                              │
│ For each marked submission:                                 │
│ 1. Set visibility_to_student = TRUE                         │
│ 2. Create notification for student                          │
│ 3. Send email notification                                  │
│ 4. Update student_notification_count in Redis               │
│ 5. Log audit entry per mark                                │
│                                                              │
│ Option 2: Scheduled Release                                │
│ ─────────────────────────────────────────                  │
│ "Release on: [April 5, 2026 at 10:00 AM]"                 │
│ → Marks hidden until scheduled time                        │
│ → Cron job releases at specified time                      │
│ → Notifications sent to all students                       │
│                                                              │
│ Email sent to each student:                                 │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ From: dr.smith@university.edu                            │ │
│ │ To: student@university.edu                               │ │
│ │ Subject: Your Lab 1 Marks Are Available                 │ │
│ │                                                          │ │
│ │ Dear Student,                                            │ │
│ │                                                          │ │
│ │ Your submission for DS & Algorithms Lab 1 has been      │ │
│ │ marked and the results are now available on SmartLab.   │ │
│ │                                                          │ │
│ │ Your Marks: 18/20 (90%)                                 │ │
│ │ Grade: A+                                                │ │
│ │                                                          │ │
│ │ [View Marks] [Download Feedback]                        │ │
│ │                                                          │ │
│ │ Best regards,                                            │ │
│ │ Dr. Smith                                                │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ Students can now view marks in their dashboard              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Workflow 4: Analytics & Reporting

### Scenario: Department Head reviews analytics

```
Timeline: End of semester

Admin navigates to Analytics Dashboard:

1. Select date range: [Jan 1 - Mar 31, 2026]
2. Select filters: Department [CSE], Subject [All]
3. System queries (optimized):
   - Total submissions vs expected
   - On-time vs late rates
   - Department comparison
   - Trend analysis

Display on dashboard:
- 94.3% submission rate (892/945 expected)
- 98.2% on-time rate
- Late submissions: 16 (1.8%)
- Average marks: 17.5/20
- Lowest department: CIVIL (88.5%)

Charts:
1. Trend line (daily submissions over time)
2. Department comparison (bar chart)
3. Status breakdown (pie chart: on-time/late)

Export: CSV, PDF, Excel formats
```

