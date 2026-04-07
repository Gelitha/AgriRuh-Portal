# SmartLab System - Quick Start Guide

## ✨ Status: Database Integration Complete! 

All API routes now connected to real Sequelize models with SQLite database (no external DB needed!).

---

## 🚀 **5-Minute Setup**

### Step 1: Install Dependencies (if not already done)
```bash
cd "d:\Attendance system\backend"
npm install

cd "d:\Attendance system\frontend"
npm install
```

### Step 2: Seed Database with Test Data
```bash
cd "d:\Attendance system\backend"
npm run seed
```

This creates:
- ✅ demo accounts for admin, lecturer, demonstrator, representative, and student roles
- ✅ active and closed lab sessions with QR records
- ✅ attendance confirmations, submissions, and grading history
- ✅ All ready for testing!

**Test Credentials** (after seeding):
```
Admin:          admin.portal@agri.demo / Demo@123
Lecturer:       lecturer.crop@agri.demo / Demo@123
Demonstrator:   demo.soil@agri.demo / Demo@123
Representative: rep.batch47@agri.demo / Demo@123
Student:        anudi.peiris@agri.demo / Demo@123
```

### Step 3: Start Backend Server
```bash
cd "d:\Attendance system\backend"
npm run dev
```

You should see:
```
✅ SmartLab Backend Server Running
🚀 Server: http://localhost:5000
📚 Health Check: http://localhost:5000/api/health
🗄️  Database: Connected and Synced
Environment: development
```

### Step 4: Start Frontend (in another terminal)
```bash
cd "d:\Attendance system\frontend"
npm run dev
```

Open browser: **http://localhost:5173**

---

## 📡 **API Endpoints Ready to Use**

### ✅ Authentication
```bash
# Register
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "newuser@test.edu",
  "password": "secure123",
  "first_name": "Test",
  "last_name": "User",
  "university_id": "TEST-001",
  "department_id": "cse",
  "role": "student"
}

# Login
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "anudi.peiris@agri.demo",
  "password": "Demo@123"
}
```

### ✅ Sessions
```bash
# Get all active sessions
GET http://localhost:5000/api/sessions

# Get specific session
GET http://localhost:5000/api/sessions/{session_id}

# Create new session (admin)
POST http://localhost:5000/api/sessions
Content-Type: application/json

{
  "subject": "Advanced Algorithms",
  "session_title": "Lab 3: Dynamic Programming",
  "submission_deadline": "2026-04-02T23:59:59Z",
  "late_submission_deadline": "2026-04-04T23:59:59Z"
}
```

### ✅ Submissions
```bash
# Get user's submissions
GET http://localhost:5000/api/my-submissions

# Submit lab
POST http://localhost:5000/api/submissions
Content-Type: application/json

{
  "session_id": "{session_id}",
  "student_id": "{user_id}",
  "device_info": {
    "platform": "web",
    "browser": "Chrome",
    "os": "Windows"
  },
  "ip_address": "192.168.1.100"
}

# Get submission details
GET http://localhost:5000/api/submissions/{submission_id}
```

### ✅ QR Code Validation
```bash
# Validate QR code
POST http://localhost:5000/api/qr/validate
Content-Type: application/json

{
  "qr_code": "http://localhost:5000/submit?session={session_id}"
}
```

### ✅ User & Dashboard
```bash
# Get current user
GET http://localhost:5000/api/users/me

# Get dashboard summary
GET http://localhost:5000/api/dashboard/summary
```

---

## 🔧 **Testing with cURL**

### Test Health Check
```bash
curl http://localhost:5000/api/health
```

Expected Response:
```json
{
  "status": "ok",
  "uptime": 12.345,
  "environment": "development",
  "timestamp": "2026-03-26T....."
}
```

### Test Get Sessions
```bash
curl http://localhost:5000/api/sessions
```

### Test Login and Get Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "anudi.peiris@agri.demo",
    "password": "Demo@123"
  }'
```

---

## 📊 **Database Details**

### File-Based SQLite
- **Location**: `backend/smartlab.db` (auto-created)
- **No setup needed** - works out of the box!
- **Perfect for**: Development, testing, demos

### Models Synced Automatically
When you run the server, it automatically:
1. ✅ Connects to SQLite database
2. ✅ Creates all tables (users, sessions, submissions, qrcodes, marks)
3. ✅ Sets up relationships and constraints
4. ✅ Applies index optimization

### To Reset Database
```bash
# Option 1: Delete the database file
rm backend/smartlab.db

# Run the seed script again
npm run seed

# Option 2: Force sync with force:true
# Edit backend/src/server.js line that calls syncDatabase(true)
```

---

## 🎯 **Feature Status**

| Feature | Status | Notes |
|---------|--------|-------|
| **User Authentication** | ✅ Ready | JWT tokens, password hashing |
| **Session Management** | ✅ Ready | Create, list, get sessions |
| **QR Code Scanning** | ✅ Ready | Generate, validate, track scans |
| **Submissions** | ✅ Ready | Duplicate prevention, status tracking |
| **Marks & Grading** | ✅ Ready | Release control, feedback |
| **Database Persistence** | ✅ Ready | SQLite (or PostgreSQL) |
| **Email Notifications** | 🔄 Ready to build | Service template exists |
| **Admin Dashboard** | 🔄 Ready to build | Routes prepared |
| **Analytics** | 🔄 Ready to build | Data model supports it |

---

## 🚨 **Troubleshooting**

### Port Already in Use
```bash
# Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID {PID} /F

# Or use different port
PORT=5001 npm run dev
```

### Database File Permissions
If `smartlab.db` is read-only:
```bash
# Delete and reseed
rm backend/smartlab.db
npm run seed
```

### Module Not Found Errors
```bash
# Ensure all dependencies installed
cd backend && npm install
cd ../frontend && npm install
```

### Frontend Can't Connect to Backend
- Check backend is running on http://localhost:5000
- Check FRONTEND_URL in backend/.env (should be http://localhost:5173)
- Check frontend api.js points to http://localhost:5000

---

## 📁 **Project Structure**

```
d:\Attendance system\
├── backend/
│   ├── src/
│   │   ├── server.js          ← Main Express app (DATABASE INTEGRATED!)
│   │   ├── config/
│   │   │   └── database.js    ← SQLite/Postgres config
│   │   ├── models/            ← Sequelize models
│   │   │   ├── User.js
│   │   │   ├── Session.js
│   │   │   ├── Submission.js
│   │   │   ├── QRCode.js
│   │   │   ├── Marks.js
│   │   │   └── index.js       ← Associations
│   │   └── services/
│   │       └── AuthService.js ← Auth logic
│   ├── database/
│   │   ├── seed.js            ← Test data
│   │   └── migrate.js
│   ├── .env                   ← Configuration
│   ├── package.json
│   └── smartlab.db            ← SQLite database (auto-created)
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── QRScanner.jsx
│   │   │   └── ...
│   │   ├── services/
│   │   │   └── api.js         ← Axios config (INTEGRATED)
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
└── docs/
    ├── ARCHITECTURE.md
    ├── IMPLEMENTATION_STEPS.md
    └── QUICK_START.md (this file)
```

---

## ✨ **What's Next?**

After verifying the system works:

1. **Add Email Notifications**
   - File ready: `backend/src/services/EmailService.js`
   - Configure SMTP in `.env`
   - Send confirmation emails on submission

2. **Build Admin Dashboard**
   - Session creation form
   - Submission grading interface
   - Marks release controls

3. **Generate Real QR Codes**
   - QRCode service ready
   - Configure AWS S3 for storage
   - Use in production

4. **Analytics & Reporting**
   - Query data from database
   - Export CSV/PDF reports
   - Department-wise analytics

5. **Deploy to Cloud**
   - Docker containerize
   - Use PostgreSQL in production
   - Deploy to AWS/Heroku/DigitalOcean

---

## 🎓 **Tutorial: Test Complete Flow**

### 1. Register a Student
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@test.edu",
    "password": "secure123",
    "first_name": "Alice",
    "last_name": "Wonder",
    "university_id": "TEST-002",
    "department_id": "cse",
    "role": "student"
  }'
```

### 2. Login as Student
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@test.edu",
    "password": "secure123"
  }'
```

Save the `access_token` from response.

### 3. View All Sessions
```bash
curl http://localhost:5000/api/sessions
```

Grab a `session_id` from response.

### 4. Submit to a Session
```bash
curl -X POST http://localhost:5000/api/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "{session_id_from_step_3}",
    "student_id": "{user_id_from_login}",
    "device_info": {
      "platform": "mobile",
      "browser": "Safari",
      "os": "iOS"
    },
    "ip_address": "192.168.1.102"
  }'
```

### 5. Check Your Submissions
```bash
curl http://localhost:5000/api/my-submissions
```

### 6. Check Dashboard
```bash
curl http://localhost:5000/api/dashboard/summary
```

---

## 💡 **Pro Tips**

- **Live Reload**: Already enabled with `nodemon` in backend
- **Hot Module Reload**: Frontend has Vite's HMR
- **Debug Logging**: Set `NODE_ENV=development` to see SQL queries
- **Production Deploy**: Use `npm start` instead of `npm run dev`
- **Multiple Databases**: Change `DB_DIALECT` in `.env` to switch between SQLite/PostgreSQL

---

**Happy Coding! 🚀**

For complex features, check ARCHITECTURE.md and IMPLEMENTATION_STEPS.md
