import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AttendanceSubmission = sequelize.define('AttendanceSubmission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  session_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  representative_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  department_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  batch: {
    type: DataTypes.STRING,
    allowNull: false
  },
  confirmation_status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'not_confirmed'),
    allowNull: false,
    defaultValue: 'pending'
  },
  attendees_present: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  attendees_absent: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  attendance_records: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  enrolled_snapshot: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  notes: {
    type: DataTypes.TEXT
  },
  submitted_at: {
    type: DataTypes.DATE,
    defaultValue: new Date()
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: new Date()
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: new Date()
  }
}, {
  timestamps: false,
  tableName: 'attendance_submissions'
});

export default AttendanceSubmission;
