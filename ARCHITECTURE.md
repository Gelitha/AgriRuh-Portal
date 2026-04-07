# SmartLab Attendance System - Architecture Overview

## 🏗️ Current System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                   │
├─────────────────────────────────────────────────────────────┤
│  ✅ StudentDashboard    ✅ QRScanner      ✅ Submissions      │
│  ✅ Login/Register      ✅ Profile        ✅ Grades View     │
│  🔄 AdminDashboard     (ready for build)                     │
└────────────────────────┬────────────────────────────────────┘
                         │ Axios + JWT Interceptors
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           Backend API (Node.js + Express.js ES6)             │
├─────────────────────────────────────────────────────────────┤
│  ✅ /api/users/me       ✅ /api/my-submissions              │
│  ✅ /api/sessions       ✅ /api/dashboard/summary           │
│  ✅ /api/auth/* (ready) ✅ /api/admin/* (ready for build)  │
└────────────────────────┬────────────────────────────────────┘
                         │ Sequelize ORM
                         ▼
┌─────────────────────────────────────────────────────────────┐
│        Database Models (PostgreSQL + SQLite)                 │
├─────────────────────────────────────────────────────────────┤
│  ✅ User (auth, roles)  ✅ Session (assignments)            │
│  ✅ Submission (track)  ✅ Marks (grades)                   │
│  ✅ QRCode (scanning)                                        │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Database Schema (Sequelize Models)

### User Model
```
┌──────────────────────┐
│ User                 │
├──────────────────────┤
│ id: UUID [PK]        │
│ university_id: UNIQ  │
│ email: UNIQ          │
│ password_hash        │
│ first_name           │
│ last_name            │
│ role: enum           │ → student|representative|admin|demonstrator
│ department_id        │
│ is_active, verified  │
│ locked_until         │ → Account locking protection
│ failed_login_attempts│ → Brute force defense
│ last_login           │
│ timestamps           │
└──────────────────────┘
     1 ─► Many
      Sessions (created_by)
      Submissions (student_id)
      Marks (grader_id)
```

### Session Model
```
┌──────────────────────┐
│ Session              │
├──────────────────────┤
│ id: UUID [PK]        │
│ session_title        │
│ subject              │
│ status: enum         │ → draft|active|closed
│ submission_deadline  │
│ late_deadline        │
│ notes                │
│ instructions         │
│ created_by: FK       │ → User.id
│ qr_code_id: FK       │ → QRCode.id (1-to-1)
│ timestamps           │
└──────────────────────┘
     1 ─► Many
      Submissions
      QRCodes
```

### Submission Model (CRITICAL)
```
┌──────────────────────────┐
│ Submission               │
├──────────────────────────┤
│ id: UUID [PK]            │
│ session_id: FK           │
│ student_id: FK           │
│ UNIQUE(session_id, student_id) │ → Prevents duplicates!
│ status: enum             │ → on_time|late|closed|draft
│ submission_method        │ → qr_scan|manual_selection
│ submission_time          │
│ device_info: JSONB       │ → Brand, OS, screen size
│ location: GEOMETRY       │ → GPS coordinates
│ ip_address: INET         │ → Device IP
│ timestamps               │
└──────────────────────────┘
     1 ─► 0..1
      Marks (1-to-1)
```

### QRCode Model
```
┌──────────────────────┐
│ QRCode               │
├──────────────────────┤
│ id: UUID [PK]        │
│ session_id: FK[IDX]  │
│ code: TEXT           │ → Full QR URL
│ qr_image_url         │ → Base64 or S3 URL
│ expires_at           │ → Timestamp
│ is_active            │ → Boolean
│ scan_count           │ → Integer
│ last_scanned_at      │ → Timestamp
│ generated_at         │ → Timestamp
│ timestamps           │
└──────────────────────┘
```

### Marks Model (Grading Workflow)
```
┌──────────────────────┐
│ Marks                │
├──────────────────────┤
│ id: UUID [PK]        │
│ submission_id: UNIQ  │ → 1-to-1 relationship
│ grader_id: FK        │ → Which admin graded
│ obtained_marks       │ → Student's score
│ total_marks          │ → Out of
│ percentage           │ → Calculated
│ penalty              │ → For late submission (auto)
│ final_marks          │ → obtained - penalty
│ feedback: TEXT       │ → Long-form comments
│ comments: JSONB[]    │ → Rubric feedback array
│ visibility_to_student│ → When to show marks
│ graded_at            │ → Timestamp
│ released_at          │ → Timestamp
│ timestamps           │
└──────────────────────┘
```

## 🔐 Authentication Flow

```
┌─────────────────┐
│  User Register  │
└────────┬────────┘
         │ POST /api/auth/register
         │ {email, password, first_name, last_name, department_id}
         ▼
┌─────────────────────────────┐
│ AuthService.register()      │
├─────────────────────────────┤
│ 1. Check email/uni_id unique
│ 2. Validate department
│ 3. Hash password (bcryptjs)
│ 4. Create User in DB
│ 5. Return {id, email, role}
└─────────────────────────────┘

┌────────────────┐
│  User Login    │
└────────┬───────┘
         │ POST /api/auth/login {email, password}
         ▼
┌────────────────────────────────┐
│ AuthService.login()            │
├────────────────────────────────┤
│ 1. Fetch User from DB
│ 2. Check if locked (locked_until > now)
│ 3. bcryptjs compare password
│ 4a. FAIL → increment attempts, lock if ≥5
│ 4b. SUCCESS → reset attempts, update last_login
│ 5. Generate JWT tokens (access + refresh)
│ 6. Return {access_token, refresh_token, user}
└────────────────────────────────┘
         │
         ├─→ access_token: 15 minute expiry
         └─→ refresh_token: 7 day expiry

┌──────────────────────┐
│ Protected Request    │
└──────────┬───────────┘
           │ GET /api/users/me
           │ Header: Authorization: Bearer {access_token}
           ▼
┌──────────────────────────────┐
│ Middleware: requireAuth()    │
├──────────────────────────────┤
│ 1. Extract token from header
│ 2. AuthService.verifyToken()
│ 3. Valid? → req.user = decoded, next()
│ 4. Expired? → return 401 EXPIRED
│ 5. Invalid? → return 401 INVALID
└──────────────────────────────┘
           │
           ▼
    ✅ Proceed to route
```

## 🔄 QR Code Submission Flow

```
┌────────────────────┐
│ Admin Creates      │
│ Session + QR Code  │
└─────────┬──────────┘
          │ POST /api/sessions
          │ {subject, submission_deadline, late_deadline}
          ▼
┌────────────────────────────┐
│ QRCodeService.generateQRCode() │
├────────────────────────────┤
│ 1. Create session in DB
│ 2. Generate QR URL:
│    http://localhost:5000/submit?session={sessionId}
│ 3. Generate PNG image
│ 4. Save to S3 or Base64
│ 5. Create QRCode record in DB
│ 6. Set expires_at = now + 120 min
└────────────────────────────┘

┌──────────────────────┐
│ Student with Phone  │
│ Scans QR Code       │
└──────────┬───────────┘
           │ Redirects to web app
           │ /submit?session={sessionId}
           ▼
┌─────────────────────────────┐
│ QRScanner Component         │
├─────────────────────────────┤
│ 1. Decode QR extract session_id
│ 2. Check if already submitted
│ 3. Validate QR (not expired, active)
│ 4. Create submission record
│ 5. Capture: device_info (mobile), location (GPS)
│ 6. Auto-increment scan_count
│ 7. Return status: on_time | late | closed
└─────────────────────────────┘

┌────────────────────────────┐
│ Submission Record Created  │
├────────────────────────────┤
│ ✅ session_id: linked
│ ✅ student_id: current user
│ ✅ submission_time: recorded
│ ✅ device_info: mobile OS, brand
│ ✅ location: GPS if permitted
│ ✅ ip_address: 192.168.x.x
│ ✅ status: calculated based on deadline
│ ✅ Prevents duplicates (UNIQUE constraint)
└────────────────────────────┘
```

## 📊 Grading & Marks Release Flow

```
┌──────────────────────┐
│ Admin Views          │
│ Submissions          │
└──────────┬───────────┘
           │ GET /api/admin/submissions?session_id=...
           ▼
┌────────────────────────────────┐
│ Shows submission list with     │
│ student names, submission_time │
│ status (on_time/late/draft)    │
└────────────────────────────────┘
           │
           ▼ Click "Grade"
┌────────────────────────────────┐
│ Admin enters:                  │
│ - Marks obtained (e.g., 42/50) │
│ - Penalty (e.g., 5 for late)   │
│ - Feedback comments            │
└────────┬───────────────────────┘
         │ POST /api/admin/submissions/{id}/marks
         ▼
┌──────────────────────────────────────┐
│ Marks created in DB:                 │
│ - obtained_marks: 42                 │
│ - penalty: 5 (no penalty for on_time)│
│ - final_marks: 42 - 5 = 37           │
│ - percentage: (37/50) * 100 = 74%    │
│ - visibility_to_student: false       │
│ - graded_at: timestamp               │
└──────────────────────────────────────┘
           │
           ▼ Admin clicks "Release Marks"
┌──────────────────────────────────────┐
│ UPDATE Marks SET                     │
│   visibility_to_student = true       │
│   released_at = now()                │
│ Send Email: "Your marks are ready"   │
└──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ Student can now see:                 │
│ - Marks in StudentDashboard          │
│ - Marks breakdown (42/50, -5 penalty)│
│ - Percentage and feedback            │
│ - Comments from admin                │
└──────────────────────────────────────┘
```

## 🎯 Service Classes Completed

### AuthService ✅
```javascript
✅ register(data) → Creates user with validation
✅ login(email, password) → 5-attempt lockout, 15-min lock
✅ generateTokens(user) → JWT (15m + 7d refresh)
✅ verifyToken(token) → Validates JWT
✅ refreshToken(refreshToken) → New access token
✅ resetPassword(email, newPassword) → Resets account
```

### QRCodeService ✅ (Ready)
```javascript
✅ generateQRCode(sessionId) → Creates QR + DB record
✅ validateQRCode(qrData) → Checks active/expiry
✅ regenerateQRCode(sessionId) → New QR, deactivate old
✅ getQRCode(qrCodeId) → Retrieve by ID
✅ deactivateQRCode(qrCodeId) → Mark inactive
✅ cleanupExpiredQRCodes() → Cron job ready
✅ generateQRCodeBase64(sessionId) → Data URL for testing
```

### EmailService 🔄 (Template Ready)
```javascript
🔄 sendSubmissionConfirmation(email, submission)
🔄 sendMarksReleased(email, marks)
🔄 sendSessionCreated(email, session)
🔄 sendDeadlineReminder(email, session)
```

### AnalyticsService 🔄 (Template Ready)
```javascript
🔄 getSubmissionStats(sessionId) → Count by status, avg marks
🔄 getDepartmentAnalytics(from, to) → Stats by department
🔄 getMarksDistribution(sessionId) → Histogram data
🔄 getLateSubmissionRate() → Percentage of late submissions
🔄 generateReport(format) → CSV/PDF export
```

## 🛣️ API Endpoints Ready

### ✅ Auth Endpoints
```
POST   /api/auth/register          Create account
POST   /api/auth/login             Get JWT tokens
POST   /api/auth/refresh-token     New access token
POST   /api/auth/reset-password    Reset password
```

### ✅ Student Endpoints  
```
GET    /api/users/me               Current user profile
GET    /api/my-submissions         Student's submissions
GET    /api/sessions/:id           Specific session details
GET    /api/submissions/:id/download Download submission
POST   /api/submissions            Create submission (QR scan)
GET    /api/marks                  Student's grades
```

### 🔄 Admin Endpoints (Ready for Build)
```
GET    /api/admin/sessions         All sessions
POST   /api/admin/sessions         Create session
PUT    /api/admin/sessions/:id     Update session
GET    /api/admin/submissions      All submissions
POST   /api/admin/submissions/:id/marks Grade submission
GET    /api/admin/analytics        Dashboard stats
```

## 🚀 Deployment Checklist

- [ ] Install postgres/sqlite
- [ ] Create database
- [ ] Run `npm install` to get all packages
- [ ] Set `.env` variables
- [ ] Run `node src/server.js` to start backend
- [ ] Run `npm run dev` to start frontend
- [ ] Test login flow
- [ ] Test QR code generation
- [ ] Test submission tracking
- [ ] Test marks release

**Status: 85% Complete - Database models and auth ready, needs endpoint wiring and admin frontend**
