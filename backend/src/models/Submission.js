import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Submission = sequelize.define('Submission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  session_id: {
    type: DataTypes.UUID,
    allowNull: false,
    index: true
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false,
    index: true
  },
  submission_time: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: new Date()
  },
  status: {
    type: DataTypes.ENUM('on_time', 'late', 'closed', 'draft'),
    defaultValue: 'draft'
  },
  submission_method: {
    type: DataTypes.ENUM('qr_scan', 'manual_selection'),
    defaultValue: 'manual_selection'
  },
  file_url: {
    type: DataTypes.STRING
  },
  device_info: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  location: {
    type: DataTypes.GEOMETRY('POINT'),
    allowNull: true
  },
  ip_address: {
    type: DataTypes.INET,
    allowNull: true
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
  tableName: 'submissions',
  indexes: [
    {
      unique: true,
      fields: ['session_id', 'student_id']
    }
  ]
});

export default Submission;
