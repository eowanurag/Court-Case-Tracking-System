const db = require('../config/db');
const { hearings, firCases, users } = require('../db/schema');
const { eq, and, desc } = require('drizzle-orm');

const hearingModel = {
  create: async (hearingData) => {
    const { fir_id, hearing_date, next_hearing_date, court_status, remarks, updated_by } = hearingData;
    const [hearing] = await db.insert(hearings)
      .values({ fir_id, hearing_date, next_hearing_date, court_status, remarks, updated_by })
      .returning();
    return hearing;
  },

  findById: async (id) => {
    const [hearing] = await db.select().from(hearings).where(eq(hearings.id, id));
    return hearing;
  },

  findAll: async (filters = {}) => {
    const conditions = [];

    if (filters.fir_id) {
      conditions.push(eq(hearings.fir_id, filters.fir_id));
    }

    if (filters.court_status) {
      conditions.push(eq(hearings.court_status, filters.court_status));
    }

    if (filters.hearing_date) {
      conditions.push(eq(hearings.hearing_date, filters.hearing_date));
    }

    let query = db.select({
      id: hearings.id,
      uuid: hearings.uuid,
      fir_id: hearings.fir_id,
      hearing_date: hearings.hearing_date,
      next_hearing_date: hearings.next_hearing_date,
      court_status: hearings.court_status,
      remarks: hearings.remarks,
      updated_by: hearings.updated_by,
      created_at: hearings.created_at,
      updated_at: hearings.updated_at,
      full_fir_no: firCases.full_fir_no,
      accused_names: firCases.accused_names,
      court_name: firCases.court_name,
      updated_by_name: users.name
    })
    .from(hearings)
    .leftJoin(firCases, eq(hearings.fir_id, firCases.id))
    .leftJoin(users, eq(hearings.updated_by, users.id));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(hearings.hearing_date));

    if (filters.limit && filters.offset !== undefined) {
      query = query.limit(filters.limit).offset(filters.offset);
    }

    return await query;
  },

  update: async (id, updateData) => {
    const { hearing_date, next_hearing_date, court_status, remarks, updated_by } = updateData;
    const [hearing] = await db.update(hearings)
      .set({ hearing_date, next_hearing_date, court_status, remarks, updated_by, updated_at: new Date() })
      .where(eq(hearings.id, id))
      .returning();
    return hearing;
  },

  delete: async (id) => {
    const [hearing] = await db.delete(hearings).where(eq(hearings.id, id)).returning({ id: hearings.id });
    return hearing;
  }
};

module.exports = hearingModel;
