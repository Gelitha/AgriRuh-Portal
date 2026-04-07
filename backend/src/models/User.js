// backend/src/models/User.js
// User Model - Handles user data and operations

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  university_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    index: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
    index: true,
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('student', 'representative', 'lecturer', 'demonstrator', 'admin'),
    allowNull: false,
    defaultValue: 'student',
    index: true,
  },
  department_id: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true,
  },
  batch: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: null,
  },
  degree_code: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: null,
  },
  admission_year: {
    type: DataTypes.STRING(10),
    allowNull: true,
    defaultValue: null,
  },
  recovery_key_hash: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },
  password_reset_token_hash: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },
  password_reset_expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  profile_picture_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  failed_login_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  locked_until: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'users',
});

// Instance methods

const hashPasswordIfNeeded = async (user) => {
  if (user.changed('password_hash')) {
    user.password_hash = await bcrypt.hash(user.password_hash, 10);
  }
};

User.beforeCreate(hashPasswordIfNeeded);
User.beforeUpdate(hashPasswordIfNeeded);

// Compare password
User.prototype.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password_hash);
};

// Get full name
User.prototype.getFullName = function() {
  return `${this.first_name} ${this.last_name}`;
};

// Update last login
User.prototype.updateLastLogin = async function() {
  this.last_login = new Date();
  this.failed_login_attempts = 0;
  this.locked_until = null;
  await this.save();
};

// Increment failed login attempts
User.prototype.incrementFailedAttempts = async function() {
  this.failed_login_attempts += 1;
  if (this.failed_login_attempts >= 5) {
    this.locked_until = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
  }
  await this.save();
};

// Check if account is locked
User.prototype.isLocked = function() {
  return this.locked_until && this.locked_until > new Date();
};

// Get safe user data (without sensitive fields)
User.prototype.toJSON = function() {
  const { password_hash, ...data } = this.dataValues;
  return data;
};

export default User;
