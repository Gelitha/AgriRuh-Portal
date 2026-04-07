import sequelize, { testConnection, syncDatabase } from '../src/config/database.js';
import { AttendanceSubmission, Marks, QRCode, Session, Submission, User } from '../src/models/index.js';
import { fileURLToPath } from 'url';

const DEMO_PASSWORD = 'Demo@123';
const QR_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const buildStudentSnapshot = (users) => users.map((user) => ({
  id: user.university_id,
  name: `${user.first_name} ${user.last_name}`
}));

const createDeviceInfo = (platform, browser, os) => ({ platform, browser, os });

export const seedDatabase = async ({ closeConnection = true, exitOnComplete = true } = {}) => {
  try {
    console.log('Starting database seeding for the client demo...');

    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    console.log('Resetting database schema...');
    await syncDatabase(true);

    console.log('Removing default bootstrap records...');
    await Marks.destroy({ where: {}, force: true });
    await Submission.destroy({ where: {}, force: true });
    await AttendanceSubmission.destroy({ where: {}, force: true });
    await QRCode.destroy({ where: {}, force: true });
    await Session.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    const now = new Date();
    const sixHours = 6 * 60 * 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;

    console.log('Creating polished demo user accounts...');
    const users = await User.bulkCreate([
      {
        university_id: 'ADMIN-AGR-001',
        email: 'admin.portal@agri.demo',
        password_hash: DEMO_PASSWORD,
        first_name: 'Niroshan',
        last_name: 'Perera',
        role: 'admin',
        department_id: 'BL',
        phone: '+94 71 555 0101',
        is_active: true,
        is_verified: true
      },
      {
        university_id: 'BL-LECT-047',
        email: 'lecturer.crop@agri.demo',
        password_hash: DEMO_PASSWORD,
        first_name: 'Malithi',
        last_name: 'Senanayake',
        role: 'lecturer',
        department_id: 'BL',
        phone: '+94 71 555 0102',
        is_active: true,
        is_verified: true
      },
      {
        university_id: 'BL-DEMO-012',
        email: 'demo.soil@agri.demo',
        password_hash: DEMO_PASSWORD,
        first_name: 'Kavindu',
        last_name: 'Fernando',
        role: 'demonstrator',
        department_id: 'BL',
        phone: '+94 71 555 0103',
        is_active: true,
        is_verified: true
      },
      {
        university_id: 'BL-47-REP-08',
        email: 'rep.batch47@agri.demo',
        password_hash: DEMO_PASSWORD,
        first_name: 'Tharushi',
        last_name: 'Wickrama',
        role: 'representative',
        department_id: 'BL',
        batch: '47',
        degree_code: 'AGR',
        admission_year: '2024',
        phone: '+94 71 555 0104',
        is_active: true,
        is_verified: true
      },
      {
        university_id: 'BL-47-021',
        email: 'anudi.peiris@agri.demo',
        password_hash: DEMO_PASSWORD,
        first_name: 'Anudi',
        last_name: 'Peiris',
        role: 'student',
        department_id: 'BL',
        batch: '47',
        degree_code: 'AGR',
        admission_year: '2024',
        phone: '+94 71 555 0105',
        is_active: true,
        is_verified: true
      },
      {
        university_id: 'BL-47-034',
        email: 'nadeesha.lakshan@agri.demo',
        password_hash: DEMO_PASSWORD,
        first_name: 'Nadeesha',
        last_name: 'Lakshan',
        role: 'student',
        department_id: 'BL',
        batch: '47',
        degree_code: 'AGR',
        admission_year: '2024',
        phone: '+94 71 555 0106',
        is_active: true,
        is_verified: true
      },
      {
        university_id: 'BL-47-041',
        email: 'kavishka.silva@agri.demo',
        password_hash: DEMO_PASSWORD,
        first_name: 'Kavishka',
        last_name: 'Silva',
        role: 'student',
        department_id: 'BL',
        batch: '47',
        degree_code: 'AGR',
        admission_year: '2024',
        phone: '+94 71 555 0107',
        is_active: true,
        is_verified: true
      }
    ], { individualHooks: true });

    const accountMap = Object.fromEntries(users.map((user) => [user.email, user]));
    const admin = accountMap['admin.portal@agri.demo'];
    const lecturer = accountMap['lecturer.crop@agri.demo'];
    const demonstrator = accountMap['demo.soil@agri.demo'];
    const representative = accountMap['rep.batch47@agri.demo'];
    const anudi = accountMap['anudi.peiris@agri.demo'];
    const nadeesha = accountMap['nadeesha.lakshan@agri.demo'];
    const kavishka = accountMap['kavishka.silva@agri.demo'];
    const batch47Students = [representative, anudi, nadeesha, kavishka];
    const enrolledStudents = buildStudentSnapshot(batch47Students);

    console.log(`Created ${users.length} demo users`);

    console.log('Creating meaningful lab sessions...');
    const sessions = await Session.bulkCreate([
      {
        subject: 'Plant Tissue Culture',
        session_title: 'Media Preparation and Sterile Technique Checkpoint',
        available_from: new Date(now.getTime() - 2 * sixHours),
        department_id: 'BL',
        batch: '47',
        semester: 'Semester 1',
        attendance_mode: 'individual',
        enrolled_students: enrolledStudents,
        created_by: lecturer.id,
        submission_deadline: new Date(now.getTime() + sixHours),
        late_submission_deadline: new Date(now.getTime() + oneDay),
        late_submission_window: true,
        status: 'active',
        notes: 'Students should upload their sterile workflow sheet and media preparation checklist.',
        instructions: 'Use the QR workflow during the lab or submit manually before the evening deadline.'
      },
      {
        subject: 'Seed Technology',
        session_title: 'Batch 47 Germination Trial Attendance Confirmation',
        available_from: new Date(now.getTime() - oneDay),
        department_id: 'BL',
        batch: '47',
        semester: 'Semester 1',
        attendance_mode: 'representative_batch',
        enrolled_students: enrolledStudents,
        created_by: lecturer.id,
        submission_deadline: new Date(now.getTime() + 4 * sixHours),
        late_submission_deadline: new Date(now.getTime() + 2 * oneDay),
        late_submission_window: true,
        status: 'active',
        notes: 'Representative confirms attendance after the greenhouse germination trial briefing.',
        instructions: 'Representative should confirm present and absent students with a short note on late arrivals.'
      },
      {
        subject: 'Soil Chemistry',
        session_title: 'pH Mapping and Nutrient Interpretation Report',
        available_from: new Date(now.getTime() - 8 * oneDay),
        department_id: 'BL',
        batch: '47',
        semester: 'Semester 1',
        attendance_mode: 'individual',
        enrolled_students: enrolledStudents,
        created_by: demonstrator.id,
        submission_deadline: new Date(now.getTime() - 5 * oneDay),
        late_submission_deadline: new Date(now.getTime() - 4 * oneDay),
        late_submission_window: false,
        status: 'closed',
        notes: 'This closed session gives the dashboard some grading history for the client demo.',
        instructions: 'Students submitted a short interpretation of soil pH variation across the field plots.'
      }
    ]);

    const [tissueCultureSession, attendanceSession, soilChemistrySession] = sessions;
    console.log(`Created ${sessions.length} demo sessions`);

    console.log('Generating session QR records...');
    const qrCodes = await QRCode.bulkCreate([
      {
        session_id: tissueCultureSession.id,
        code: `http://localhost:5000/submit?session=${tissueCultureSession.id}`,
        qr_image_url: QR_PIXEL,
        expires_at: new Date(now.getTime() + oneDay),
        is_active: true,
        scan_count: 12,
        last_scanned_at: new Date(now.getTime() - 45 * 60 * 1000)
      },
      {
        session_id: attendanceSession.id,
        code: `http://localhost:5000/submit?session=${attendanceSession.id}`,
        qr_image_url: QR_PIXEL,
        expires_at: new Date(now.getTime() + oneDay),
        is_active: true,
        scan_count: 5,
        last_scanned_at: new Date(now.getTime() - 90 * 60 * 1000)
      },
      {
        session_id: soilChemistrySession.id,
        code: `http://localhost:5000/submit?session=${soilChemistrySession.id}`,
        qr_image_url: QR_PIXEL,
        expires_at: new Date(now.getTime() - 4 * oneDay),
        is_active: false,
        scan_count: 18,
        last_scanned_at: new Date(now.getTime() - 5 * oneDay)
      }
    ]);

    tissueCultureSession.qr_code_id = qrCodes[0].id;
    attendanceSession.qr_code_id = qrCodes[1].id;
    soilChemistrySession.qr_code_id = qrCodes[2].id;
    await Promise.all([
      tissueCultureSession.save(),
      attendanceSession.save(),
      soilChemistrySession.save()
    ]);

    console.log(`Created ${qrCodes.length} QR code records`);

    console.log('Creating submissions and grade history...');
    const submissions = await Submission.bulkCreate([
      {
        session_id: tissueCultureSession.id,
        student_id: anudi.id,
        submission_time: new Date(now.getTime() - 70 * 60 * 1000),
        status: 'on_time',
        submission_method: 'qr_scan',
        file_url: 'submissions/demo/tissue-culture/anudi-peiris.pdf',
        device_info: createDeviceInfo('web', 'Chrome', 'Windows 11'),
        ip_address: '192.168.10.21'
      },
      {
        session_id: tissueCultureSession.id,
        student_id: nadeesha.id,
        submission_time: new Date(now.getTime() - 15 * 60 * 1000),
        status: 'on_time',
        submission_method: 'manual_selection',
        file_url: 'submissions/demo/tissue-culture/nadeesha-lakshan.pdf',
        device_info: createDeviceInfo('mobile', 'Safari', 'iOS'),
        ip_address: '192.168.10.22'
      },
      {
        session_id: soilChemistrySession.id,
        student_id: anudi.id,
        submission_time: new Date(now.getTime() - 5 * oneDay - 2 * 60 * 60 * 1000),
        status: 'on_time',
        submission_method: 'manual_selection',
        file_url: 'submissions/demo/soil-chemistry/anudi-peiris.pdf',
        device_info: createDeviceInfo('web', 'Firefox', 'Ubuntu'),
        ip_address: '192.168.10.23'
      },
      {
        session_id: soilChemistrySession.id,
        student_id: kavishka.id,
        submission_time: new Date(now.getTime() - 4 * oneDay - 6 * 60 * 60 * 1000),
        status: 'late',
        submission_method: 'qr_scan',
        file_url: 'submissions/demo/soil-chemistry/kavishka-silva.pdf',
        device_info: createDeviceInfo('web', 'Edge', 'Windows 10'),
        ip_address: '192.168.10.24'
      }
    ]);

    const [anudiTissueSubmission, nadeeshaTissueSubmission, anudiSoilSubmission, kavishkaSoilSubmission] = submissions;

    await Marks.bulkCreate([
      {
        submission_id: anudiTissueSubmission.id,
        grader_id: lecturer.id,
        obtained_marks: 46,
        total_marks: 50,
        percentage: 92,
        penalties: 0,
        final_marks: 46,
        feedback: 'Excellent sterile workflow notes and a complete media preparation checklist.',
        comments: [
          { rubric: 'Lab readiness', score: 'A', comment: 'Prepared with all media quantities recorded.' },
          { rubric: 'Technique', score: 'A', comment: 'Clear contamination prevention steps.' }
        ],
        visibility_to_student: true,
        graded_at: new Date(now.getTime() - 30 * 60 * 1000),
        released_at: new Date(now.getTime() - 15 * 60 * 1000)
      },
      {
        submission_id: anudiSoilSubmission.id,
        grader_id: demonstrator.id,
        obtained_marks: 44,
        total_marks: 50,
        percentage: 88,
        penalties: 0,
        final_marks: 44,
        feedback: 'Very good interpretation of pH variation and likely nutrient constraints.',
        comments: [
          { rubric: 'Analysis', score: 'A-', comment: 'Strong comparison across field plots.' },
          { rubric: 'Presentation', score: 'B+', comment: 'Add one clearer chart title next time.' }
        ],
        visibility_to_student: true,
        graded_at: new Date(now.getTime() - 3 * oneDay),
        released_at: new Date(now.getTime() - 2 * oneDay)
      },
      {
        submission_id: kavishkaSoilSubmission.id,
        grader_id: demonstrator.id,
        obtained_marks: 40,
        total_marks: 50,
        percentage: 80,
        penalties: 4,
        final_marks: 36,
        feedback: 'Good observations, but the report was submitted late and needed stronger nutrient recommendations.',
        comments: [
          { rubric: 'Analysis', score: 'B', comment: 'Reasonable interpretation with room for deeper justification.' },
          { rubric: 'Timeliness', score: 'C', comment: 'Late submission penalty applied.' }
        ],
        visibility_to_student: true,
        graded_at: new Date(now.getTime() - 3 * oneDay),
        released_at: new Date(now.getTime() - 2 * oneDay)
      }
    ]);

    console.log(`Created ${submissions.length} submissions and 3 marks records`);

    console.log('Creating representative attendance confirmation...');
    await AttendanceSubmission.create({
      session_id: attendanceSession.id,
      representative_id: representative.id,
      department_id: 'BL',
      batch: '47',
      confirmation_status: 'confirmed',
      attendees_present: 3,
      attendees_absent: 1,
      attendance_records: [
        { id: representative.university_id, name: `${representative.first_name} ${representative.last_name}`, status: 'present' },
        { id: anudi.university_id, name: `${anudi.first_name} ${anudi.last_name}`, status: 'present' },
        { id: nadeesha.university_id, name: `${nadeesha.first_name} ${nadeesha.last_name}`, status: 'present' },
        { id: kavishka.university_id, name: `${kavishka.first_name} ${kavishka.last_name}`, status: 'absent' }
      ],
      enrolled_snapshot: enrolledStudents,
      notes: 'Kavishka informed the rep about a transport delay and missed the first greenhouse briefing.'
    });

    console.log('Client demo seed completed successfully.');
    console.log('');
    console.log('Demo logins for testing:');
    console.log(`  Admin:          admin.portal@agri.demo / ${DEMO_PASSWORD}`);
    console.log(`  Lecturer:       lecturer.crop@agri.demo / ${DEMO_PASSWORD}`);
    console.log(`  Demonstrator:   demo.soil@agri.demo / ${DEMO_PASSWORD}`);
    console.log(`  Representative: rep.batch47@agri.demo / ${DEMO_PASSWORD}`);
    console.log(`  Student:        anudi.peiris@agri.demo / ${DEMO_PASSWORD}`);

    if (closeConnection) {
      await sequelize.close();
    }

    if (exitOnComplete) {
      process.exit(0);
    }
  } catch (error) {
    console.error('Seeding failed:', error.message);
    console.error(error);

    if (closeConnection) {
      await sequelize.close();
    }

    if (exitOnComplete) {
      process.exit(1);
    }

    throw error;
  }
};

const isDirectExecution = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectExecution) {
  seedDatabase();
}
