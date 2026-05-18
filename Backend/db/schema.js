const { pgTable, serial, varchar, boolean, timestamp, uuid, integer, text, date } = require('drizzle-orm/pg-core');
const { relations } = require('drizzle-orm');

const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  sector: varchar('sector', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

const investigationFiles = pgTable('investigation_files', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique(),
  file_no: varchar('file_no', { length: 50 }).notNull(),
  file_year: varchar('file_year', { length: 4 }).notNull(),
  full_file_no: varchar('full_file_no', { length: 100 }).unique().notNull(),
  sector_name: varchar('sector_name', { length: 100 }).notNull(),
  io_id: integer('io_id').references(() => users.id, { onDelete: 'set null' }),
  file_title: varchar('file_title', { length: 255 }),
  investigation_status: varchar('investigation_status', { length: 50 }).default('Active'),
  remarks: text('remarks'),
  created_by: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

const firCases = pgTable('fir_cases', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique(),
  file_id: integer('file_id').references(() => investigationFiles.id, { onDelete: 'cascade' }),
  fir_no: varchar('fir_no', { length: 50 }).notNull(),
  fir_year: varchar('fir_year', { length: 4 }).notNull(),
  full_fir_no: varchar('full_fir_no', { length: 150 }).notNull(),
  district: varchar('district', { length: 100 }).notNull(),
  police_station: varchar('police_station', { length: 150 }).notNull(),
  court_name: varchar('court_name', { length: 150 }).notNull(),
  pairokar_id: integer('pairokar_id').references(() => users.id, { onDelete: 'set null' }),
  accused_names: text('accused_names'),
  court_case_type: varchar('court_case_type', { length: 100 }),
  case_initial_date: timestamp('case_initial_date', { withTimezone: true }),
  last_hearing_date: timestamp('last_hearing_date', { withTimezone: true }),
  order_sent_date: timestamp('order_sent_date', { withTimezone: true }),
  due_date: timestamp('due_date', { withTimezone: true }),
  current_status: varchar('current_status', { length: 50 }).default('Investigation'),
  remarks: text('remarks'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

const hearings = pgTable('hearings', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique(),
  fir_id: integer('fir_id').references(() => firCases.id, { onDelete: 'cascade' }),
  hearing_date: date('hearing_date').notNull(),
  next_hearing_date: date('next_hearing_date'),
  court_status: varchar('court_status', { length: 50 }).notNull(),
  remarks: text('remarks'),
  updated_by: integer('updated_by').references(() => users.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

const alerts = pgTable('alerts', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique(),
  fir_id: integer('fir_id').references(() => firCases.id, { onDelete: 'cascade' }),
  alert_type: varchar('alert_type', { length: 100 }).notNull(),
  message: text('message'),
  assigned_to: integer('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  priority: varchar('priority', { length: 20 }).default('Medium'),
  status: varchar('status', { length: 50 }).default('Pending'),
  deadline: date('deadline'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique(),
  fir_id: integer('fir_id').references(() => firCases.id, { onDelete: 'cascade' }),
  hearing_id: integer('hearing_id').references(() => hearings.id, { onDelete: 'cascade' }),
  document_type: varchar('document_type', { length: 100 }).notNull(),
  file_name: varchar('file_name', { length: 255 }).notNull(),
  file_url: varchar('file_url', { length: 500 }).notNull(),
  uploaded_by: integer('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  uploaded_at: timestamp('uploaded_at', { withTimezone: true }).defaultNow(),
});

const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  module_name: varchar('module_name', { length: 100 }).notNull(),
  record_id: integer('record_id'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Relations
const usersRelations = relations(users, ({ many }) => ({
  investigationFiles: many(investigationFiles),
  alerts: many(alerts),
  documents: many(documents),
  hearings: many(hearings),
  auditLogs: many(auditLogs),
}));

const investigationFilesRelations = relations(investigationFiles, ({ one, many }) => ({
  io: one(users, {
    fields: [investigationFiles.io_id],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [investigationFiles.created_by],
    references: [users.id],
  }),
  firCases: many(firCases),
}));

const firCasesRelations = relations(firCases, ({ one, many }) => ({
  investigationFile: one(investigationFiles, {
    fields: [firCases.file_id],
    references: [investigationFiles.id],
  }),
  hearings: many(hearings),
  alerts: many(alerts),
  documents: many(documents),
}));

const hearingsRelations = relations(hearings, ({ one, many }) => ({
  firCase: one(firCases, {
    fields: [hearings.fir_id],
    references: [firCases.id],
  }),
  updatedBy: one(users, {
    fields: [hearings.updated_by],
    references: [users.id],
  }),
  documents: many(documents),
}));

const alertsRelations = relations(alerts, ({ one }) => ({
  firCase: one(firCases, {
    fields: [alerts.fir_id],
    references: [firCases.id],
  }),
  assignedTo: one(users, {
    fields: [alerts.assigned_to],
    references: [users.id],
  }),
}));

const documentsRelations = relations(documents, ({ one }) => ({
  firCase: one(firCases, {
    fields: [documents.fir_id],
    references: [firCases.id],
  }),
  hearing: one(hearings, {
    fields: [documents.hearing_id],
    references: [hearings.id],
  }),
  uploadedBy: one(users, {
    fields: [documents.uploaded_by],
    references: [users.id],
  }),
}));

module.exports = {
  users,
  investigationFiles,
  firCases,
  hearings,
  alerts,
  documents,
  auditLogs,
  usersRelations,
  investigationFilesRelations,
  firCasesRelations,
  hearingsRelations,
  alertsRelations,
  documentsRelations
};
