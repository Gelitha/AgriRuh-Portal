import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const parseBooleanEnv = (value, defaultValue = false) => {
  if (value === undefined) {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const DB_DIALECT = process.env.DB_DIALECT || 'sqlite';
const DB_SSL = parseBooleanEnv(process.env.DB_SSL, DB_DIALECT === 'postgres');
const FACULTY_DEPARTMENTS = [
  ['BL', 'Agricultural Biology'],
  ['EC', 'Agricultural Economics & Extension'],
  ['EN', 'Agricultural Engineering & Environmental Technology'],
  ['AS', 'Animal Science'],
  ['CS', 'Crop Science'],
  ['FS', 'Food Science & Technology'],
  ['SS', 'Soil Science']
];
const VALID_BATCHES = ['44', '45', '46', '47', '48'];
const VALID_SEMESTERS = ['Semester 1', 'Semester 2'];

let sequelize;

if (DB_DIALECT === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || path.join(__dirname, '../../smartlab.db'),
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'smartlab_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: DB_SSL
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: false
            }
          }
        : {},
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

const queryRows = async (sql) => {
  const [rows] = await sequelize.query(sql);
  return rows;
};

const hasSqliteColumn = async (tableName, columnName) => {
  const rows = await queryRows(`PRAGMA table_info(${tableName})`);
  return rows.some((row) => row.name === columnName);
};

const getSqliteIndexes = async (tableName) => queryRows(`PRAGMA index_list(${tableName})`);

const getSqliteIndexColumns = async (indexName) => queryRows(`PRAGMA index_info(${indexName})`);

const getSqliteTableSql = async (tableName) => {
  const rows = await queryRows(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = '${tableName}'`);
  return rows[0]?.sql || '';
};

const rebuildSqliteSubmissionsTable = async () => {
  await sequelize.query('DROP INDEX IF EXISTS submissions_session_id_student_id');
  await sequelize.query('ALTER TABLE submissions RENAME TO submissions_legacy');
  await sequelize.query(`
    CREATE TABLE submissions (
      id UUID PRIMARY KEY,
      session_id UUID NOT NULL,
      student_id UUID NOT NULL,
      submission_time DATETIME NOT NULL,
      status TEXT DEFAULT 'draft',
      submission_method TEXT DEFAULT 'manual_selection',
      file_url VARCHAR(255),
      device_info JSONB DEFAULT '{}',
      location GEOMETRY,
      ip_address INET,
      created_at DATETIME,
      updated_at DATETIME
    )
  `);
  await sequelize.query(`
    INSERT INTO submissions (
      id, session_id, student_id, submission_time, status, submission_method,
      file_url, device_info, location, ip_address, created_at, updated_at
    )
    SELECT
      id, session_id, student_id, submission_time, status, submission_method,
      file_url, device_info, location, ip_address, created_at, updated_at
    FROM submissions_legacy
  `);
  await sequelize.query(`
    CREATE UNIQUE INDEX submissions_session_id_student_id
    ON submissions (session_id, student_id)
  `);
  await sequelize.query('DROP TABLE submissions_legacy');
};

const rebuildSqliteMarksTable = async () => {
  await sequelize.query('DROP TABLE IF EXISTS marks_legacy');
  await sequelize.query('ALTER TABLE marks RENAME TO marks_legacy');
  await sequelize.query(`
    CREATE TABLE marks (
      id UUID UNIQUE PRIMARY KEY,
      submission_id UUID NOT NULL UNIQUE REFERENCES submissions (id),
      grader_id UUID NOT NULL REFERENCES users (id),
      obtained_marks DECIMAL(5,2) NOT NULL,
      total_marks DECIMAL(5,2) NOT NULL,
      percentage DECIMAL(5,2),
      feedback TEXT,
      penalties DECIMAL(5,2) DEFAULT '0',
      final_marks DECIMAL(5,2),
      visibility_to_student TINYINT(1) DEFAULT 0,
      graded_at DATETIME,
      released_at DATETIME,
      comments JSONB DEFAULT '[]',
      created_at DATETIME,
      updated_at DATETIME
    )
  `);
  await sequelize.query(`
    INSERT INTO marks (
      id, submission_id, grader_id, obtained_marks, total_marks, percentage,
      feedback, penalties, final_marks, visibility_to_student, graded_at,
      released_at, comments, created_at, updated_at
    )
    SELECT
      id, submission_id, grader_id, obtained_marks, total_marks, percentage,
      feedback, penalties, final_marks, visibility_to_student, graded_at,
      released_at, comments, created_at, updated_at
    FROM marks_legacy
  `);
  await sequelize.query('DROP TABLE marks_legacy');
};

const ensureSqliteSchema = async () => {
  if (DB_DIALECT !== 'sqlite') {
    return;
  }

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS Departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    )
  `);

  for (const [id, name] of FACULTY_DEPARTMENTS) {
    await sequelize.query(
      'INSERT OR REPLACE INTO Departments (id, name) VALUES (:id, :name)',
      { replacements: { id, name } }
    );
  }

  if (!(await hasSqliteColumn('sessions', 'department_id'))) {
    await sequelize.query(`
      ALTER TABLE sessions
      ADD COLUMN department_id TEXT REFERENCES Departments(id) DEFAULT 'BL'
    `);
  }

  if (!(await hasSqliteColumn('sessions', 'batch'))) {
    await sequelize.query(`
      ALTER TABLE sessions
      ADD COLUMN batch TEXT DEFAULT 'all'
    `);
  }

  if (!(await hasSqliteColumn('sessions', 'semester'))) {
    await sequelize.query(`
      ALTER TABLE sessions
      ADD COLUMN semester TEXT DEFAULT 'Semester 1'
    `);
  }

  if (!(await hasSqliteColumn('sessions', 'attendance_mode'))) {
    await sequelize.query(`
      ALTER TABLE sessions
      ADD COLUMN attendance_mode TEXT DEFAULT 'individual'
    `);
  }

  if (!(await hasSqliteColumn('sessions', 'enrolled_students'))) {
    await sequelize.query(`
      ALTER TABLE sessions
      ADD COLUMN enrolled_students JSON DEFAULT '[]'
    `);
  }

  if (!(await hasSqliteColumn('sessions', 'available_from'))) {
    await sequelize.query(`
      ALTER TABLE sessions
      ADD COLUMN available_from DATETIME
    `);

    await sequelize.query(`
      UPDATE sessions
      SET available_from = COALESCE(available_from, created_at, submission_deadline)
    `);
  }

  const submissionIndexes = await getSqliteIndexes('submissions');
  const hasBrokenSubmissionUniqueIndexes = await Promise.all(
    submissionIndexes
      .filter((index) => index.unique && index.name.startsWith('sqlite_autoindex_submissions_'))
      .map(async (index) => {
        const columns = await getSqliteIndexColumns(index.name);
        return columns.length === 1 && ['session_id', 'student_id'].includes(columns[0]?.name);
      })
  );

  if (hasBrokenSubmissionUniqueIndexes.some(Boolean)) {
    await rebuildSqliteSubmissionsTable();
  }

  const marksTableSql = await getSqliteTableSql('marks');
  if (marksTableSql.includes('submissions_legacy')) {
    await rebuildSqliteMarksTable();
  }

  if (!(await hasSqliteColumn('users', 'batch'))) {
    await sequelize.query(`
      ALTER TABLE users
      ADD COLUMN batch TEXT
    `);
  }

  if (!(await hasSqliteColumn('users', 'degree_code'))) {
    await sequelize.query(`
      ALTER TABLE users
      ADD COLUMN degree_code TEXT
    `);
  }

  if (!(await hasSqliteColumn('users', 'admission_year'))) {
    await sequelize.query(`
      ALTER TABLE users
      ADD COLUMN admission_year TEXT
    `);
  }

  if (!(await hasSqliteColumn('users', 'recovery_key_hash'))) {
    await sequelize.query(`
      ALTER TABLE users
      ADD COLUMN recovery_key_hash TEXT
    `);
  }

  if (!(await hasSqliteColumn('users', 'password_reset_token_hash'))) {
    await sequelize.query(`
      ALTER TABLE users
      ADD COLUMN password_reset_token_hash TEXT
    `);
  }

  if (!(await hasSqliteColumn('users', 'password_reset_expires_at'))) {
    await sequelize.query(`
      ALTER TABLE users
      ADD COLUMN password_reset_expires_at DATETIME
    `);
  }

  const validDepartmentIds = FACULTY_DEPARTMENTS.map(([id]) => `'${id}'`).join(', ');
  const validBatchValues = VALID_BATCHES.map((value) => `'${value}'`).join(', ');
  const validSemesterValues = VALID_SEMESTERS.map((value) => `'${value}'`).join(', ');
  await sequelize.query(`
    UPDATE users
    SET department_id = 'BL'
    WHERE department_id IS NULL OR department_id NOT IN (${validDepartmentIds})
  `);
  await sequelize.query(`
    UPDATE users
    SET batch = '47'
    WHERE batch IS NULL OR TRIM(batch) = '' OR batch NOT IN (${validBatchValues})
  `);
  await sequelize.query(`
    UPDATE sessions
    SET department_id = 'BL'
    WHERE department_id IS NULL OR department_id NOT IN (${validDepartmentIds})
  `);
  await sequelize.query(`
    UPDATE sessions
    SET batch = 'all'
    WHERE batch IS NULL OR TRIM(batch) = ''
  `);
  await sequelize.query(`
    UPDATE sessions
    SET semester = 'Semester 1'
    WHERE semester IS NULL OR semester NOT IN (${validSemesterValues})
  `);
  await sequelize.query(`
    UPDATE sessions
    SET attendance_mode = 'individual'
    WHERE attendance_mode IS NULL OR attendance_mode NOT IN ('individual', 'representative_batch')
  `);
  await sequelize.query(`
    UPDATE sessions
    SET enrolled_students = '[]'
    WHERE enrolled_students IS NULL OR TRIM(CAST(enrolled_students AS TEXT)) = ''
  `);
  await sequelize.query(`
    DELETE FROM Departments
    WHERE id NOT IN (${validDepartmentIds})
  `);
};

const ensureDefaultUsers = async () => {
  if (DB_DIALECT !== 'sqlite') {
    return;
  }

  const existingUsers = await sequelize.query(
    'SELECT COUNT(*) as count FROM users',
    { type: Sequelize.QueryTypes.SELECT }
  );

  if (Number(existingUsers[0]?.count || 0) > 0) {
    return;
  }

  const now = new Date().toISOString();
  const demoPasswordHash = await bcrypt.hash('Demo@123', 10);

  await sequelize.query(
    `
      INSERT OR IGNORE INTO users (
        id, university_id, email, first_name, last_name, password_hash, role,
        department_id, batch, is_active, is_verified, failed_login_attempts, createdAt, updatedAt
      ) VALUES (
        :id, :university_id, :email, :first_name, :last_name, :password_hash, :role,
        :department_id, :batch, :is_active, :is_verified, :failed_login_attempts, :createdAt, :updatedAt
      )
    `,
    {
      replacements: {
        id: crypto.randomUUID(),
        university_id: 'ADMIN-AGR-001',
        email: 'admin.portal@agri.demo',
        first_name: 'Niroshan',
        last_name: 'Perera',
        password_hash: demoPasswordHash,
        role: 'admin',
        department_id: 'BL',
        batch: null,
        is_active: 1,
        is_verified: 1,
        failed_login_attempts: 0,
        createdAt: now,
        updatedAt: now
      }
    }
  );

  await sequelize.query(
    `
      INSERT OR IGNORE INTO users (
        id, university_id, email, first_name, last_name, password_hash, role,
        department_id, batch, is_active, is_verified, failed_login_attempts, createdAt, updatedAt
      ) VALUES (
        :id, :university_id, :email, :first_name, :last_name, :password_hash, :role,
        :department_id, :batch, :is_active, :is_verified, :failed_login_attempts, :createdAt, :updatedAt
      )
    `,
    {
      replacements: {
        id: crypto.randomUUID(),
        university_id: 'BL-47-021',
        email: 'anudi.peiris@agri.demo',
        first_name: 'Anudi',
        last_name: 'Peiris',
        password_hash: demoPasswordHash,
        role: 'student',
        department_id: 'BL',
        batch: '47',
        is_active: 1,
        is_verified: 1,
        failed_login_attempts: 0,
        createdAt: now,
        updatedAt: now
      }
    }
  );
};

export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
};

export const syncDatabase = async (force = false) => {
  try {
    const alter = parseBooleanEnv(process.env.DB_SYNC_ALTER, false);
    await sequelize.sync({ force, alter });
    await ensureSqliteSchema();
    await ensureDefaultUsers();
    console.log(`Database synchronized${alter ? ' with alter' : ''}`);
    return true;
  } catch (error) {
    console.error('Database sync failed:', error.message);
    return false;
  }
};

export default sequelize;
