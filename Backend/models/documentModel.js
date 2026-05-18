const db = require('../config/db');
const { documents, firCases, users, investigationFiles } = require('../db/schema');
const { eq, and, desc } = require('drizzle-orm');

const documentModel = {
  create: async (docData) => {
    const { fir_id, hearing_id, document_type, file_name, file_url, uploaded_by } = docData;
    const [doc] = await db.insert(documents)
      .values({ fir_id, hearing_id: hearing_id || null, document_type, file_name, file_url, uploaded_by })
      .returning();
    return doc;
  },

  findById: async (id) => {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  },

  findAll: async (filters = {}) => {
    const conditions = [];

    if (filters.fir_id) {
      conditions.push(eq(documents.fir_id, filters.fir_id));
    }

    if (filters.hearing_id) {
      conditions.push(eq(documents.hearing_id, filters.hearing_id));
    }

    if (filters.document_type) {
      conditions.push(eq(documents.document_type, filters.document_type));
    }

    if (filters.io_id) {
      conditions.push(eq(investigationFiles.io_id, filters.io_id));
    }

    let query = db.select({
      id: documents.id,
      uuid: documents.uuid,
      fir_id: documents.fir_id,
      hearing_id: documents.hearing_id,
      document_type: documents.document_type,
      file_name: documents.file_name,
      file_url: documents.file_url,
      uploaded_by: documents.uploaded_by,
      uploaded_at: documents.uploaded_at,
      full_fir_no: firCases.full_fir_no,
      uploaded_by_name: users.name
    })
    .from(documents)
    .leftJoin(firCases, eq(documents.fir_id, firCases.id))
    .leftJoin(users, eq(documents.uploaded_by, users.id))
    .leftJoin(investigationFiles, eq(firCases.file_id, investigationFiles.id));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(documents.uploaded_at));

    return await query;
  },

  delete: async (id) => {
    const [doc] = await db.delete(documents).where(eq(documents.id, id)).returning();
    return doc;
  }
};

module.exports = documentModel;
