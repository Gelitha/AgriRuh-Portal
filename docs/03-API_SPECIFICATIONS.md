# API Specifications

## Overview
RESTful API design following OpenAPI/Swagger standards. All endpoints use JSON for requests/responses.

---

## Base URL & General Information

```
Development: http://localhost:3000/api/v1
Production: https://api.smartlab.university.edu/api/v1

Response Format: JSON
Authentication: Bearer Token (JWT)
Rate Limiting: 100 requests/minute per IP
```

---

## Standard Response Format

### Success Response (2xx)
```json
{
  "success": true,
  "data": { /* actual data */ },
  "message": "Operation successful",
  "timestamp": "2026-03-26T10:30:00Z"
}
```

### Error Response (4xx, 5xx)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Detailed error message",
    "details": { /* optional field-level errors */ }
  },
  "timestamp": "2026-03-26T10:30:00Z"
}
```

### Pagination Format
```json
{
  "success": true,
  "data": [ /* items */ ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

---

## Authentication Endpoints

### 1. Register User
```
POST /auth/register
Content-Type: application/json

Request:
{
  "university_id": "CSE-20210123",
  "email": "student@university.edu",
  "first_name": "John",
  "last_name": "Doe",
  "password": "SecurePass123!",
  "department_id": "uuid-dept-001",
  "role": "student"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "id": "uuid-user-001",
    "university_id": "CSE-20210123",
    "email": "student@university.edu",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student",
    "created_at": "2026-03-26T10:00:00Z"
  }
}

Error: 400 Bad Request (invalid data), 409 Conflict (duplicate email/university_id)
```

### 2. Login
```
POST /auth/login
Content-Type: application/json

Request:
{
  "university_id": "CSE-20210123",
  "password": "SecurePass123!"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-user-001",
      "university_id": "CSE-20210123",
      "first_name": "John",
      "last_name": "Doe",
      "role": "student",
      "department_id": "uuid-dept-001"
    }
  }
}

Error: 401 Unauthorized (invalid credentials), 429 Too Many Requests (failed attempts)
```

### 3. Refresh Token
```
POST /auth/refresh-token
Content-Type: application/json
Authorization: Bearer <refresh_token>

Response: 200 OK
{
  "success": true,
  "data": {
    "access_token": "new-access-token-jwt"
  }
}
```

### 4. Logout
```
POST /auth/logout
Authorization: Bearer <access_token>

Response: 200 OK
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## User Management Endpoints

### 5. Get Current User Profile
```
GET /users/me
Authorization: Bearer <access_token>

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "uuid-user-001",
    "university_id": "CSE-20210123",
    "email": "student@university.edu",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student",
    "department_id": "uuid-dept-001",
    "phone": "+1234567890",
    "profile_picture_url": "https://...",
    "is_active": true,
    "is_verified": true,
    "last_login": "2026-03-26T09:00:00Z",
    "created_at": "2026-03-20T10:00:00Z"
  }
}
```

### 6. Update User Profile
```
PUT /users/:user_id
Authorization: Bearer <access_token>
Content-Type: application/json

Request:
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "profile_picture_url": "https://..."
}

Response: 200 OK
{
  "success": true,
  "data": { /* updated user object */ }
}

Authorization: User can only update their own profile or admin can update others
```

### 7. List Users (Admin Only)
```
GET /users?role=student&department_id=uuid&page=1&limit=20
Authorization: Bearer <admin_token>

Query Parameters:
- role: 'student' | 'representative' | 'admin'
- department_id: UUID
- search: university_id or email search
- page: pagination (default: 1)
- limit: items per page (default: 20, max: 100)

Response: 200 OK
{
  "success": true,
  "data": [ /* array of users */ ],
  "pagination": { /* pagination info */ }
}
```

### 8. Create User (Admin Only)
```
POST /users
Authorization: Bearer <admin_token>
Content-Type: application/json

Request:
{
  "university_id": "CSE-20210124",
  "email": "newuser@university.edu",
  "first_name": "Jane",
  "last_name": "Smith",
  "password": "InitialPass123!",
  "department_id": "uuid-dept-001",
  "role": "student"
}

Response: 201 Created
{
  "success": true,
  "data": { /* new user object */ }
}
```

### 9. Delete User (Admin Only)
```
DELETE /users/:user_id
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "success": true,
  "message": "User deleted successfully"
}

Note: Soft delete recommended (set is_active = false)
```

---

## Session Management Endpoints

### 10. Create Session (Rep/Admin Only)
```
POST /sessions
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "subject_id": "uuid-subj-001",
  "session_title": "Lab 1: Introduction to Algorithms",
  "session_date": "2026-04-01",
  "start_time": "10:00",
  "end_time": "12:00",
  "submission_deadline": "2026-04-01T13:00:00Z",
  "late_submission_window": 60,
  "notes": "Submit via QR code only"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "id": "uuid-sess-001",
    "subject_id": "uuid-subj-001",
    "session_title": "Lab 1: Introduction to Algorithms",
    "session_date": "2026-04-01",
    "submission_deadline": "2026-04-01T13:00:00Z",
    "late_submission_deadline": "2026-04-01T14:00:00Z",
    "qr_code": {
      "id": "uuid-qr-001",
      "code": "https://smartlab.university.edu/submit?session=uuid-sess-001",
      "qr_image_url": "https://...",
      "expires_at": "2026-04-01T14:00:00Z"
    },
    "status": "active",
    "created_by": "uuid-rep-001",
    "created_at": "2026-03-26T10:00:00Z"
  }
}
```

### 11. List Sessions
```
GET /sessions?subject_id=uuid&status=active&page=1&limit=20
Authorization: Bearer <token>

Query Parameters:
- subject_id: UUID
- status: 'draft' | 'active' | 'closed' | 'archived'
- date_from: ISO date
- date_to: ISO date
- page, limit

Response: 200 OK
{
  "success": true,
  "data": [ /* array of sessions */ ],
  "pagination": { /* pagination info */ }
}
```

### 12. Get Session Details
```
GET /sessions/:session_id
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "uuid-sess-001",
    "subject_id": "uuid-subj-001",
    "session_title": "Lab 1",
    "session_date": "2026-04-01",
    "submission_deadline": "2026-04-01T13:00:00Z",
    "qr_code": { /* QR details */ },
    "created_by": { /* user info */ },
    "total_submissions": 45,
    "on_time_submissions": 44,
    "late_submissions": 1,
    "pending_submissions": 5,
    "status": "active",
    "created_at": "2026-03-26T10:00:00Z"
  }
}
```

### 13. Update Session (Rep/Admin Only)
```
PUT /sessions/:session_id
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "submission_deadline": "2026-04-01T14:00:00Z",
  "late_submission_window": 120,
  "notes": "Updated notes"
}

Response: 200 OK
{
  "success": true,
  "data": { /* updated session */ }
}
```

### 14. Close Session (Rep/Admin Only)
```
POST /sessions/:session_id/close
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Session closed. No more submissions accepted.",
  "data": { /* updated session */ }
}
```

### 15. Regenerate QR Code (Rep/Admin Only)
```
POST /sessions/:session_id/regenerate-qr
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "qr_code": { /* new QR code */ },
    "message": "QR code regenerated"
  }
}
```

---

## Submission Endpoints

### 16. Submit Lab (Student)
```
POST /submissions
Authorization: Bearer <student_token>
Content-Type: multipart/form-data

Request:
{
  "session_id": "uuid-sess-001",
  "file": <binary file data>,
  "submission_method": "qr_scan" | "manual_selection"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "id": "uuid-sub-001",
    "session_id": "uuid-sess-001",
    "student_id": "uuid-stud-001",
    "submission_time": "2026-04-01T12:30:00Z",
    "status": "on_time",
    "file_url": "https://storage.../submission-uuid.pdf",
    "submission_method": "qr_scan",
    "message": "Submission successful. Thank you!"
  }
}

Errors:
- 400: Session closed or invalid
- 409: Duplicate submission for this session
- 413: File too large
```

### 17. Check Submission Status
```
GET /submissions/:submission_id
Authorization: Bearer <token>
(Student can only view own, Rep/Admin can view all in their sessions)

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "uuid-sub-001",
    "session": { /* session details */ },
    "student": { /* student details */ },
    "submission_time": "2026-04-01T12:30:00Z",
    "status": "on_time",
    "file_url": "https://...",
    "marks": {
      "id": "uuid-marks-001",
      "obtained_marks": 18,
      "total_marks": 20,
      "percentage": 90,
      "feedback": "Good work!",
      "is_reviewed": true,
      "visibility_to_student": true
    }
  }
}
```

### 18. List Submissions for Session
```
GET /sessions/:session_id/submissions?status=on_time&page=1&limit=50
Authorization: Bearer <token> (Rep/Admin only)

Query Parameters:
- status: 'on_time' | 'late' | 'closed' | (all if omitted)
- search: student name/university_id
- page, limit

Response: 200 OK
{
  "success": true,
  "data": [ /* array of submissions */ ],
  "pagination": { /* pagination info */ },
  "stats": {
    "total_expected": 50,
    "total_submitted": 45,
    "on_time": 44,
    "late": 1,
    "not_submitted": 5
  }
}
```

### 19. Download Submission File
```
GET /submissions/:submission_id/download
Authorization: Bearer <token>

Response: 200 OK with file content
Content-Disposition: attachment; filename="student-lab1.pdf"
```

### 20. Get Submission List (Student)
```
GET /my-submissions?page=1&limit=10
Authorization: Bearer <student_token>

Response: 200 OK
{
  "success": true,
  "data": [ /* array of student's submissions */ ],
  "pagination": { /* pagination info */ }
}
```

---

## Marking/Evaluation Endpoints

### 21. Assign Marks (Admin Only)
```
POST /submissions/:submission_id/marks
Authorization: Bearer <admin_token>
Content-Type: application/json

Request:
{
  "obtained_marks": 18,
  "total_marks": 20,
  "feedback": "Excellent solution. Well documented.",
  "comments": {
    "correctness": "Full marks",
    "algorithm_efficiency": "Good",
    "code_quality": "Excellent"
  },
  "apply_late_penalty": true,
  "visibility_to_student": false
}

Response: 201 Created
{
  "success": true,
  "data": {
    "id": "uuid-marks-001",
    "obtained_marks": 18,
    "total_marks": 20,
    "percentage": 90,
    "late_penalty_percentage": 10,
    "final_marks": 16.2,
    "feedback": "Excellent solution...",
    "is_reviewed": true,
    "visibility_to_student": false,
    "created_at": "2026-04-02T10:00:00Z"
  }
}
```

### 22. Update Marks (Admin Only)
```
PUT /marks/:marks_id
Authorization: Bearer <admin_token>
Content-Type: application/json

Request:
{
  "obtained_marks": 19,
  "feedback": "Rechecked. Great solution!",
  "visibility_to_student": true
}

Response: 200 OK
{
  "success": true,
  "data": { /* updated marks */ }
}
```

### 23. Release Marks to Student (Admin Only)
```
POST /marks/:marks_id/release
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "success": true,
  "message": "Marks released to student",
  "data": { /* updated marks */ }
}

Note: Sends notification to student
```

### 24. Get Marks for Session (Admin Only)
```
GET /sessions/:session_id/marks?reviewed=true&page=1&limit=50
Authorization: Bearer <admin_token>

Query Parameters:
- reviewed: true | false (filter by review status)
- page, limit

Response: 200 OK
{
  "success": true,
  "data": [ /* marks for all submissions */ ],
  "pagination": { /* pagination info */ },
  "stats": {
    "total_marked": 45,
    "average_marks": 17.5,
    "highest_marks": 20,
    "lowest_marks": 12
  }
}
```

---

## Dashboard/Analytics Endpoints

### 25. Get Dashboard Summary (Rep/Admin)
```
GET /dashboard/summary
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "active_sessions": 3,
    "total_submissions_this_week": 152,
    "pending_reviews": 47,
    "late_submissions": 8,
    "recent_sessions": [ /* 5 most recent */ ],
    "recent_submissions": [ /* 10 most recent */ ]
  }
}
```

### 26. Get Submission Analytics (Admin Only)
```
GET /analytics/submissions?date_from=2026-03-01&date_to=2026-03-26
Authorization: Bearer <admin_token>

Query Parameters:
- date_from, date_to: ISO dates
- subject_id, department_id: optional filters

Response: 200 OK
{
  "success": true,
  "data": {
    "total_sessions": 15,
    "total_submissions": 892,
    "submission_rate": 94.3,
    "on_time_rate": 98.2,
    "late_submissions": 16,
    "average_submission_time": "02:45:00",
    "by_department": [ /* breakdown */ ],
    "by_subject": [ /* breakdown */ ],
    "daily_trend": [ /* chart data */ ]
  }
}
```

### 27. Export Submissions (Admin Only)
```
POST /sessions/:session_id/export
Authorization: Bearer <admin_token>
Content-Type: application/json

Request:
{
  "format": "csv" | "excel" | "pdf",
  "include_marks": true,
  "include_feedback": true
}

Response: 200 OK with file
Content-Type: text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, or application/pdf
Content-Disposition: attachment; filename="submissions-session-uuid.csv"
```

---

## Notification Endpoints

### 28. List Notifications (Current User)
```
GET /notifications?is_read=false&page=1&limit=20
Authorization: Bearer <token>

Query Parameters:
- is_read: true | false | (all if omitted)
- type: filter by notification type
- page, limit

Response: 200 OK
{
  "success": true,
  "data": [ /* array of notifications */ ],
  "pagination": { /* pagination info */ }
}
```

### 29. Mark Notification as Read
```
PUT /notifications/:notification_id/mark-read
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Notification marked as read"
}
```

### 30. Mark All Notifications as Read
```
PUT /notifications/mark-all-read
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

## QR Code Endpoints

### 31. Validate QR Code
```
POST /qr/validate
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "qr_code": "https://smartlab.university.edu/submit?session=uuid-sess-001"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "session_id": "uuid-sess-001",
    "session_title": "Lab 1",
    "deadline": "2026-04-01T13:00:00Z",
    "is_valid": true,
    "is_expired": false,
    "status": "active"
  }
}

Error: 400 Bad Request if QR invalid or expired
```

---

## Error Codes Reference

| Code | HTTP | Description |
|------|------|-------------|
| INVALID_REQUEST | 400 | Missing or invalid request parameters |
| UNAUTHORIZED | 401 | Missing or invalid authentication token |
| FORBIDDEN | 403 | User doesn't have permission for this action |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Duplicate submission, duplicate email, etc. |
| UNPROCESSABLE_ENTITY | 422 | Validation error |
| RATE_LIMITED | 429 | Too many requests from this IP |
| INTERNAL_ERROR | 500 | Server error |

---

## Authentication Headers

All authenticated endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## API Documentation Tools

- **OpenAPI/Swagger**: Available at `/api/v1/docs`
- **Postman Collection**: Available for download in `/api/v1/postman`

