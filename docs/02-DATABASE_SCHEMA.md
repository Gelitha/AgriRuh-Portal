# Database Schema Design

## Overview
This document defines the relational database schema for the Smart Lab Submission & Evaluation System using PostgreSQL.

---

## Entity Relationship Diagram (ERD)

```
┌──────────────────────────┐
│         users            │
├──────────────────────────┤
│ id (PK)                  │
│ university_id (UNIQUE)   │
│ email (UNIQUE)           │
│ first_name               │
│ last_name                │
│ password_hash            │
│ role (enum)              │
│ department_id (FK)       │
│ is_active                │
│ last_login               │
│ created_at               │
│ updated_at               │
└──────────────────────────┘
         │
         │ one-to-many
         ├─────────────────────────┬────────────────────────┬──────────────────────┐
         ↓                         ↓                        ↓                      ↓
    ┌─────────────────┐  ┌─────────────────┐   ┌──────────────────┐  ┌──────────────────┐
    │   sessions      │  │  submissions    │   │   marks          │  │  notifications   │
    ├─────────────────┤  ├─────────────────┤   ├──────────────────┤  ├──────────────────┤
    │ id (PK)         │  │ id (PK)         │   │ id (PK)          │  │ id (PK)          │
    │ created_by (FK) │  │ session_id (FK) │   │ submission_id(FK)│  │ user_id (FK)     │
    │ subject_id (FK) │  │ student_id (FK) │   │ grader_id (FK)   │  │ type (enum)      │
    │ session_date    │  │ submission_time │   │ marks            │  │ title            │
    │ deadline        │  │ late_submission │   │ feedback         │  │ message          │
    │ late_window     │  │ status (enum)   │   │ is_reviewed      │  │ is_read          │
    │ qr_code_id (FK) │  │ location        │   │ penalty_applied  │  │ created_at       │
    │ status          │  │ device_info     │   │ created_at       │  │ updated_at       │
    │ is_active       │  │ created_at      │   │ updated_at       │  └──────────────────┘
    │ created_at      │  └─────────────────┘   └──────────────────┘
    │ updated_at      │
    └─────────────────┘
         │
         │ one-to-one
         ├─────────────────────────┐
         ↓                         ↓
    ┌─────────────────┐  ┌──────────────────┐
    │   qr_codes      │  │ departments      │
    ├─────────────────┤  ├──────────────────┤
    │ id (PK)         │  │ id (PK)          │
    │ code (UNIQUE)   │  │ name             │
    │ generated_at    │  │ code             │
    │ expiry_time     │  │ created_at       │
    │ is_active       │  │ updated_at       │
    │ created_at      │  └──────────────────┘
    └─────────────────┘

    ┌──────────────────┐
    │    subjects      │
    ├──────────────────┤
    │ id (PK)          │
    │ name             │
    │ code             │
    │ department_id(FK)│
    │ created_at       │
    │ updated_at       │
    └──────────────────┘
```

---

## Detailed Table Schemas

### 1. departments
Stores information about academic departments.

```sql
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_departments_code ON departments(code);
```

---

### 2. subjects
Stores information about academic subjects/courses.

```sql
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id),
    description TEXT,
    credits INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subjects_code ON subjects(code);
CREATE INDEX idx_subjects_department ON subjects(department_id);
```

---

### 3. users
Core user information with role-based access.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'representative', 'admin')),
    department_id UUID NOT NULL REFERENCES departments(id),
    phone VARCHAR(20),
    profile_picture_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_university_id ON users(university_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department_id);
```

---

### 4. qr_codes
Stores generated QR codes for sessions.

```sql
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(500) NOT NULL UNIQUE,  -- Encoded QR data
    qr_image_url TEXT,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    scan_count INT DEFAULT 0,
    last_scanned_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_qr_codes_code ON qr_codes(code);
CREATE INDEX idx_qr_codes_expires_at ON qr_codes(expires_at);
```

---

### 5. sessions
Stores lab submission sessions.

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES subjects(id),
    created_by UUID NOT NULL REFERENCES users(id),
    qr_code_id UUID REFERENCES qr_codes(id),
    
    -- Session Details
    session_title VARCHAR(255) NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Deadline Configuration
    submission_deadline TIMESTAMP NOT NULL,
    late_submission_window INT DEFAULT 0,  -- minutes
    late_submission_deadline TIMESTAMP,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Optional Features
    allow_location_restriction BOOLEAN DEFAULT FALSE,
    restricted_location_lat DECIMAL(10, 8),
    restricted_location_lng DECIMAL(11, 8),
    location_radius_meters INT DEFAULT 50,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_subject ON sessions(subject_id);
CREATE INDEX idx_sessions_created_by ON sessions(created_by);
CREATE INDEX idx_sessions_deadline ON sessions(submission_deadline);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_date ON sessions(session_date);
```

---

### 6. submissions
Stores individual student submissions.

```sql
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id),
    student_id UUID NOT NULL REFERENCES users(id),
    
    -- Submission Details
    submission_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Status Classification
    status VARCHAR(50) NOT NULL CHECK (status IN ('on_time', 'late', 'closed')) DEFAULT 'on_time',
    
    -- Optional Details
    file_url TEXT,
    file_name VARCHAR(255),
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    device_info JSONB,  -- e.g., {"userAgent": "...", "browser": "..."}
    
    -- Metadata
    submission_method VARCHAR(50) CHECK (submission_method IN ('qr_scan', 'manual_selection')),
    ip_address INET,
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint to prevent duplicate submissions
    UNIQUE(session_id, student_id)
);

CREATE INDEX idx_submissions_session ON submissions(session_id);
CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_time ON submissions(submission_time);
CREATE INDEX idx_submissions_session_student ON submissions(session_id, student_id);
```

---

### 7. marks
Stores marks and feedback for submissions.

```sql
CREATE TABLE marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) UNIQUE,
    grader_id UUID NOT NULL REFERENCES users(id),
    
    -- Marks
    total_marks DECIMAL(5, 2) NOT NULL,
    obtained_marks DECIMAL(5, 2),
    marks_percentage DECIMAL(5, 2),
    
    -- Feedback
    feedback TEXT,
    comments JSONB,  -- e.g., {"rubric_points": [...]}
    
    -- Penalty System
    late_penalty_percentage DECIMAL(5, 2) DEFAULT 0,
    late_penalty_amount DECIMAL(5, 2),
    final_marks DECIMAL(5, 2),  -- after penalties
    
    -- Review Status
    is_reviewed BOOLEAN DEFAULT FALSE,
    reviewed_at TIMESTAMP,
    visibility_to_student BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_marks_submission ON marks(submission_id);
CREATE INDEX idx_marks_grader ON marks(grader_id);
CREATE INDEX idx_marks_reviewed ON marks(is_reviewed);
```

---

### 8. notifications
Stores user notifications.

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Notification Details
    type VARCHAR(50) NOT NULL CHECK (type IN ('submission_received', 'marks_released', 'session_created', 'deadline_reminder')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- References
    related_session_id UUID REFERENCES sessions(id),
    related_submission_id UUID REFERENCES submissions(id),
    related_marks_id UUID REFERENCES marks(id),
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);
```

---

### 9. audit_logs
Tracks important system actions for compliance and auditing.

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

---

### 10. sessions_attendees (Optional - For Advanced Features)
Maps students to sessions (for class rosters).

```sql
CREATE TABLE sessions_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id),
    student_id UUID NOT NULL REFERENCES users(id),
    
    is_expected BOOLEAN DEFAULT TRUE,  -- Is this student supposed to submit?
    attendance_marked BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(session_id, student_id)
);

CREATE INDEX idx_sessions_attendees_session ON sessions_attendees(session_id);
CREATE INDEX idx_sessions_attendees_student ON sessions_attendees(student_id);
```

---

## Key Design Decisions

### 1. UUID Primary Keys
- **Reason**: Better security (non-sequential), easier sharding, privacy
- **Implementation**: PostgreSQL's `gen_random_uuid()`

### 2. JSONB for Flexible Data
- `device_info`: Stores browser, OS, device type without schema changes
- `comments`: Stores structured feedback/rubric points
- `old_values`, `new_values`: Audit trail flexibility

### 3. Timestamp Fields
- All tables have `created_at` and `updated_at`
- Enables audit trails and sorting by recency

### 4. UNIQUE Constraints
- `submissions(session_id, student_id)`: Prevents duplicate submissions
- `qr_codes(code)`: Ensures unique QR codes
- `users(university_id, email)`: Ensures unique identities

### 5. Indexing Strategy
- Composite indexes for common WHERE + JOIN patterns
- Indexes on foreign keys for JOIN performance
- Indexes on frequently filtered fields (status, created_at, is_read)

### 6. Status Enums
- Enforced at database level using CHECK constraints
- Prevents invalid state transitions
- Examples: `('on_time', 'late', 'closed')`, `('draft', 'active', 'closed', 'archived')`

### 7. Location Support
- Latitude/Longitude stored as DECIMAL for accuracy
- Radius in meters for geofencing (5-1000m typical)
- Optional feature (nullable columns)

---

## Data Integrity Constraints

### NOT NULL Constraints
- Core fields: `university_id`, `email`, `password_hash`, `role`
- Session fields: `session_date`, `submission_deadline`
- Submission fields: `session_id`, `student_id`, `submission_time`

### Foreign Key Constraints
- WITH CASCADE DELETE on: `audit_logs`
- WITH RESTRICT on: `sessions`, `submissions`, `marks` (prevents accidental deletion)

### Check Constraints
- Role values: `('student', 'representative', 'admin')`
- Status values: Spelled out in each table
- Date logic: `submission_deadline > session_date`

---

## Partitioning Strategy (for large scale)

```sql
-- Partition submissions table by month
CREATE TABLE submissions_2026_01 PARTITION OF submissions
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE submissions_2026_02 PARTITION OF submissions
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
    
-- Continues for each month
```

**Benefit**: Faster queries on recent data, easier archival of old records.

---

## Migration & Versioning

Version: 1.0
Date: 2026-03-26

**Future Versions:**
- 1.1: Add `exam_type` field to sessions
- 1.2: Add plagiarism detection fields
- 2.0: Blockchain integration for immutable records

