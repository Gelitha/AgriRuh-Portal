import User from './User.js';
import Session from './Session.js';
import Submission from './Submission.js';
import QRCode from './QRCode.js';
import Marks from './Marks.js';
import AttendanceSubmission from './AttendanceSubmission.js';

// Define associations
User.hasMany(Session, { foreignKey: 'created_by', as: 'sessions' });
User.hasMany(Submission, { foreignKey: 'student_id', as: 'submissions' });
User.hasMany(Marks, { foreignKey: 'grader_id', as: 'graded_marks' });
User.hasMany(AttendanceSubmission, { foreignKey: 'representative_id', as: 'attendance_submissions' });

Session.hasMany(Submission, { foreignKey: 'session_id', as: 'submissions' });
Session.hasMany(AttendanceSubmission, { foreignKey: 'session_id', as: 'attendance_submissions' });
Session.belongsTo(QRCode, { foreignKey: 'qr_code_id', as: 'qr_code' });

Submission.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
Submission.belongsTo(Session, { foreignKey: 'session_id', as: 'session' });
Submission.hasOne(Marks, { foreignKey: 'submission_id', as: 'marks' });

Marks.belongsTo(Submission, { foreignKey: 'submission_id', as: 'submission' });
Marks.belongsTo(User, { foreignKey: 'grader_id', as: 'grader' });
AttendanceSubmission.belongsTo(Session, { foreignKey: 'session_id', as: 'session' });
AttendanceSubmission.belongsTo(User, { foreignKey: 'representative_id', as: 'representative' });

QRCode.belongsTo(Session, { foreignKey: 'session_id', as: 'session' });

export { User, Session, Submission, QRCode, Marks, AttendanceSubmission };
