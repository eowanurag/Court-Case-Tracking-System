const db = require('../config/db');
const { alerts, firCases, users } = require('../db/schema');
const { eq, and, desc } = require('drizzle-orm');

const alertModel = {
  create: async (alertData) => {
    const { fir_id, alert_type, message, assigned_to, priority, deadline } = alertData;
    const [alert] = await db.insert(alerts)
      .values({ fir_id, alert_type, message, assigned_to, priority, deadline })
      .returning();
    return alert;
  },

  findById: async (id) => {
    const [alert] = await db.select().from(alerts).where(eq(alerts.id, id));
    return alert;
  },

  findAll: async (filters = {}) => {
    const conditions = [];

    if (filters.status) {
      conditions.push(eq(alerts.status, filters.status));
    }

    if (filters.priority) {
      conditions.push(eq(alerts.priority, filters.priority));
    }

    if (filters.assigned_to) {
      conditions.push(eq(alerts.assigned_to, filters.assigned_to));
    }

    let query = db.select({
      id: alerts.id,
      uuid: alerts.uuid,
      fir_id: alerts.fir_id,
      alert_type: alerts.alert_type,
      message: alerts.message,
      assigned_to: alerts.assigned_to,
      priority: alerts.priority,
      status: alerts.status,
      deadline: alerts.deadline,
      created_at: alerts.created_at,
      updated_at: alerts.updated_at,
      full_fir_no: firCases.full_fir_no,
      assigned_to_name: users.name
    })
    .from(alerts)
    .leftJoin(firCases, eq(alerts.fir_id, firCases.id))
    .leftJoin(users, eq(alerts.assigned_to, users.id));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(alerts.created_at));

    return await query;
  },

  update: async (id, updateData) => {
    const { status, assigned_to } = updateData;
    
    // We only update the fields provided, but Drizzle uses undefined to ignore fields.
    // However, JS object destructuring handles this. Let's build the set object.
    const updateObj = { updated_at: new Date() };
    if (status !== undefined) updateObj.status = status;
    if (assigned_to !== undefined) updateObj.assigned_to = assigned_to;

    const [alert] = await db.update(alerts)
      .set(updateObj)
      .where(eq(alerts.id, id))
      .returning();
    return alert;
  },

  delete: async (id) => {
    const [alert] = await db.delete(alerts).where(eq(alerts.id, id)).returning({ id: alerts.id });
    return alert;
  }
};

module.exports = alertModel;
