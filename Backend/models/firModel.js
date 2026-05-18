const db = require('../config/db');
const { firCases, investigationFiles, users } = require('../db/schema');
const { eq, and, desc, ilike, or, gte, lte } = require('drizzle-orm');

// Alias for pairokar join
const pairoka = users;

const firModel = {
  create: async (firData) => {
    const { file_id, fir_no, fir_year, full_fir_no, district, police_station, court_name, pairokar_id, accused_names, court_case_type, case_initial_date, last_hearing_date, order_sent_date, due_date, current_status, remarks } = firData;
    const [fir] = await db.insert(firCases)
      .values({ 
        file_id, fir_no, fir_year, full_fir_no, district, police_station, court_name, 
        pairokar_id: pairokar_id || null, 
        accused_names, court_case_type, 
        case_initial_date: case_initial_date ? new Date(case_initial_date) : null,
        last_hearing_date: last_hearing_date ? new Date(last_hearing_date) : null,
        order_sent_date: order_sent_date ? new Date(order_sent_date) : null,
        due_date: due_date ? new Date(due_date) : null,
        current_status, remarks 
      })
      .returning();
    return fir;
  },

  findById: async (id) => {
    const result = await db.select({
      id: firCases.id,
      uuid: firCases.uuid,
      file_id: firCases.file_id,
      fir_no: firCases.fir_no,
      fir_year: firCases.fir_year,
      full_fir_no: firCases.full_fir_no,
      district: firCases.district,
      police_station: firCases.police_station,
      court_name: firCases.court_name,
      pairokar_id: firCases.pairokar_id,
      accused_names: firCases.accused_names,
      court_case_type: firCases.court_case_type,
      case_initial_date: firCases.case_initial_date,
      last_hearing_date: firCases.last_hearing_date,
      order_sent_date: firCases.order_sent_date,
      due_date: firCases.due_date,
      current_status: firCases.current_status,
      remarks: firCases.remarks,
      created_at: firCases.created_at,
      updated_at: firCases.updated_at,
      full_file_no: investigationFiles.full_file_no
    })
    .from(firCases)
    .leftJoin(investigationFiles, eq(firCases.file_id, investigationFiles.id))
    .where(eq(firCases.id, id));
    
    return result[0];
  },

  findAll: async (filters = {}) => {
    const conditions = [];

    if (filters.search) {
      conditions.push(
        or(
          ilike(firCases.full_fir_no, `%${filters.search}%`),
          ilike(firCases.court_name, `%${filters.search}%`)
        )
      );
    }

    if (filters.district) {
      conditions.push(eq(firCases.district, filters.district));
    }

    if (filters.current_status) {
      conditions.push(eq(firCases.current_status, filters.current_status));
    }

    if (filters.file_id) {
      conditions.push(eq(firCases.file_id, parseInt(filters.file_id)));
    }

    if (filters.io_id) {
       conditions.push(eq(investigationFiles.io_id, filters.io_id));
    }

    if (filters.pairokar_id) {
      conditions.push(eq(firCases.pairokar_id, filters.pairokar_id));
    }

    const dateColumn = filters.dateType === 'initial_date' ? firCases.case_initial_date : firCases.last_hearing_date;

    if (filters.startDate) {
      conditions.push(gte(dateColumn, new Date(filters.startDate)));
    }

    if (filters.endDate) {
      conditions.push(lte(dateColumn, new Date(filters.endDate)));
    }

    // Use sql alias for the users table joined twice
    const { sql } = require('drizzle-orm');

    let query = db.select({
      id: firCases.id,
      uuid: firCases.uuid,
      file_id: firCases.file_id,
      fir_no: firCases.fir_no,
      fir_year: firCases.fir_year,
      full_fir_no: firCases.full_fir_no,
      district: firCases.district,
      police_station: firCases.police_station,
      court_name: firCases.court_name,
      pairokar_id: firCases.pairokar_id,
      accused_names: firCases.accused_names,
      court_case_type: firCases.court_case_type,
      case_initial_date: firCases.case_initial_date,
      last_hearing_date: firCases.last_hearing_date,
      order_sent_date: firCases.order_sent_date,
      due_date: firCases.due_date,
      current_status: firCases.current_status,
      remarks: firCases.remarks,
      created_at: firCases.created_at,
      updated_at: firCases.updated_at,
      full_file_no: investigationFiles.full_file_no,
      io_id: investigationFiles.io_id,
      pairokar_name: sql`pairokar_user.name`
    })
    .from(firCases)
    .leftJoin(investigationFiles, eq(firCases.file_id, investigationFiles.id))
    .leftJoin(
      sql`users as pairokar_user`,
      sql`fir_cases.pairokar_id = pairokar_user.id`
    );

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(firCases.created_at));

    if (filters.limit && filters.offset !== undefined) {
      query = query.limit(filters.limit).offset(filters.offset);
    }

    return await query;
  },

  update: async (id, updateData) => {
    const { district, police_station, court_name, pairokar_id, accused_names, court_case_type, case_initial_date, last_hearing_date, order_sent_date, due_date, current_status, remarks } = updateData;
    const setData = { 
      district, police_station, court_name, current_status, remarks, updated_at: new Date(),
      accused_names, court_case_type
    };
    if (case_initial_date !== undefined) setData.case_initial_date = case_initial_date ? new Date(case_initial_date) : null;
    if (last_hearing_date !== undefined) setData.last_hearing_date = last_hearing_date ? new Date(last_hearing_date) : null;
    if (order_sent_date !== undefined) setData.order_sent_date = order_sent_date ? new Date(order_sent_date) : null;
    if (due_date !== undefined) setData.due_date = due_date ? new Date(due_date) : null;
    if (pairokar_id !== undefined) setData.pairokar_id = pairokar_id || null;
    
    const [fir] = await db.update(firCases)
      .set(setData)
      .where(eq(firCases.id, id))
      .returning();
    return fir;
  },

  delete: async (id) => {
    const [fir] = await db.delete(firCases)
      .where(eq(firCases.id, id))
      .returning({ id: firCases.id });
    return fir;
  }
};

module.exports = firModel;
