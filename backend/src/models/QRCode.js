import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const QRCode = sequelize.define('QRCode', {
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
  code: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  qr_image_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  generated_at: {
    type: DataTypes.DATE,
    defaultValue: new Date()
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  scan_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  last_scanned_at: {
    type: DataTypes.DATE
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
  tableName: 'qr_codes'
});

export default QRCode;
