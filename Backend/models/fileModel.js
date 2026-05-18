const db = require('../config/db');
const { investigationFiles, users } = require('../db/schema');
const { eq, and, desc, ilike } = require('drizzle-orm');

const fileModel = {
  create: async (fileData) => {
    const { file_no, file_year, full_file_no, sector_name, io_id, file_title, remarks, created_by } = fileData;
    const [file] = await db.insert(investigationFiles)
      .values({ file_no, file_year, full_file_no, sector_name, io_id, file_title, remarks, created_by })
      .returning();
    return file;
  },

  findById: async (id) => {
    const [file] = await db.select({
      id: investigationFiles.id,
      uuid: investigationFiles.uuid,
      file_no: investigationFiles.file_no,
      file_year: investigationFiles.file_year,
      full_file_no: investigationFiles.full_file_no,
      sector_name: investigationFiles.sector_name,
      io_id: investigationFiles.io_id,
      file_title: investigationFiles.file_title,
      investigation_status: investigationFiles.investigation_status,
      remarks: investigationFiles.remarks,
      created_by: investigationFiles.created_by,
      created_at: investigationFiles.created_at,
      updated_at: investigationFiles.updated_at,
      io_name: users.name
    })
    .from(investigationFiles)
    .leftJoin(users, eq(investigationFiles.io_id, users.id))
    .where(eq(investigationFiles.id, id));
    
    return file;
  },

  findAll: async (filters = {}) => {
    const conditions = [];

    if (filters.search) {
      conditions.push(
        ilike(investigationFiles.full_file_no, `%${filters.search}%`)
      );
    }

    if (filters.sector_name) {
      conditions.push(eq(investigationFiles.sector_name, filters.sector_name));
    }

    if (filters.investigation_status) {
      conditions.push(eq(investigationFiles.investigation_status, filters.investigation_status));
    }

    if (filters.io_id) {
      conditions.push(eq(investigationFiles.io_id, filters.io_id));
    }

    let query = db.select({
      id: investigationFiles.id,
      uuid: investigationFiles.uuid,
      file_no: investigationFiles.file_no,
      file_year: investigationFiles.file_year,
      full_file_no: investigationFiles.full_file_no,
      sector_name: investigationFiles.sector_name,
      io_id: investigationFiles.io_id,
      file_title: investigationFiles.file_title,
      investigation_status: investigationFiles.investigation_status,
      remarks: investigationFiles.remarks,
      created_by: investigationFiles.created_by,
      created_at: investigationFiles.created_at,
      updated_at: investigationFiles.updated_at,
      io_name: users.name
    })
    .from(investigationFiles)
    .leftJoin(users, eq(investigationFiles.io_id, users.id));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(investigationFiles.created_at));

    if (filters.limit && filters.offset !== undefined) {
      query = query.limit(filters.limit).offset(filters.offset);
    }

    return await query;
  },

  update: async (id, updateData) => {
    const { sector_name, io_id, file_title, investigation_status, remarks } = updateData;
    const [file] = await db.update(investigationFiles)
      .set({ sector_name, io_id, file_title, investigation_status, remarks, updated_at: new Date() })
      .where(eq(investigationFiles.id, id))
      .returning();
    return file;
  },

  delete: async (id) => {
    const [file] = await db.delete(investigationFiles)
      .where(eq(investigationFiles.id, id))
      .returning({ id: investigationFiles.id });
    return file;
  }
};

module.exports = fileModel;
