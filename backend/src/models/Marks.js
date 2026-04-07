import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Marks = sequelize.define('Marks', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  submission_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    index: true
  },
  grader_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  obtained_marks: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  total_marks: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  percentage: {
    type: DataTypes.DECIMAL(5, 2)
  },
  feedback: {
    type: DataTypes.TEXT
  },
  penalties: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  final_marks: {
    type: DataTypes.DECIMAL(5, 2)
  },
  visibility_to_student: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  graded_at: {
    type: DataTypes.DATE
  },
  released_at: {
    type: DataTypes.DATE
  },
  comments: {
    type: DataTypes.JSONB,
    defaultValue: []
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
  tableName: 'marks'
});

export default Marks;
