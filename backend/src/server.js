import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Op, QueryTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import sequelize, { testConnection, syncDatabase } from './config/database.js';
import { User, Session, Submission, QRCode, Marks, AttendanceSubmission } from './models/index.js';
import AuthService from './services/AuthService.js';
import QRCodeService from './services/QRCodeService.js';
import { seedDatabase } from '../database/seed.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const GLOBAL_ACCESS_ROLES = ['admin'];
const DEPARTMENT_SCOPED_ROLES = ['lecturer', 'demonstrator'];
const STUDENT_LEADER_ROLES = ['representative'];
const ADMIN_WORKSPACE_ROLES = [...GLOBAL_ACCESS_ROLES, ...DEPARTMENT_SCOPED_ROLES];
const ROLE_OPTIONS = ['student', 'representative', 'lecturer', 'demonstrator', 'admin'];
const BATCH_OPTIONS = ['44', '45', '46', '47', '48'];
const SEMESTER_OPTIONS = ['Semester 1', 'Semester 2'];
const ATTENDANCE_MODE_OPTIONS = ['individual', 'representative_batch'];
const STAFF_WORKSPACE_ROLES = ['admin', 'lecturer', 'demonstrator'];
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const SEED_ON_START = String(process.env.SEED_ON_START || 'false').toLowerCase() === 'true';
const DEPARTMENTS_TABLE = 'departments';

const getDepartments = async () => sequelize.query(
  `SELECT id, name FROM ${DEPARTMENTS_TABLE} ORDER BY name ASC`,
  { type: QueryTypes.SELECT }
);

const buildDepartmentMap = async () => {
  const departments = await getDepartments();
  return departments.reduce((acc, department) => {
    acc[department.id] = department.name;
    return acc;
  }, {});
};

const enrichSession = (session, departmentMap) => ({
  ...session.toJSON(),
  department_name: departmentMap[session.department_id] || session.department_id,
  lab_name: session.session_title,
  date: session.submission_deadline
});

const hasGlobalDepartmentAccess = (user) => GLOBAL_ACCESS_ROLES.includes(user?.role);
const hasDepartmentScopedAccess = (user) => DEPARTMENT_SCOPED_ROLES.includes(user?.role);
const isRepresentative = (user) => STUDENT_LEADER_ROLES.includes(user?.role);
const isStudentScopedRole = (role) => ['student', 'representative'].includes(role);
const normalizeDepartmentId = (value, fallback = 'BL') => {
  const normalized = String(value || fallback).trim().toUpperCase();
  return normalized || fallback;
};

const normalizeBatch = (value, fallback = 'all') => {
  const normalized = String(value ?? fallback).trim();

  if (!normalized) {
    return fallback;
  }

  if (normalized.toLowerCase() === 'all') {
    return 'all';
  }

  return BATCH_OPTIONS.includes(normalized) ? normalized : fallback;
};

const normalizeSemester = (value, fallback = 'Semester 1') => {
  const normalized = String(value || fallback).trim();
  return SEMESTER_OPTIONS.includes(normalized) ? normalized : fallback;
};

const normalizeAttendanceMode = (value, fallback = 'individual') => {
  const normalized = String(value || fallback).trim();
  return ATTENDANCE_MODE_OPTIONS.includes(normalized) ? normalized : fallback;
};

const generateRecoveryKey = () => {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = Array.from({ length: 3 }, () => (
    Array.from({ length: 4 }, () => charset[Math.floor(Math.random() * charset.length)]).join('')
  ));

  return `AGR-${segments.join('-')}`;
};

let mailTransporter;

const getMailTransporter = () => {
  if (mailTransporter) {
    return mailTransporter;
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  mailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return mailTransporter;
};

const sendPasswordResetEmail = async ({ email, name, resetLink }) => {
  const transporter = getMailTransporter();

  if (!transporter) {
    console.warn(`SMTP is not configured. Password reset link for ${email}: ${resetLink}`);
    return false;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'AgriRuh Portal password reset',
    text: `Hello ${name || 'user'},\n\nUse this link to reset your password:\n${resetLink}\n\nThis link expires in 30 minutes.\n\nIf you did not request this, you can ignore this email.`,
    html: `
      <p>Hello ${name || 'user'},</p>
      <p>Use the link below to reset your AgriRuh Portal password:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>This link expires in 30 minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
    `
  });

  return true;
};

const normalizeEnrollmentList = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry, index) => {
      if (typeof entry === 'string') {
        const label = entry.trim();
        return label ? { id: `entry-${index + 1}`, name: label } : null;
      }

      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const id = String(entry.id || entry.university_id || `entry-${index + 1}`).trim();
      const name = String(entry.name || entry.full_name || entry.label || '').trim();

      if (!id && !name) {
        return null;
      }

      return {
        id: id || `entry-${index + 1}`,
        name: name || id || `Student ${index + 1}`
      };
    })
    .filter(Boolean);
};

const getAccessibleDepartmentId = (user, requestedDepartmentId) => (
  hasGlobalDepartmentAccess(user)
    ? normalizeDepartmentId(requestedDepartmentId, user?.department_id || 'BL')
    : normalizeDepartmentId(user?.department_id || requestedDepartmentId || 'BL')
);

const getScopedSessionWhere = (user, requestedDepartmentId = 'all') => {
  if (hasDepartmentScopedAccess(user)) {
    return { department_id: normalizeDepartmentId(user.department_id) };
  }

  if (requestedDepartmentId && requestedDepartmentId !== 'all') {
    return { department_id: normalizeDepartmentId(requestedDepartmentId) };
  }

  return {};
};

const ensureSubmissionAccess = (user, submission) => {
  if (hasGlobalDepartmentAccess(user)) {
    return null;
  }

  if (
    hasDepartmentScopedAccess(user)
    && normalizeDepartmentId(submission?.session?.department_id) !== normalizeDepartmentId(user.department_id)
  ) {
    return {
      success: false,
      error: { code: 'FORBIDDEN', message: 'You can only manage submissions in your department' }
    };
  }

  return null;
};

const ensureRepresentativeSessionAccess = (user, session) => {
  if (!isRepresentative(user)) {
    return {
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only representatives can access this workflow' }
    };
  }

  if (!session || normalizeAttendanceMode(session.attendance_mode) !== 'representative_batch') {
    return {
      success: false,
      error: { code: 'INVALID_ATTENDANCE_MODE', message: 'This session is not configured for representative attendance confirmation' }
    };
  }

  const userBatch = normalizeBatch(user.batch, '47');
  const sessionBatch = normalizeBatch(session.batch);
  if (sessionBatch !== 'all' && sessionBatch !== userBatch) {
    return {
      success: false,
      error: { code: 'FORBIDDEN', message: 'You can only confirm attendance for your batch' }
    };
  }

  return null;
};

const toCsv = (rows) => {
  if (!rows.length) {
    return '';
  }

  const headers = Object.keys(rows[0]);
  const escape = (value) => {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))
  ].join('\n');
};

const parseSessionDate = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const normalized = typeof value === 'string' && !value.endsWith('Z')
    ? `${value}:00`
    : value;
  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeSessionDateInput = (value) => {
  const parsed = parseSessionDate(value);
  return parsed ? parsed.toISOString() : null;
};

const getSessionAvailability = (session, now = new Date()) => {
  const openAt = parseSessionDate(session.available_from) || parseSessionDate(session.created_at) || now;
  const closeAt = parseSessionDate(session.submission_deadline);

  if (!closeAt) {
    return 'closed';
  }

  if (now < openAt) {
    return 'scheduled';
  }

  if (now > closeAt) {
    return 'closed';
  }

  return 'open';
};

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.slice(7);
};

const requireAuth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: 'MISSING_TOKEN', message: 'Authorization token is missing' }
      });
    }

    const decoded = AuthService.verifyToken(token);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_USER', message: 'Authenticated user not found' }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(error.status || 401).json({
      success: false,
      error: { code: error.code || 'INVALID_TOKEN', message: error.message || 'Invalid authentication token' }
    });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: `Access denied. Required roles: ${roles.join(', ')}` }
    });
  }

  next();
};

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const result = await AuthService.register(req.body);
    res.status(201).json({
      success: true,
      data: { id: result.id, email: result.email, role: result.role }
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: { code: error.code, message: error.message }
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: { code: error.code, message: error.message }
    });
  }
});

app.post('/api/auth/forgot-password/request', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Email is required' }
      });
    }

    const user = await User.findOne({
      where: { email: String(email).trim().toLowerCase() }
    });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = await bcrypt.hash(rawToken, 10);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      const resetLink = `${FRONTEND_URL}/forgot-password?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(user.email)}`;

      user.password_reset_token_hash = tokenHash;
      user.password_reset_expires_at = expiresAt;
      await user.save();

      await sendPasswordResetEmail({
        email: user.email,
        name: `${user.first_name} ${user.last_name}`.trim(),
        resetLink
      });
    }

    res.json({
      success: true,
      data: {
        message: 'If an account exists for that email, a password reset link has been sent.'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.post('/api/auth/forgot-password/reset', async (req, res) => {
  try {
    const { email, token, new_password } = req.body;

    if (!email || !token || !new_password) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Email, reset token, and new password are required' }
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters' }
      });
    }

    const user = await User.findOne({
      where: { email: String(email).trim().toLowerCase() }
    });

    if (!user || !user.password_reset_token_hash || !user.password_reset_expires_at) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_RESET_REQUEST', message: 'This password reset link is invalid or already used' }
      });
    }

    if (new Date(user.password_reset_expires_at).getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        error: { code: 'RESET_LINK_EXPIRED', message: 'This password reset link has expired' }
      });
    }

    const tokenMatches = await bcrypt.compare(String(token), user.password_reset_token_hash);
    if (!tokenMatches) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_RESET_TOKEN', message: 'This password reset link is invalid' }
      });
    }

    user.password_hash = new_password;
    user.password_reset_token_hash = null;
    user.password_reset_expires_at = null;
    user.failed_login_attempts = 0;
    user.locked_until = null;
    await user.save();

    res.json({
      success: true,
      data: { role: user.role }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.get('/api/departments', async (req, res) => {
  try {
    const departments = await getDepartments();
    res.json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.post('/api/auth/refresh-token', (req, res) => {
  try {
    const { refresh_token } = req.body;
    const tokens = AuthService.refreshToken(refresh_token);
    res.json({ success: true, data: tokens });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { code: error.code, message: error.message }
    });
  }
});

// Sessions routes
app.get('/api/sessions', async (req, res) => {
  try {
    const departmentMap = await buildDepartmentMap();
    const sessions = await Session.findAll({
      where: { status: 'active' },
      include: [
        { model: QRCode, as: 'qr_code' }
      ]
    });
    res.json({ success: true, data: sessions.map((session) => enrichSession(session, departmentMap)) });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.post('/api/sessions', requireAuth, requireRole(...ADMIN_WORKSPACE_ROLES), async (req, res) => {
  try {
    const { subject, session_title, submission_deadline, late_submission_deadline, department_id = 'BL' } = req.body;
    const createdBy = req.user?.id || (await User.findOne({ where: { role: 'admin' } }))?.id;
    const nextDepartmentId = getAccessibleDepartmentId(req.user, department_id);
    const normalizedDeadline = normalizeSessionDateInput(submission_deadline);
    const normalizedLateDeadline = normalizeSessionDateInput(late_submission_deadline || submission_deadline);
    const session = await Session.create({
      subject,
      session_title,
      available_from: normalizedDeadline,
      department_id: nextDepartmentId,
      batch: normalizeBatch(req.body.batch),
      semester: normalizeSemester(req.body.semester),
      attendance_mode: normalizeAttendanceMode(req.body.attendance_mode),
      enrolled_students: normalizeEnrollmentList(req.body.enrolled_students),
      submission_deadline: normalizedDeadline,
      late_submission_deadline: normalizedLateDeadline,
      status: 'active',
      created_by: createdBy
    });
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

// Submissions routes
app.post('/api/submissions', requireAuth, async (req, res) => {
  try {
    const { session_id, device_info, location, ip_address, notes } = req.body;
    
    // Check if already submitted
    const existing = await Submission.findOne({
      where: { session_id, student_id: req.user.id }
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'ALREADY_SUBMITTED', message: 'Submission already exists' }
      });
    }

    const session = await Session.findByPk(session_id);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' }
      });
    }

    if (!['student', 'representative'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only students and representatives can submit to sessions' }
      });
    }

    const studentBatch = normalizeBatch(req.user.batch, '47');
    const sessionBatch = normalizeBatch(session.batch);
    if (sessionBatch !== 'all' && sessionBatch !== studentBatch) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'This session is not available for your batch' }
      });
    }

    const now = new Date();
    const availability = getSessionAvailability(session, now);

    if (availability === 'scheduled') {
      return res.status(400).json({
        success: false,
        error: { code: 'SUBMISSION_NOT_OPEN', message: 'Submission window has not opened yet' }
      });
    }

    if (availability === 'closed') {
      return res.status(400).json({
        success: false,
        error: { code: 'SUBMISSION_CLOSED', message: 'Submission window has closed' }
      });
    }

    let status = 'on_time';
    
    const lateDeadline = parseSessionDate(session.late_submission_deadline);
    const submissionDeadline = parseSessionDate(session.submission_deadline);

    if (lateDeadline && now > lateDeadline) {
      status = 'closed';
    } else if (submissionDeadline && now > submissionDeadline) {
      status = 'late';
    }

    const submission = await Submission.create({
      session_id,
      student_id: req.user.id,
      submission_time: now,
      status,
      device_info: {
        ...(device_info || {}),
        submission_notes: notes || null
      },
      location,
      ip_address
    });

    res.status(201).json({
      success: true,
      data: {
        ...submission.toJSON(),
        marks: null,
        notes: notes || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.get('/api/submissions/:submission_id', async (req, res) => {
  try {
    const submission = await Submission.findByPk(req.params.submission_id, {
      include: [
        { model: Session, as: 'session' },
        { model: Marks, as: 'marks' }
      ]
    });
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Submission not found' }
      });
    }
    res.json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

// QR validation routes
app.post('/api/qr/validate', async (req, res) => {
  try {
    const { qr_code } = req.body;
    const match = qr_code.match(/session=([a-f0-9-]+)/);
    
    if (!match) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_QR', message: 'Invalid QR format' }
      });
    }

    const session_id = match[1];
    const qrRecord = await QRCode.findOne({ where: { code: qr_code } });
    
    if (!qrRecord) {
      return res.status(404).json({
        success: false,
        error: { code: 'QR_NOT_FOUND', message: 'QR code not found' }
      });
    }

    if (!qrRecord.is_active || new Date() > new Date(qrRecord.expires_at)) {
      return res.status(400).json({
        success: false,
        error: { code: 'QR_EXPIRED', message: 'QR code is expired or inactive' }
      });
    }

    // Increment scan count
    qrRecord.scan_count += 1;
    qrRecord.last_scanned_at = new Date();
    await qrRecord.save();

    res.json({
      success: true,
      data: {
        session_id,
        is_valid: true,
        is_expired: false,
        scan_count: qrRecord.scan_count
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

// User endpoints
app.get('/api/users/me', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        university_id: user.university_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        department_id: user.department_id,
        batch: user.batch,
        degree_code: user.degree_code,
        admission_year: user.admission_year,
        phone: user.phone,
        is_active: user.is_active,
        is_verified: user.is_verified,
        last_login: user.last_login
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

// Get user's submissions
app.get('/api/my-submissions', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || 10);
    const page = parseInt(req.query.page || 1);
    const offset = (page - 1) * limit;
    
    const { rows, count } = await Submission.findAndCountAll({
      where: { student_id: req.user.id },
      include: [
        { model: Session, as: 'session' },
        { model: User, as: 'student' },
        { model: Marks, as: 'marks' }
      ],
      limit,
      offset,
      order: [['submission_time', 'DESC']]
    });

    res.json({
      success: true,
      data: rows.map((submission) => ({
        ...submission.toJSON(),
        marks: submission.marks?.final_marks ?? submission.marks?.obtained_marks ?? null,
        notes: submission.device_info?.submission_notes || null
      })),
      pagination: {
        limit,
        page,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.get('/api/my-marks', requireAuth, async (req, res) => {
  try {
    const marks = await Marks.findAll({
      include: [
        {
          model: Submission,
          as: 'submission',
          where: { student_id: req.user.id }
        }
      ],
      order: [['graded_at', 'DESC']]
    });

    const data = marks.map((mark) => ({
      ...mark.toJSON(),
      marks: mark.final_marks ?? mark.obtained_marks ?? null
    }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.get('/api/student/available-sessions', requireAuth, async (req, res) => {
  try {
    if (!['student', 'representative'].includes(req.user.role)) {
      return res.json({ success: true, data: [] });
    }

    const studentBatch = normalizeBatch(req.user.batch, '47');

    const [departmentMap, sessions, submissions] = await Promise.all([
      buildDepartmentMap(),
      Session.findAll({
        where: {
          status: 'active'
        },
        include: [{ model: QRCode, as: 'qr_code' }],
        order: [['available_from', 'ASC']]
      }),
      Submission.findAll({
        where: { student_id: req.user.id },
        attributes: ['session_id']
      })
    ]);

    const submittedSessionIds = new Set(submissions.map((submission) => submission.session_id));
    const now = new Date();

    const data = sessions.map((session) => {
      const enriched = enrichSession(session, departmentMap);
      const availability = getSessionAvailability(session, now);
      const hasSubmitted = submittedSessionIds.has(session.id);
      const matchesBatch = normalizeBatch(session.batch) === 'all' || normalizeBatch(session.batch) === studentBatch;

      return {
        ...enriched,
        availability,
        has_submitted: hasSubmitted,
        can_submit: availability === 'open' && !hasSubmitted && matchesBatch,
        batch: normalizeBatch(session.batch),
        semester: normalizeSemester(session.semester)
      };
    }).filter((session) => (
      (session.batch === 'all' || session.batch === studentBatch)
      && (session.availability !== 'closed' || session.has_submitted)
    ));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.get('/api/representative/attendance-sessions', requireAuth, requireRole(...STUDENT_LEADER_ROLES), async (req, res) => {
  try {
    const userBatch = normalizeBatch(req.user.batch, '47');
    const sessions = await Session.findAll({
      where: {
        status: 'active',
        attendance_mode: 'representative_batch'
      },
      order: [['available_from', 'ASC']]
    });

    const existingSubmissions = await AttendanceSubmission.findAll({
      where: { representative_id: req.user.id },
      attributes: ['session_id', 'confirmation_status', 'submitted_at']
    });
    const submissionMap = existingSubmissions.reduce((acc, item) => {
      acc[item.session_id] = item;
      return acc;
    }, {});

    const data = sessions
      .filter((session) => {
        const sessionBatch = normalizeBatch(session.batch);
        return sessionBatch === 'all' || sessionBatch === userBatch;
      })
      .map((session) => ({
        ...session.toJSON(),
        enrolled_count: normalizeEnrollmentList(session.enrolled_students).length,
        representative_submission: submissionMap[session.id] || null
      }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.get('/api/representative/sessions/:sessionId/attendance', requireAuth, requireRole(...STUDENT_LEADER_ROLES), async (req, res) => {
  try {
    const session = await Session.findByPk(req.params.sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' }
      });
    }

    const accessError = ensureRepresentativeSessionAccess(req.user, session);
    if (accessError) {
      return res.status(403).json(accessError);
    }

    const existingSubmission = await AttendanceSubmission.findOne({
      where: {
        session_id: session.id,
        representative_id: req.user.id
      }
    });

    res.json({
      success: true,
      data: {
        session,
        enrolled_students: normalizeEnrollmentList(session.enrolled_students),
        attendance_submission: existingSubmission
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.post('/api/representative/sessions/:sessionId/attendance', requireAuth, requireRole(...STUDENT_LEADER_ROLES), async (req, res) => {
  try {
    const session = await Session.findByPk(req.params.sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' }
      });
    }

    const accessError = ensureRepresentativeSessionAccess(req.user, session);
    if (accessError) {
      return res.status(403).json(accessError);
    }

    const enrollmentList = normalizeEnrollmentList(session.enrolled_students);
    const attendanceRecords = Array.isArray(req.body.attendance_records)
      ? req.body.attendance_records.map((record, index) => ({
          id: String(record?.id || enrollmentList[index]?.id || `entry-${index + 1}`).trim(),
          name: String(record?.name || enrollmentList[index]?.name || `Student ${index + 1}`).trim(),
          present: Boolean(record?.present)
        }))
      : [];

    if (!attendanceRecords.length) {
      return res.status(400).json({
        success: false,
        error: { code: 'EMPTY_ATTENDANCE', message: 'At least one attendance record is required' }
      });
    }

    const attendeesPresent = attendanceRecords.filter((record) => record.present).length;
    const attendeesAbsent = attendanceRecords.length - attendeesPresent;
    const confirmationStatus = req.body.confirmation_status === 'not_confirmed' ? 'not_confirmed' : 'confirmed';
    const now = new Date();

    let submission = await AttendanceSubmission.findOne({
      where: {
        session_id: session.id,
        representative_id: req.user.id
      }
    });

    if (submission) {
      Object.assign(submission, {
        department_id: normalizeDepartmentId(session.department_id),
        batch: normalizeBatch(req.user.batch, '47'),
        confirmation_status: confirmationStatus,
        attendees_present: attendeesPresent,
        attendees_absent: attendeesAbsent,
        attendance_records: attendanceRecords,
        enrolled_snapshot: enrollmentList,
        notes: String(req.body.notes || ''),
        submitted_at: now,
        updated_at: now
      });
      await submission.save();
    } else {
      submission = await AttendanceSubmission.create({
        session_id: session.id,
        representative_id: req.user.id,
        department_id: normalizeDepartmentId(session.department_id),
        batch: normalizeBatch(req.user.batch, '47'),
        confirmation_status: confirmationStatus,
        attendees_present: attendeesPresent,
        attendees_absent: attendeesAbsent,
        attendance_records: attendanceRecords,
        enrolled_snapshot: enrollmentList,
        notes: String(req.body.notes || ''),
        submitted_at: now,
        created_at: now,
        updated_at: now
      });
    }

    res.json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

// Get specific session
app.get('/api/sessions/:session_id', async (req, res) => {
  try {
    const session = await Session.findByPk(req.params.session_id, {
      include: [
        { model: QRCode, as: 'qr_code' }
      ]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' }
      });
    }

    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

// Download submission
app.get('/api/submissions/:submission_id/download', async (req, res) => {
  try {
    const submission = await Submission.findByPk(req.params.submission_id);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Submission not found' }
      });
    }

    // In production, generate actual download URL or file stream
    res.json({
      success: true,
      message: 'Download link generated',
      data: {
        download_url: `${process.env.STORAGE_URL || 'https://storage.example.com'}/submissions/${submission.id}.zip`,
        expires_in: '24h'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

// Dashboard summary
app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const totalSessions = await Session.count();
    const activeSessions = await Session.count({ where: { status: 'active' } });
    const totalSubmissions = await Submission.count();
    const onTimeSubmissions = await Submission.count({ where: { status: 'on_time' } });
    const lateSubmissions = await Submission.count({ where: { status: 'late' } });
    const pendingMarks = await Submission.count({
      include: [{
        model: Marks,
        as: 'marks',
        where: { visibility_to_student: false },
        required: false
      }]
    });

    const allMarks = await Marks.findAll();
    const averageScore = allMarks.length > 0
      ? (allMarks.reduce((sum, m) => sum + m.final_marks, 0) / allMarks.length).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        total_sessions: totalSessions,
        active_sessions: activeSessions,
        total_submissions: totalSubmissions,
        on_time_submissions: onTimeSubmissions,
        late_submissions: lateSubmissions,
        pending_marks: pendingMarks,
        average_score: parseFloat(averageScore),
        last_updated: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.get('/api/admin/overview', requireAuth, requireRole(...ADMIN_WORKSPACE_ROLES), async (req, res) => {
  try {
    const sessionScope = getScopedSessionWhere(req.user);
    const scopedSessionIds = await Session.findAll({
      where: sessionScope,
      attributes: ['id']
    });
    const sessionIds = scopedSessionIds.map((session) => session.id);
    const submissionWhere = hasGlobalDepartmentAccess(req.user)
      ? {}
      : { session_id: { [Op.in]: sessionIds.length ? sessionIds : ['__none__'] } };

    const [departmentCount, sessionCount, activeQrCount, submissionCount, pendingReviewCount] = await Promise.all([
      sequelize.query(`SELECT COUNT(*) as count FROM ${DEPARTMENTS_TABLE}`, { type: QueryTypes.SELECT }),
      Session.count({ where: sessionScope }),
      QRCode.count({
        where: { is_active: true },
        include: [{
          model: Session,
          as: 'session',
          where: sessionScope,
          required: true
        }]
      }),
      Submission.count({ where: submissionWhere }),
      Submission.count({
        where: submissionWhere,
        include: [{
          model: Marks,
          as: 'marks',
          required: false
        }],
        where: {
          [Op.or]: [
            { '$marks.id$': null },
            { '$marks.visibility_to_student$': false }
          ]
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        departments: departmentCount[0]?.count || 0,
        sessions: sessionCount,
        active_qr_codes: activeQrCount,
        submissions: submissionCount,
        pending_reviews: pendingReviewCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.get('/api/admin/departments', requireAuth, requireRole(...ADMIN_WORKSPACE_ROLES), async (req, res) => {
  try {
    const departments = await getDepartments();
    res.json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.get('/api/admin/users', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const departmentMap = await buildDepartmentMap();
    const users = await User.findAll({
      attributes: [
        'id',
        'university_id',
        'email',
        'first_name',
        'last_name',
        'role',
        'department_id',
        'batch',
        'degree_code',
        'admission_year',
        'is_active',
        'is_verified',
        'createdAt',
        'last_login'
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: users.map((user) => ({
        ...user.toJSON(),
        department_name: departmentMap[user.department_id] || user.department_id || '-'
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.post('/api/admin/users', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      confirm_admin_password,
      role,
      department_id
    } = req.body;
    const allowedRoles = ['lecturer', 'demonstrator', 'admin'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ROLE', message: 'Staff account role must be lecturer, demonstrator, or admin' }
      });
    }

    if (!first_name || !last_name || !email || !password || !confirm_admin_password) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'First name, last name, email, password, and admin confirmation password are required' }
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters' }
      });
    }

    const passwordMatches = await req.user.comparePassword(confirm_admin_password);
    if (!passwordMatches) {
      return res.status(403).json({
        success: false,
        error: { code: 'ADMIN_CONFIRMATION_FAILED', message: 'Admin password confirmation failed' }
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_USER', message: 'User with this email already exists' }
      });
    }

    const nextDepartmentId = roleNeedsDepartment(role)
      ? normalizeDepartmentId(department_id || 'BL')
      : null;
    const recoveryKey = generateRecoveryKey();
    const recoveryKeyHash = await bcrypt.hash(recoveryKey, 10);

    const staffUser = await User.create({
      university_id: `STAFF-${Date.now()}`,
      email: String(email).trim().toLowerCase(),
      first_name: String(first_name).trim(),
      last_name: String(last_name).trim(),
      password_hash: password,
      role,
      department_id: nextDepartmentId || 'BL',
      recovery_key_hash: recoveryKeyHash,
      batch: null,
      is_verified: true
    });

    const departmentMap = await buildDepartmentMap();
    res.status(201).json({
      success: true,
      data: {
        ...staffUser.toJSON(),
        recovery_key: recoveryKey,
        department_name: departmentMap[staffUser.department_id] || staffUser.department_id || '-'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.put('/api/admin/users/:userId/role', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, department_id, batch } = req.body;
    const allowedRoles = ROLE_OPTIONS;

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ROLE', message: 'Role must be student, representative, lecturer, demonstrator, or admin' }
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    if (user.id === req.user.id && role !== 'admin') {
      return res.status(400).json({
        success: false,
        error: { code: 'SELF_DEMOTION_BLOCKED', message: 'You cannot remove your own admin access' }
      });
    }

    user.role = role;
    user.department_id = isStudentScopedRole(role)
      ? user.department_id
      : normalizeDepartmentId(department_id || user.department_id || 'BL');
    user.batch = isStudentScopedRole(role)
      ? normalizeBatch(batch, user.batch || '47')
      : null;
    await user.save();

    const departmentMap = await buildDepartmentMap();
    res.json({
      success: true,
      data: {
        ...user.toJSON(),
        department_name: departmentMap[user.department_id] || user.department_id || '-'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.post('/api/admin/departments', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const id = String(req.body.id || '').trim().toUpperCase();
    const name = String(req.body.name || '').trim();

    if (!id || !name) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DEPARTMENT', message: 'Department id and name are required' }
      });
    }

    const insertDepartmentSql = sequelize.getDialect() === 'sqlite'
      ? `INSERT OR IGNORE INTO ${DEPARTMENTS_TABLE} (id, name) VALUES (:id, :name)`
      : `
          INSERT INTO ${DEPARTMENTS_TABLE} (id, name)
          VALUES (:id, :name)
          ON CONFLICT (id) DO NOTHING
        `;

    await sequelize.query(insertDepartmentSql, { replacements: { id, name } });

    const departments = await getDepartments();
    res.status(201).json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.put('/api/admin/departments/:departmentId', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { departmentId } = req.params;
    const name = String(req.body.name || '').trim();

    if (!name) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_NAME', message: 'Department name is required' }
      });
    }

    await sequelize.query(
      `UPDATE ${DEPARTMENTS_TABLE} SET name = :name WHERE id = :id`,
      {
        replacements: { id: departmentId, name },
        type: QueryTypes.UPDATE
      }
    );

    const departments = await getDepartments();
    res.json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.get('/api/admin/sessions', requireAuth, requireRole(...ADMIN_WORKSPACE_ROLES), async (req, res) => {
  try {
    const departmentMap = await buildDepartmentMap();
    const sessions = await Session.findAll({
      where: getScopedSessionWhere(req.user),
      include: [
        { model: QRCode, as: 'qr_code' }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: sessions.map((session) => enrichSession(session, departmentMap))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.get('/api/admin/submissions', requireAuth, requireRole(...ADMIN_WORKSPACE_ROLES), async (req, res) => {
  try {
    const {
      status = 'all',
      department_id = 'all',
      session_id = 'all',
      search = ''
    } = req.query;

    const where = {};
    if (status !== 'all') {
      where.status = status;
    }
    if (session_id !== 'all') {
      where.session_id = session_id;
    }

    const sessionWhere = getScopedSessionWhere(req.user, department_id);

    const studentWhere = search
      ? {
          [Op.or]: [
            { first_name: { [Op.like]: `%${search}%` } },
            { last_name: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
            { university_id: { [Op.like]: `%${search}%` } }
          ]
        }
      : undefined;

    const [departmentMap, submissions] = await Promise.all([
      buildDepartmentMap(),
      Submission.findAll({
        where,
        include: [
          {
            model: Session,
            as: 'session',
            where: sessionWhere,
            required: true
          },
          {
            model: User,
            as: 'student',
            attributes: ['id', 'first_name', 'last_name', 'email', 'university_id', 'department_id', 'batch'],
            where: studentWhere,
            required: Boolean(studentWhere)
          },
          {
            model: Marks,
            as: 'marks',
            required: false
          }
        ],
        order: [['submission_time', 'DESC']]
      })
    ]);

    const data = submissions.map((submission) => ({
      ...submission.toJSON(),
      department_name: departmentMap[submission.session?.department_id] || submission.session?.department_id || '-',
      student_name: [submission.student?.first_name, submission.student?.last_name].filter(Boolean).join(' '),
      marks_value: submission.marks?.final_marks ?? null,
      review_status: submission.marks
        ? (submission.marks.visibility_to_student ? 'published' : 'draft')
        : 'pending'
    }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.get('/api/staff/reports/summary', requireAuth, requireRole(...ADMIN_WORKSPACE_ROLES), async (req, res) => {
  try {
    const { semester = 'all', department_id = 'all' } = req.query;
    const sessionWhere = getScopedSessionWhere(req.user, department_id);
    if (semester !== 'all') {
      sessionWhere.semester = normalizeSemester(semester);
    }

    const sessions = await Session.findAll({
      where: sessionWhere,
      attributes: ['id', 'session_title', 'subject', 'department_id', 'batch', 'semester', 'attendance_mode']
    });
    const sessionIds = sessions.map((session) => session.id);

    const submissions = sessionIds.length
      ? await Submission.findAll({
          where: { session_id: { [Op.in]: sessionIds } },
          attributes: ['id', 'session_id', 'status']
        })
      : [];

    const attendanceSubmissions = sessionIds.length
      ? await AttendanceSubmission.findAll({
          where: { session_id: { [Op.in]: sessionIds } },
          attributes: ['id', 'session_id', 'confirmation_status', 'attendees_present', 'attendees_absent', 'batch']
        })
      : [];

    const submissionsByStatus = ['on_time', 'late', 'closed'].map((status) => ({
      label: status,
      value: submissions.filter((submission) => submission.status === status).length
    }));

    const attendanceByStatus = ['confirmed', 'not_confirmed', 'pending'].map((status) => ({
      label: status,
      value: attendanceSubmissions.filter((submission) => submission.confirmation_status === status).length
    }));

    const sessionsBySemester = SEMESTER_OPTIONS.map((item) => ({
      label: item,
      value: sessions.filter((session) => normalizeSemester(session.semester) === item).length
    }));

    res.json({
      success: true,
      data: {
        totals: {
          sessions: sessions.length,
          submissions: submissions.length,
          attendance_confirmations: attendanceSubmissions.length
        },
        submissions_by_status: submissionsByStatus,
        attendance_by_status: attendanceByStatus,
        sessions_by_semester: sessionsBySemester
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.get('/api/staff/reports/export', requireAuth, requireRole(...ADMIN_WORKSPACE_ROLES), async (req, res) => {
  try {
    const { type = 'submissions', semester = 'all', department_id = 'all' } = req.query;
    const sessionWhere = getScopedSessionWhere(req.user, department_id);
    if (semester !== 'all') {
      sessionWhere.semester = normalizeSemester(semester);
    }

    const sessions = await Session.findAll({
      where: sessionWhere,
      attributes: ['id', 'session_title', 'subject', 'department_id', 'batch', 'semester', 'attendance_mode']
    });
    const sessionMap = sessions.reduce((acc, session) => {
      acc[session.id] = session;
      return acc;
    }, {});
    const sessionIds = Object.keys(sessionMap);

    let rows = [];

    if (type === 'attendance') {
      const attendanceSubmissions = sessionIds.length
        ? await AttendanceSubmission.findAll({
            where: { session_id: { [Op.in]: sessionIds } },
            include: [{
              model: User,
              as: 'representative',
              attributes: ['first_name', 'last_name', 'university_id']
            }]
          })
        : [];

      rows = attendanceSubmissions.map((entry) => ({
        session_title: sessionMap[entry.session_id]?.session_title || '-',
        subject: sessionMap[entry.session_id]?.subject || '-',
        semester: sessionMap[entry.session_id]?.semester || 'Semester 1',
        department_id: sessionMap[entry.session_id]?.department_id || entry.department_id,
        batch: entry.batch,
        representative: [entry.representative?.first_name, entry.representative?.last_name].filter(Boolean).join(' '),
        representative_id: entry.representative?.university_id || '-',
        confirmation_status: entry.confirmation_status,
        attendees_present: entry.attendees_present,
        attendees_absent: entry.attendees_absent,
        submitted_at: entry.submitted_at ? new Date(entry.submitted_at).toISOString() : ''
      }));
    } else {
      const submissionRows = sessionIds.length
        ? await Submission.findAll({
            where: { session_id: { [Op.in]: sessionIds } },
            include: [{
              model: User,
              as: 'student',
              attributes: ['first_name', 'last_name', 'university_id', 'batch']
            }]
          })
        : [];

      rows = submissionRows.map((entry) => ({
        session_title: sessionMap[entry.session_id]?.session_title || '-',
        subject: sessionMap[entry.session_id]?.subject || '-',
        semester: sessionMap[entry.session_id]?.semester || 'Semester 1',
        department_id: sessionMap[entry.session_id]?.department_id || '-',
        batch: entry.student?.batch || sessionMap[entry.session_id]?.batch || '-',
        student_name: [entry.student?.first_name, entry.student?.last_name].filter(Boolean).join(' '),
        university_id: entry.student?.university_id || '-',
        submission_status: entry.status,
        submission_time: entry.submission_time ? new Date(entry.submission_time).toISOString() : ''
      }));
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
    res.send(toCsv(rows));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.post('/api/admin/submissions/:submissionId/marks', requireAuth, requireRole(...ADMIN_WORKSPACE_ROLES), async (req, res) => {
  try {
    const { submissionId } = req.params;
    const {
      obtained_marks,
      total_marks,
      feedback = '',
      penalties = 0,
      comments = [],
      visibility_to_student = false
    } = req.body;

    const obtainedMarks = Number(obtained_marks);
    const totalMarks = Number(total_marks);
    const penaltyAmount = Number(penalties || 0);

    if (!Number.isFinite(obtainedMarks) || obtainedMarks < 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_OBTAINED_MARKS', message: 'Obtained marks must be a valid non-negative number' }
      });
    }

    if (!Number.isFinite(totalMarks) || totalMarks <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOTAL_MARKS', message: 'Total marks must be a valid number greater than zero' }
      });
    }

    if (obtainedMarks > totalMarks) {
      return res.status(400).json({
        success: false,
        error: { code: 'MARKS_EXCEED_TOTAL', message: 'Obtained marks cannot exceed total marks' }
      });
    }

    if (!Number.isFinite(penaltyAmount) || penaltyAmount < 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PENALTY', message: 'Penalty must be a valid non-negative number' }
      });
    }

    const submission = await Submission.findByPk(submissionId, {
      include: [
        { model: Session, as: 'session' },
        {
          model: User,
          as: 'student',
          attributes: ['id', 'first_name', 'last_name', 'email', 'university_id', 'department_id']
        },
        { model: Marks, as: 'marks' }
      ]
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: { code: 'SUBMISSION_NOT_FOUND', message: 'Submission not found' }
      });
    }

    const accessError = ensureSubmissionAccess(req.user, submission);
    if (accessError) {
      return res.status(403).json(accessError);
    }

    const percentage = Number(((obtainedMarks / totalMarks) * 100).toFixed(2));
    const finalMarks = Number(Math.max(obtainedMarks - penaltyAmount, 0).toFixed(2));
    const now = new Date();
    const shouldPublish = Boolean(visibility_to_student);

    let marks = submission.marks;

    if (marks) {
      marks.grader_id = req.user.id;
      marks.obtained_marks = obtainedMarks;
      marks.total_marks = totalMarks;
      marks.percentage = percentage;
      marks.feedback = feedback;
      marks.penalties = penaltyAmount;
      marks.final_marks = finalMarks;
      marks.visibility_to_student = shouldPublish;
      marks.comments = Array.isArray(comments) ? comments : [];
      marks.graded_at = now;
      marks.released_at = shouldPublish ? (marks.released_at || now) : null;
      marks.updated_at = now;
      await marks.save();
    } else {
      marks = await Marks.create({
        submission_id: submissionId,
        grader_id: req.user.id,
        obtained_marks: obtainedMarks,
        total_marks: totalMarks,
        percentage,
        feedback,
        penalties: penaltyAmount,
        final_marks: finalMarks,
        visibility_to_student: shouldPublish,
        graded_at: now,
        released_at: shouldPublish ? now : null,
        comments: Array.isArray(comments) ? comments : [],
        created_at: now,
        updated_at: now
      });
    }

    res.json({
      success: true,
      data: {
        ...marks.toJSON(),
        review_status: shouldPublish ? 'published' : 'draft'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.delete('/api/admin/submissions/:submissionId/marks', requireAuth, requireRole(...ADMIN_WORKSPACE_ROLES), async (req, res) => {
  try {
    const { submissionId } = req.params;
    const marks = await Marks.findOne({
      where: { submission_id: submissionId },
      include: [{
        model: Submission,
        as: 'submission',
        include: [{ model: Session, as: 'session' }]
      }]
    });

    if (!marks) {
      return res.status(404).json({
        success: false,
        error: { code: 'MARKS_NOT_FOUND', message: 'No marks found for this submission' }
      });
    }

    const accessError = ensureSubmissionAccess(req.user, marks.submission);
    if (accessError) {
      return res.status(403).json(accessError);
    }

    await marks.destroy();
    res.json({ success: true, data: { submission_id: submissionId } });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.put('/api/admin/sessions/:sessionId', requireAuth, requireRole(...ADMIN_WORKSPACE_ROLES), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findByPk(sessionId, {
      include: [{ model: QRCode, as: 'qr_code' }]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' }
      });
    }

    if (
      hasDepartmentScopedAccess(req.user)
      && normalizeDepartmentId(session.department_id) !== normalizeDepartmentId(req.user.department_id)
    ) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only edit sessions in your department' }
      });
    }

    const nextData = {
      subject: String(req.body.subject || session.subject).trim(),
      session_title: String(req.body.session_title || session.session_title).trim(),
      department_id: getAccessibleDepartmentId(req.user, req.body.department_id || session.department_id),
      batch: normalizeBatch(req.body.batch, session.batch || 'all'),
      semester: normalizeSemester(req.body.semester, session.semester || 'Semester 1'),
      attendance_mode: normalizeAttendanceMode(req.body.attendance_mode, session.attendance_mode || 'individual'),
      enrolled_students: req.body.enrolled_students !== undefined
        ? normalizeEnrollmentList(req.body.enrolled_students)
        : normalizeEnrollmentList(session.enrolled_students),
      available_from: normalizeSessionDateInput(req.body.available_from) || session.available_from,
      submission_deadline: normalizeSessionDateInput(req.body.submission_deadline) || session.submission_deadline,
      late_submission_deadline: normalizeSessionDateInput(req.body.late_submission_deadline) || null,
      notes: String(req.body.notes || ''),
      instructions: String(req.body.instructions || ''),
      status: String(req.body.status || session.status || 'active')
    };

    Object.assign(session, nextData, { updated_at: new Date() });
    await session.save();

    const departmentMap = await buildDepartmentMap();
    res.json({
      success: true,
      data: enrichSession(session, departmentMap)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.post('/api/admin/sessions', requireAuth, requireRole(...ADMIN_WORKSPACE_ROLES), async (req, res) => {
  try {
    const {
      subject,
      session_title,
      available_from,
      department_id,
      batch,
      semester,
      attendance_mode,
      enrolled_students,
      submission_deadline,
      late_submission_deadline,
      notes,
      instructions,
      status = 'active',
      generate_qr = true
    } = req.body;
    const normalizedAvailableFrom = normalizeSessionDateInput(available_from || new Date().toISOString());
    const normalizedSubmissionDeadline = normalizeSessionDateInput(submission_deadline);
    const normalizedLateSubmissionDeadline = normalizeSessionDateInput(late_submission_deadline || submission_deadline);

    const resolvedDepartmentId = getAccessibleDepartmentId(req.user, department_id);
    const resolvedBatch = normalizeBatch(batch);
    const resolvedSemester = normalizeSemester(semester);
    const resolvedAttendanceMode = normalizeAttendanceMode(attendance_mode);
    const resolvedEnrollmentList = normalizeEnrollmentList(enrolled_students);

    if (!subject || !session_title || !resolvedDepartmentId || !submission_deadline) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_SESSION', message: 'Subject, title, department, and submission deadline are required' }
      });
    }

    if (!normalizedAvailableFrom || !normalizedSubmissionDeadline) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_SESSION_TIME', message: 'Submission open and deadline times must be valid dates' }
      });
    }

    if (new Date(normalizedAvailableFrom) >= new Date(normalizedSubmissionDeadline)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_SESSION_WINDOW', message: 'Submission open time must be before the deadline' }
      });
    }

    const session = await Session.create({
      subject,
      session_title,
      available_from: normalizedAvailableFrom,
      department_id: resolvedDepartmentId,
      batch: resolvedBatch,
      semester: resolvedSemester,
      attendance_mode: resolvedAttendanceMode,
      enrolled_students: resolvedEnrollmentList,
      submission_deadline: normalizedSubmissionDeadline,
      late_submission_deadline: normalizedLateSubmissionDeadline,
      notes: notes || null,
      instructions: instructions || null,
      status,
      created_by: req.user.id
    });

    let qrCode = null;
    if (generate_qr) {
      qrCode = await QRCodeService.generateQRCode(session.id);
    }

    const departmentMap = await buildDepartmentMap();
    const reloaded = await Session.findByPk(session.id, {
      include: [{ model: QRCode, as: 'qr_code' }]
    });

    res.status(201).json({
      success: true,
      data: {
        ...enrichSession(reloaded, departmentMap),
        generated_qr_id: qrCode?.id || null
      }
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: { code: error.code, message: error.message || 'Failed to create admin session' }
    });
  }
});

app.post('/api/admin/sessions/:session_id/qr', requireAuth, requireRole(...ADMIN_WORKSPACE_ROLES), async (req, res) => {
  try {
    const session = await Session.findByPk(req.params.session_id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' }
      });
    }

    if (
      hasDepartmentScopedAccess(req.user)
      && normalizeDepartmentId(session.department_id) !== normalizeDepartmentId(req.user.department_id)
    ) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only manage QR codes in your department' }
      });
    }

    const qrCode = session.qr_code_id
      ? await QRCodeService.regenerateQRCode(session.id)
      : await QRCodeService.generateQRCode(session.id);

    const reloaded = await Session.findByPk(session.id, {
      include: [{ model: QRCode, as: 'qr_code' }]
    });
    const departmentMap = await buildDepartmentMap();

    res.json({
      success: true,
      data: {
        session: enrichSession(reloaded, departmentMap),
        qr_code: qrCode
      }
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: { code: error.code, message: error.message || 'Failed to generate QR code' }
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND'
    }
  });
});

// Start server
const startServer = async () => {
  try {
    if (SEED_ON_START) {
      console.log('SEED_ON_START enabled. Refreshing demo data before server start...');
      await seedDatabase({ closeConnection: false, exitOnComplete: false });
    }

    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Cannot start server without database connection');
      process.exit(1);
    }

    // Sync database schema
    await syncDatabase();

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`\n✅ SmartLab Backend Server Running`);
      console.log(`🚀 Server: http://localhost:${PORT}`);
      console.log(`📚 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🗄️  Database: Connected and Synced`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        sequelize.close();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
};

startServer();

export default app;
