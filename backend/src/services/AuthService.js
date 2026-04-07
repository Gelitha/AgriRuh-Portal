// backend/src/services/AuthService.js
// Authentication Service - Handles login, registration, token management

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User } from '../models/index.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

class AuthService {
  /**
   * Register a new user
   */
  static async register(data) {
    const {
      university_id,
      roll_number,
      email,
      first_name,
      last_name,
      password,
      department_id,
      batch,
      degree_code,
      admission_year,
    } = data;

    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        where: { email }
      });

      if (existingUser) {
        throw {
          status: 409,
          code: 'DUPLICATE_USER',
          message: 'User with this email already exists',
        };
      }

      const normalizedUniversityId = university_id || roll_number || `STU-${Date.now()}`;
      const normalizedDepartmentId = department_id || 'BL';
      const normalizedBatch = batch || null;
      const normalizedDegreeCode = degree_code ? String(degree_code).trim().toUpperCase() : null;
      const normalizedAdmissionYear = admission_year ? String(admission_year).trim() : null;

      // Create new user
      const user = await User.create({
        university_id: normalizedUniversityId,
        email,
        password_hash: password,
        first_name,
        last_name,
        department_id: normalizedDepartmentId,
        batch: normalizedBatch,
        degree_code: normalizedDegreeCode,
        admission_year: normalizedAdmissionYear,
        role: 'student',
        is_verified: false
      });

      return {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login user
   */
  static async login(email, password) {
    try {
      // Find user
      const user = await User.findOne({ where: { email } });

      if (!user) {
        throw {
          status: 401,
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        };
      }

      // Check if account is locked
      if (user.isLocked()) {
        throw {
          status: 429,
          code: 'ACCOUNT_LOCKED',
          message: 'Account is locked. Try again later.'
        };
      }

      // Compare password
      const passwordMatch = await user.comparePassword(password);

      if (!passwordMatch) {
        user.failed_login_attempts += 1;
        
        if (user.failed_login_attempts >= 5) {
          user.locked_until = new Date(Date.now() + 15 * 60 * 1000);
        }
        
        await user.save();
        
        throw {
          status: 401,
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        };
      }

      // Reset failed attempts
      user.failed_login_attempts = 0;
      user.last_login = new Date();
      await user.save();

      // Generate tokens
      const tokens = AuthService.generateTokens(user);

      return {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          university_id: user.university_id
        },
        ...tokens
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate JWT tokens
   */
  static generateTokens(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      university_id: user.university_id
    };

    const access_token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    const refresh_token = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });

    return { access_token, refresh_token };
  }

  /**
   * Verify token
   */
  static verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw {
          status: 401,
          code: 'TOKEN_EXPIRED',
          message: 'Token expired'
        };
      }
      throw {
        status: 401,
        code: 'INVALID_TOKEN',
        message: 'Invalid token'
      };
    }
  }

  /**
   * Refresh token
   */
  static refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      const user = { id: decoded.id };
      const tokens = AuthService.generateTokens(user);
      return tokens;
    } catch (error) {
      throw {
        status: 401,
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid refresh token'
      };
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(email, newPassword) {
    try {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        throw {
          status: 404,
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        };
      }

      user.password_hash = newPassword;
      user.failed_login_attempts = 0;
      user.locked_until = null;
      await user.save();

      return { success: true };
    } catch (error) {
      throw error;
    }
  }
}

export default AuthService;
