const db = require('../config/db');
const { hearings, firCases, alerts, users, investigationFiles } = require('../db/schema');
const { eq, gte, asc, sql, desc, and } = require('drizzle-orm');
const { successResponse } = require('../utils/response');

const getDailyHearings = async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const conditions = [eq(hearings.hearing_date, targetDate)];

    if (req.user.role.toLowerCase() === 'investigation officer') {
      conditions.push(eq(investigationFiles.io_id, req.user.id));
    } else if (req.user.role.toLowerCase() === 'pairokar') {
      conditions.push(eq(firCases.pairokar_id, req.user.id));
    }

    const result = await db.select({
        id: hearings.id,
        hearing_date: hearings.hearing_date,
        court_status: hearings.court_status,
        full_fir_no: firCases.full_fir_no,
        court_name: firCases.court_name
      })
      .from(hearings)
      .innerJoin(firCases, eq(hearings.fir_id, firCases.id))
      .innerJoin(investigationFiles, eq(firCases.file_id, investigationFiles.id))
      .where(and(...conditions))
      .orderBy(asc(firCases.court_name));
    
    return successResponse(res, 200, 'Daily hearings fetched', { date: targetDate, count: result.length, hearings: result });
  } catch (err) {
    next(err);
  }
};

const getUpcomingHearings = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const conditions = [gte(hearings.next_hearing_date, today)];

    if (req.user.role.toLowerCase() === 'investigation officer') {
      conditions.push(eq(investigationFiles.io_id, req.user.id));
    } else if (req.user.role.toLowerCase() === 'pairokar') {
      conditions.push(eq(firCases.pairokar_id, req.user.id));
    }
    
    const result = await db.select({
        id: hearings.id,
        next_hearing_date: hearings.next_hearing_date,
        court_status: hearings.court_status,
        full_fir_no: firCases.full_fir_no,
        court_name: firCases.court_name
      })
      .from(hearings)
      .innerJoin(firCases, eq(hearings.fir_id, firCases.id))
      .innerJoin(investigationFiles, eq(firCases.file_id, investigationFiles.id))
      .where(and(...conditions))
      .orderBy(asc(hearings.next_hearing_date));
    
    return successResponse(res, 200, 'Upcoming hearings fetched', { count: result.length, hearings: result });
  } catch (err) {
    next(err);
  }
};

const getPendingCompliance = async (req, res, next) => {
  try {
    const conditions = [eq(alerts.status, 'Pending')];

    if (req.user.role.toLowerCase() === 'investigation officer') {
      conditions.push(eq(investigationFiles.io_id, req.user.id));
    } else if (req.user.role.toLowerCase() === 'pairokar') {
      conditions.push(eq(firCases.pairokar_id, req.user.id));
    }

    // Custom sort order based on Priority
    const priorityOrder = sql`
      CASE ${alerts.priority} 
        WHEN 'Urgent' THEN 1 
        WHEN 'High' THEN 2 
        WHEN 'Medium' THEN 3 
        ELSE 4 
      END
    `;

    const result = await db.select({
        id: alerts.id,
        alert_type: alerts.alert_type,
        priority: alerts.priority,
        deadline: alerts.deadline,
        full_fir_no: firCases.full_fir_no,
        assigned_io: users.name
      })
      .from(alerts)
      .innerJoin(firCases, eq(alerts.fir_id, firCases.id))
      .innerJoin(investigationFiles, eq(firCases.file_id, investigationFiles.id))
      .leftJoin(users, eq(alerts.assigned_to, users.id))
      .where(and(...conditions))
      .orderBy(asc(priorityOrder), asc(alerts.deadline));
    
    return successResponse(res, 200, 'Pending compliance fetched', { count: result.length, alerts: result });
  } catch (err) {
    next(err);
  }
};

const getSectorSummary = async (req, res, next) => {
  try {
    const activeCount = sql`COUNT(DISTINCT CASE WHEN ${investigationFiles.investigation_status} = 'Active' THEN ${investigationFiles.id} END)`.mapWith(Number);
    const closedCount = sql`COUNT(DISTINCT CASE WHEN ${investigationFiles.investigation_status} = 'Closed' THEN ${investigationFiles.id} END)`.mapWith(Number);
    
    let query = db.select({
        sector_name: investigationFiles.sector_name,
        total_files: sql`COUNT(DISTINCT ${investigationFiles.id})`.mapWith(Number),
        active_files: activeCount,
        closed_files: closedCount
      })
      .from(investigationFiles);

    if (req.user.role.toLowerCase() === 'investigation officer') {
      query = query.where(eq(investigationFiles.io_id, req.user.id));
    } else if (req.user.role.toLowerCase() === 'pairokar') {
      // For pairokar, we need to join with firCases to check pairokar_id
      query = query.innerJoin(firCases, eq(investigationFiles.id, firCases.file_id))
                   .where(eq(firCases.pairokar_id, req.user.id));
    }

    const result = await query.groupBy(investigationFiles.sector_name);
    
    return successResponse(res, 200, 'Sector summary fetched', { summary: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDailyHearings,
  getUpcomingHearings,
  getPendingCompliance,
  getSectorSummary
};
