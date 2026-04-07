# Implementation Guide & Code Examples

## Quick Reference for Developers

This document provides code patterns and examples for implementing key features of the Smart Lab Submission & Evaluation System.

---

## 1. Authentication Flow Implementation

### Backend: Login Endpoint

```javascript
// backend/src/controllers/authController.js
const AuthService = require('../services/AuthService');

class AuthController {
  static async login(req, res) {
    try {
      const { university_id, password } = req.body;

      // Validate input
      if (!university_id || !password) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'University ID and password are required',
          },
        });
      }

      // Call service
      const result = await AuthService.login(university_id, password);

      res.json({
        success: true,
        data: result,
        message: 'Login successful',
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }
  }

  static async refreshToken(req, res) {
    try {
      const { refresh_token } = req.body;

      const result = await AuthService.refreshToken(refresh_token);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }
  }
}

module.exports = AuthController;
```

### Frontend: Login Page Implementation

```javascript
// frontend/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuth from '../hooks/useAuth';

const LoginPage = () => {
  const navigate = useNavigate();
  const { setUser, setTokens } = useAuth();
  const [formData, setFormData] = useState({
    university_id: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.university_id || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);

      const response = await api.post('/auth/login', formData);

      // Store tokens
      const { access_token, refresh_token, user } = response.data.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      setTokens({ access_token, refresh_token });
      setUser(user);

      // Redirect based on role
      switch (user.role) {
        case 'student':
          navigate('/student/dashboard');
          break;
        case 'representative':
          navigate('/rep/dashboard');
          break;
        case 'admin':
          navigate('/admin/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message || 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=\"login-page\">
      <div className=\"login-container\">
        <h1>SmartLab</h1>
        <p>Lab Submission System</p>

        <form onSubmit={handleSubmit}>
          {error && <div className=\"alert alert-error\">{error}</div>}

          <div className=\"form-group\">
            <label htmlFor=\"university_id\">University ID / Email</label>
            <input
              type=\"text\"
              id=\"university_id\"
              name=\"university_id\"
              value={formData.university_id}
              onChange={handleInputChange}
              placeholder=\"CSE-20210001\"
              disabled={loading}
            />
          </div>

          <div className=\"form-group\">
            <label htmlFor=\"password\">Password</label>
            <input
              type=\"password\"
              id=\"password\"
              name=\"password\"
              value={formData.password}
              onChange={handleInputChange}
              placeholder=\"Enter your password\"
              disabled={loading}
            />
          </div>

          <button
            type=\"submit\"
            className=\"btn btn-primary btn-block\"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className=\"footer-text\">
          Forgot password? <a href=\"#\">Reset here</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
```

---

## 2. Session Creation & QR Code Generation

### Backend: Create Session Endpoint

```javascript
// backend/src/controllers/sessionController.js
const SessionService = require('../services/SessionService');
const QRCodeService = require('../services/QRCodeService');

class SessionController {
  static async createSession(req, res) {
    try {
      const {
        subject_id,
        session_title,
        session_date,
        start_time,
        end_time,
        submission_deadline,
        late_submission_window = 0,
        notes,
      } = req.body;

      const user_id = req.user.id;

      // Validate input
      if (!subject_id || !session_title || !submission_deadline) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required fields',
          },
        });
      }

      // Create session
      const session = await SessionService.createSession({
        subject_id,
        created_by: user_id,
        session_title,
        session_date,
        start_time,
        end_time,
        submission_deadline,
        late_submission_window,
        notes,
      });

      // Generate QR code
      const qr_code = await QRCodeService.generateQRCode(session.id);

      // Link QR code to session
      session.qr_code_id = qr_code.id;
      await session.save();

      res.status(201).json({
        success: true,
        data: {
          ...session.toJSON(),
          qr_code: qr_code.toJSON(),
        },
        message: 'Session created successfully',
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }
  }
}

module.exports = SessionController;
```

### Frontend: Create Session Form

```javascript
// frontend/src/pages/CreateSessionPage.jsx
import React, { useState } from 'react';
import api from '../services/api';

const CreateSessionPage = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject_id: '',
    session_title: '',
    session_date: '',
    start_time: '',
    end_time: '',
    submission_deadline: '',
    late_submission_window: 0,
    notes: '',
  });
  const [createdSession, setCreatedSession] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);

      const response = await api.post('/sessions', formData);

      setCreatedSession(response.data.data);

      // Show success message
      // Optionally show QR code for display/printing
    } catch (err) {
      setError(
        err.response?.data?.error?.message || 'Failed to create session'
      );
    } finally {
      setLoading(false);
    }
  };

  if (createdSession) {
    return (
      <div className=\"session-created\">
        <h2>✅ Session Created Successfully!</h2>

        <div className=\"qr-display\">
          <h3>QR Code for {createdSession.session_title}</h3>
          <img
            src={createdSession.qr_code.qr_image_url}
            alt=\"Session QR Code\"
            className=\"qr-image\"
          />
          <p>Session ID: {createdSession.id}</p>
        </div>

        <div className=\"action-buttons\">
          <button onClick={() => window.print()}>🖨️ Print QR</button>
          <button onClick={() => displayOnScreen()}>📺 Display on Screen</button>
          <button onClick={() => copyToClipboard()}>📋 Copy Link</button>
        </div>
      </div>
    );
  }

  return (
    <div className=\"create-session-page\">
      <h1>Create New Lab Session</h1>

      <form onSubmit={handleSubmit}>
        {error && <div className=\"alert alert-error\">{error}</div>}

        <div className=\"form-group\">
          <label>Subject</label>
          <select
            name=\"subject_id\"
            value={formData.subject_id}
            onChange={handleInputChange}
            required
          >
            <option value=\"\">Select a subject</option>
            {/* Populate from API */}
          </select>
        </div>

        <div className=\"form-group\">
          <label>Lab Title</label>
          <input
            type=\"text\"
            name=\"session_title\"
            value={formData.session_title}
            onChange={handleInputChange}
            placeholder=\"Lab 1: Introduction to Algorithms\"
            required
          />
        </div>

        <div className=\"form-row\">
          <div className=\"form-group\">
            <label>Session Date</label>
            <input
              type=\"date\"
              name=\"session_date\"
              value={formData.session_date}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className=\"form-group\">
            <label>Start Time</label>
            <input
              type=\"time\"
              name=\"start_time\"
              value={formData.start_time}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className=\"form-group\">
            <label>End Time</label>
            <input
              type=\"time\"
              name=\"end_time\"
              value={formData.end_time}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className=\"form-group\">
          <label>Submission Deadline</label>
          <input
            type=\"datetime-local\"
            name=\"submission_deadline\"
            value={formData.submission_deadline}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className=\"form-group\">
          <label>
            <input
              type=\"checkbox\"
              checked={formData.late_submission_window > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  setFormData(prev => ({
                    ...prev,
                    late_submission_window: 60,
                  }));
                } else {
                  setFormData(prev => ({
                    ...prev,
                    late_submission_window: 0,
                  }));
                }
              }}
            />
            Allow Late Submissions
          </label>

          {formData.late_submission_window > 0 && (
            <input
              type=\"number\"
              name=\"late_submission_window\"
              value={formData.late_submission_window}
              onChange={handleInputChange}
              placeholder=\"Minutes\"
              min=\"1\"
              max=\"1440\"
            />
          )}
        </div>

        <div className=\"form-group\">
          <label>Notes (Optional)</label>
          <textarea
            name=\"notes\"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder=\"Any additional notes for students...\"
          />
        </div>

        <button
          type=\"submit\"
          className=\"btn btn-primary btn-lg\"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Session & Generate QR'}
        </button>
      </form>
    </div>
  );
};

export default CreateSessionPage;
```

---

## 3. Submission Handler Implementation

### API Route Handler

```javascript
// backend/src/routes/submissions.js
const express = require('express');
const router = express.Router();
const { verifyToken, requireStudent } = require('../middleware/authMiddleware');
const SubmissionController = require('../controllers/submissionController');

// Create submission (Student)
router.post(
  '/',
  verifyToken,
  requireStudent,
  SubmissionController.createSubmission
);

// Get student's submissions
router.get(
  '/my-submissions',
  verifyToken,
  requireStudent,
  SubmissionController.getMySubmissions
);

// Get submission details
router.get(
  '/:submission_id',
  verifyToken,
  SubmissionController.getSubmission
);

// Get session submissions (Rep/Admin)
router.get(
  '/session/:session_id',
  verifyToken,
  SubmissionController.getSessionSubmissions
);

module.exports = router;
```

### Controller Implementation

```javascript
// backend/src/controllers/submissionController.js
const SubmissionService = require('../services/SubmissionService');

class SubmissionController {
  static async createSubmission(req, res) {
    try {
      const {
        session_id,
        submission_method,
      } = req.body;

      const student_id = req.user.id;
      const ip_address = req.ip;
      const device_info = {
        userAgent: req.headers['user-agent'],
        timestamp: new Date(),
      };

      // Create submission
      const submission = await SubmissionService.createSubmission({
        session_id,
        student_id,
        submission_method,
        device_info,
        ip_address,
      });

      // Send confirmation email (queued background job)
      // sendConfirmationEmail(student_id, submission);

      res.status(201).json({
        success: true,
        data: submission,
        message: '✅ Submission successful',
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }
  }

  static async getMySubmissions(req, res) {
    try {
      const student_id = req.user.id;
      const { limit = 20, offset = 0 } = req.query;

      const result = await SubmissionService.getStudentSubmissions(
        student_id,
        { limit: parseInt(limit), offset: parseInt(offset) }
      );

      res.json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }
}

module.exports = SubmissionController;
```

---

## 4. Real-Time Dashboard Updates (WebSocket)

### Backend WebSocket Handler

```javascript
// backend/src/websocket/submissionHandler.js
const io = require('socket.io');

function setupSubmissionWebSocket(io) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join session room
    socket.on('join-session', (session_id) => {
      socket.join(`session:${session_id}`);
      console.log(`User joined session: ${session_id}`);
    });

    // Leave session room
    socket.on('leave-session', (session_id) => {
      socket.leave(`session:${session_id}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

// Emit event when new submission arrives
function broadcastNewSubmission(submission) {
  io.to(`session:${submission.session_id}`).emit('new-submission', {
    submission,
    timestamp: new Date(),
  });
}

module.exports = { setupSubmissionWebSocket, broadcastNewSubmission };
```

### Frontend WebSocket Handler

```javascript
// frontend/src/hooks/useSessionUpdates.js
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const useSessionUpdates = (session_id) => {
  const [submissions, setSubmissions] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(process.env.REACT_APP_API_URL, {
      auth: {
        token: localStorage.getItem('access_token'),
      },
    });

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-session', session_id);
    });

    socket.on('new-submission', (data) => {
      setSubmissions(prev => [data.submission, ...prev]);
      // Update UI in real-time
    });

    return () => {
      socket.emit('leave-session', session_id);
      socket.disconnect();
    };
  }, [session_id]);

  return { submissions, connected };
};

export default useSessionUpdates;
```

---

## 5. Error Handling & Validation

### Request Validation Middleware

```javascript
// backend/src/middleware/validationMiddleware.js
const { body, validationResult, query } = require('express-validator');

const validateSubmissionRequest = [
  body('session_id')
    .isUUID()
    .withMessage('Invalid session ID'),
  body('submission_method')
    .isIn(['qr_scan', 'manual_selection'])
    .withMessage('Invalid submission method'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array(),
        },
      });
    }
    next();
  },
];

const validateSessionCreation = [
  body('subject_id').isUUID().withMessage('Invalid subject ID'),
  body('session_title')
    .isString()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Session title must be between 3 and 255 characters'),
  body('submission_deadline')
    .isISO8601()
    .withMessage('Invalid deadline format'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array(),
        },
      });
    }
    next();
  },
];

module.exports = {
  validateSubmissionRequest,
  validateSessionCreation,
};
```

---

## 6. API Response Interceptor (Frontend)

```javascript
// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000,
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle token refresh and errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle token expiry
    if (
      error.response?.status === 401 &&
      error.response?.data?.error?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await api.post('/auth/refresh-token', {
          refresh_token: refreshToken,
        });

        const { access_token } = response.data.data;
        localStorage.setItem('access_token', access_token);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## 7. Database Migrations

### Initial Schema Migration

```bash
# Run migrations
npm run migrate

# Rollback migrations
npm run migrate:rollback

# Create new migration
npm run migrate:create CreateSessionsTable
```

### Migration File Example

```javascript
// database/migrations/001-init-schema.js
module.exports = {
  up: async (sequelize) => {
    const transaction = await sequelize.transaction();

    try {
      // Create organizations first
      await sequelize.query(`
        CREATE TABLE departments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          code VARCHAR(50) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `, { transaction });

      // Create users table
      await sequelize.query(`
        CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          university_id VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL,
          department_id UUID NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (department_id) REFERENCES departments(id)
        );
      `, { transaction });

      // Create more tables...

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (sequelize) => {
    const transaction = await sequelize.transaction();

    try {
      // Drop tables in reverse order
      await sequelize.query('DROP TABLE IF EXISTS users;', { transaction });
      await sequelize.query('DROP TABLE IF EXISTS departments;', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
```

---

## 8. Testing Examples

### Backend Unit Test

```javascript
// backend/__tests__/services/SubmissionService.test.js
const SubmissionService = require('../../src/services/SubmissionService');
const Session = require('../../src/models/Session');

describe('SubmissionService', () => {
  describe('createSubmission', () => {
    it('should create a submission when session is active', async () => {
      const mockData = {
        session_id: 'session-uuid',
        student_id: 'student-uuid',
        submission_method: 'qr_scan',
      };

      const result = await SubmissionService.createSubmission(mockData);

      expect(result).toHaveProperty('id');
      expect(result.status).toBe('on_time');
    });

    it('should throw error if session not found', async () => {
      const mockData = {
        session_id: 'invalid-uuid',
        student_id: 'student-uuid',
      };

      await expect(
        SubmissionService.createSubmission(mockData)
      ).rejects.toThrow('SESSION_NOT_FOUND');
    });

    it('should prevent duplicate submissions', async () => {
      // Test duplicate prevention
    });
  });
});
```

### Frontend Component Test

```javascript
// frontend/__tests__/pages/StudentDashboard.test.jsx
import { render, screen } from '@testing-library/react';
import StudentDashboard from '../../src/pages/StudentDashboard';

describe('StudentDashboard', () => {
  it('should render welcome message', () => {
    render(<StudentDashboard />);
    expect(screen.getByText(/Welcome/i)).toBeInTheDocument();
  });

  it('should show scan QR button', () => {
    render(<StudentDashboard />);
    expect(screen.getByRole('button', { name: /Scan QR/i })).toBeInTheDocument();
  });
});
```

---

## Best Practices & Patterns

### 1. Error Handling Pattern

```javascript
// Always include status, code, and message
throw {
  status: 400,
  code: 'SPECIFIC_ERROR_CODE',
  message: 'User-friendly message',
  details: { /* optional details */ }
};
```

### 2. Service Layer Pattern

```javascript
// Services handle business logic
class MyService {
  static async doSomething(input) {
    // Validate input
    // Access database
    // Handle errors
    // Return result
  }
}
```

### 3. Controller Pattern

```javascript
// Controllers handle HTTP requests
class MyController {
  static async handleRequest(req, res) {
    try {
      const result = await MyService.doSomething(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(error.status).json({ success: false, error: { ... } });
    }
  }
}
```

### 4. Frontend Hook Pattern

```javascript
// Custom hooks for logic reuse
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(url).then(res => setData(res.data));
  }, [url]);

  return { data, loading };
}
```

---

## Deployment Checklist

- [ ] Run all tests
- [ ] Build Docker images
- [ ] Test in staging environment
- [ ] Database backup created
- [ ] SSL certificate installed
- [ ] Environment variables set
- [ ] Monitoring/alerting configured
- [ ] Load testing passed
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Team trained on deployment

---

This implementation guide provides complete examples to get started. Refer back to these patterns when building features!

