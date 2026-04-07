import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  subject_id: {
    type: DataTypes.UUID
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  session_title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  available_from: {
    type: DataTypes.DATE,
    allowNull: true
  },
  department_id: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'BL'
  },
  batch: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'all'
  },
  semester: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Semester 1'
  },
  attendance_mode: {
    type: DataTypes.ENUM('individual', 'representative_batch'),
    allowNull: false,
    defaultValue: 'individual'
  },
  enrolled_students: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false
  },
  submission_deadline: {
    type: DataTypes.DATE,
    allowNull: false
  },
  late_submission_deadline: {
    type: DataTypes.DATE
  },
  late_submission_window: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  qr_code_id: {
    type: DataTypes.UUID
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'closed'),
    defaultValue: 'draft'
  },
  notes: {
    type: DataTypes.TEXT
  },
  instructions: {
    type: DataTypes.TEXT
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
  tableName: 'sessions'
});

export default Session;
