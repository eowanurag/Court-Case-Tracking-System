const db = require('./config/db');
const { sql } = require('drizzle-orm');
const { users, investigationFiles, firCases, hearings, alerts } = require('./db/schema');
const bcrypt = require('bcrypt');

async function seed() {
  console.log('Seeding database...');
  try {
    console.log('Clearing old data...');
    await db.execute(sql`TRUNCATE TABLE users, investigation_files, fir_cases, hearings, alerts, documents, audit_logs CASCADE`);
    
    // 1. Create Admin User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const [adminUser] = await db.insert(users).values({
      name: 'Super Admin',
      email: 'admin@eow.gov.in',
      password: hashedPassword,
      role: 'Admin',
      sector: 'Headquater',
      is_active: true
    }).returning();
    console.log(`✅ Admin created with email: admin@eow.gov.in and password: admin123`);

    // 2. Create an Investigation Officer
    const ioPassword = await bcrypt.hash('io123', salt);
    const [ioUser] = await db.insert(users).values({
      name: 'Rajeev Kumar',
      email: 'rajeev@eow.gov.in',
      password: ioPassword,
      role: 'Investigation Officer',
      sector: 'Lucknow',
      is_active: true
    }).returning();
    console.log(`✅ IO created: rajeev@eow.gov.in / io123`);

    // 3. Create a Pairokar
    const pairokarPassword = await bcrypt.hash('pairokar123', salt);
    const [pairokarUser] = await db.insert(users).values({
      name: 'Amit Verma',
      email: 'amit@eow.gov.in',
      password: pairokarPassword,
      role: 'Pairokar',
      sector: 'Lucknow',
      is_active: true
    }).returning();
    console.log(`✅ Pairokar created: amit@eow.gov.in / pairokar123`);

    // 4. Create Investigation File
    const [invFile] = await db.insert(investigationFiles).values({
      file_no: '045',
      file_year: '2026',
      full_file_no: '045/2026',
      sector_name: 'Lucknow',
      io_id: ioUser.id,
      file_title: 'Fraudulent Land Allocation',
      investigation_status: 'Active',
      remarks: 'Investigation regarding 50 acres of land illegally allocated.'
    }).returning();
    console.log(`✅ Investigation File created`);

    // 5. Create FIR Court Case 1 (Anticipatory Bail)
    const [firCase1] = await db.insert(firCases).values({
      file_id: invFile.id,
      fir_no: '1024',
      fir_year: '2026',
      full_fir_no: '1024/2026',
      district: 'Lucknow',
      police_station: 'LKO Central',
      court_name: 'High Court Lucknow Bench',
      pairokar_id: pairokarUser.id,
      accused_names: 'Rajesh Gupta',
      court_case_type: 'Anticipatory Bail',
      case_initial_date: new Date('2026-05-10'),
      last_hearing_date: new Date('2026-06-01'),
      current_status: 'Under Trial',
      remarks: 'Anticipatory bail plea filed.'
    }).returning();
    console.log(`✅ FIR Case 1 created (Accused: Rajesh Gupta - Anticipatory Bail)`);

    // 5. Create FIR Court Case 2 (Regular Bail)
    const [firCase2] = await db.insert(firCases).values({
      file_id: invFile.id,
      fir_no: '1024',
      fir_year: '2026',
      full_fir_no: '1024/2026', // Note: Same FIR Number
      district: 'Lucknow',
      police_station: 'LKO Central',
      court_name: 'Lucknow District Court',
      pairokar_id: pairokarUser.id,
      accused_names: 'Prakash Sharma, Amit Singh',
      court_case_type: 'Regular Bail',
      case_initial_date: new Date('2026-05-15'),
      last_hearing_date: new Date('2026-06-15'),
      current_status: 'Investigation',
      remarks: 'Arrested, currently applying for regular bail.'
    }).returning();
    console.log(`✅ FIR Case 2 created (Accused: Prakash Sharma, Amit Singh - Regular Bail)`);

    // 5. Create Hearing
    const [hearing] = await db.insert(hearings).values({
      fir_id: firCase2.id,
      hearing_date: new Date('2026-06-15').toISOString(),
      next_hearing_date: new Date('2026-07-20').toISOString(),
      court_status: 'Scheduled',
      remarks: 'Initial bail hearing.'
    }).returning();
    console.log(`✅ Hearing created`);

    // 6. Create Alert
    const [alert] = await db.insert(alerts).values({
      fir_id: firCase2.id,
      alert_type: 'Upcoming Hearing',
      message: 'Bail hearing scheduled for Prakash Sharma',
      assigned_to: ioUser.id,
      priority: 'High',
      status: 'Pending',
      deadline: new Date('2026-06-10').toISOString()
    }).returning();
    console.log(`✅ Alert created`);

    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
