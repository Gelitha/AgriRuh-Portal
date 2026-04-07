// backend/src/services/SubmissionService.js
// Submission Service - Handles all submission-related operations

const { Op } = require('sequelize');
const Submission = require('../models/Submission');
const Session = require('../models/Session');
const User = require('../models/User');
const Marks = require('../models/Marks');

class SubmissionService {
  /**
   * Create a new submission
   * @param {Object} data - Submission data {session_id, student_id, submission_method, ...}
   * @returns {Object} Created submission
   */
  static async createSubmission(data) {
    const {
      session_id,
      student_id,
      submission_method = 'qr_scan',
      device_info = {},
      location_lat = null,
      location_lng = null,
      ip_address = null,
    } = data;

    // Get session
    const session = await Session.findByPk(session_id);
    if (!session) {
      throw {
        status: 404,
        code: 'SESSION_NOT_FOUND',
        message: 'Session not found',
      };
    }

    // Check if session is active
    if (session.status !== 'active') {
      throw {
        status: 400,
        code: 'SESSION_CLOSED',
        message: 'Submission window for this session is closed',
      };
    }

    // Check for duplicate submission
    const existingSubmission = await Submission.findOne({
      where: {
        session_id,
        student_id,
      },
    });

    if (existingSubmission) {
      throw {
        status: 409,
        code: 'DUPLICATE_SUBMISSION',
        message: 'You have already submitted for this session',
        previous_submission: {
          submission_time: existingSubmission.submission_time,
          status: existingSubmission.status,
        },
      };
    }

    // Calculate submission status based on deadline
    const now = new Date();
    let status = 'on_time';

    if (now > new Date(session.late_submission_deadline)) {
      throw {
        status: 400,
        code: 'SUBMISSION_CLOSED',
        message: 'Submission window has closed. No more submissions accepted.',
      };
    }

    if (now > new Date(session.submission_deadline)) {
      status = 'late';
    }

    // Create submission record
    const submission = await Submission.create({
      session_id,
      student_id,
      status,
      submission_method,
      submission_time: now,
      device_info,
      location_lat,
      location_lng,
      ip_address,
    });

    // Log audit event
    await this.logAuditEvent({
      action: 'submission_created',
      user_id: student_id,
      entity_type: 'submission',
      entity_id: submission.id,
      new_values: submission.toJSON(),
      ip_address,
    });

    return submission;
  }

  /**
   * Get submission details
   */
  static async getSubmission(submission_id, user_id, userRole) {
    const submission = await Submission.findByPk(submission_id, {
      include: [
        {
          model: Session,
          attributes: ['id', 'session_title', 'session_date', 'submission_deadline'],
        },
        {
          model: User,
          as: 'student',
          attributes: ['id', 'university_id', 'first_name', 'last_name', 'email'],
        },
        {
          model: Marks,
        },
      ],
    });

    if (!submission) {
      throw {
        status: 404,
        code: 'SUBMISSION_NOT_FOUND',
        message: 'Submission not found',
      };
    }

    // Check authorization
    if (userRole === 'student' && submission.student_id !== user_id) {
      throw {
        status: 403,
        code: 'FORBIDDEN',
        message: 'You do not have permission to view this submission',
      };
    }

    // If student, hide marks if not visible to them
    if (userRole === 'student' && submission.Marks) {
      if (!submission.Marks.visibility_to_student) {
        submission.Marks = null;
      }
    }

    return submission;
  }

  /**
   * Get all submissions for a session
   */
  static async getSessionSubmissions(
    session_id,
    filters = {},
    pagination = {}
  ) {
    const {
      status = null,
      search = null,
    } = filters;

    const {
      limit = 50,
      offset = 0,
    } = pagination;

    const where = { session_id };

    // Add status filter
    if (status) {
      where.status = status;
    }

    // Add search filter (student name or university_id)
    let include = [
      {
        model: User,
        as: 'student',
        attributes: ['id', 'university_id', 'first_name', 'last_name'],
      },
      {
        model: Marks,
        required: false,
      },
    ];

    if (search) {
      include[0].where = {
        [Op.or]: [
          { university_id: { [Op.iLike]: `%${search}%` } },
          { first_name: { [Op.iLike]: `%${search}%` } },
          { last_name: { [Op.iLike]: `%${search}%` } },
        ],
      };
    }

    const submissions = await Submission.findAndCountAll({
      where,
      include,
      limit,
      offset,
      order: [['submission_time', 'DESC']],
    });

    return {
      data: submissions.rows,
      total: submissions.count,
      limit,
      offset,
    };
  }

  /**
   * Get submissions for a student
   */
  static async getStudentSubmissions(student_id, pagination = {}) {
    const { limit = 20, offset = 0 } = pagination;

    const submissions = await Submission.findAndCountAll({
      where: { student_id },
      include: [
        {
          model: Session,
          attributes: ['id', 'session_title', 'subject_id', 'submission_deadline'],
        },
        {
          model: Marks,
          where: { visibility_to_student: true },
          required: false,
        },
      ],
      limit,
      offset,
      order: [['submission_time', 'DESC']],
    });

    return {
      data: submissions.rows,
      total: submissions.count,
      limit,
      offset,
    };
  }

  /**
   * Calculate submission statistics for a session
   */
  static async getSessionStatistics(session_id) {
    const submissions = await Submission.findAll({
      where: { session_id },
    });

    const stats = {
      total_submissions: submissions.length,
      on_time: submissions.filter(s => s.status === 'on_time').length,
      late: submissions.filter(s => s.status === 'late').length,
      average_submission_time: this.calculateAverageSubmissionTime(submissions),
    };

    return stats;
  }

  /**
   * Check if a student has already submitted for a session
   */
  static async hasSubmitted(session_id, student_id) {
    const submission = await Submission.findOne({
      where: { session_id, student_id },
    });
    return !!submission;
  }

  /**
   * Auto-apply late penalty to marks
   */
  static async applyLatePenalty(submission_id, penalty_percentage) {
    const submission = await Submission.findByPk(submission_id);

    if (submission.status !== 'late') {
      throw {
        status: 400,
        code: 'NOT_LATE_SUBMISSION',
        message: 'Penalty can only be applied to late submissions',
      };
    }

    // Find marks for this submission
    const marks = await Marks.findOne({
      where: { submission_id },
    });

    if (!marks) {
      throw {
        status: 404,
        code: 'MARKS_NOT_FOUND',
        message: 'Marks not found for this submission',
      };
    }

    // Calculate penalty
    const penalty_amount = marks.obtained_marks * (penalty_percentage / 100);
    const final_marks = marks.obtained_marks - penalty_amount;

    // Update marks
    marks.late_penalty_percentage = penalty_percentage;
    marks.late_penalty_amount = penalty_amount;
    marks.final_marks = final_marks;
    await marks.save();

    return marks;
  }

  /**
   * Helper: Calculate average submission time
   */
  static calculateAverageSubmissionTime(submissions) {
    if (submissions.length === 0) return null;

    const times = submissions.map(s => new Date(s.submission_time).getTime());
    const average = times.reduce((a, b) => a + b, 0) / times.length;

    return new Date(average).toLocaleTimeString();
  }

  /**
   * Helper: Log audit event
   */
  static async logAuditEvent(data) {
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create(data);
  }
}

module.exports = SubmissionService;
