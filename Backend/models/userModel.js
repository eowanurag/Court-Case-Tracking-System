const db = require('../config/db');
const { users } = require('../db/schema');
const { eq, desc } = require('drizzle-orm');

const userModel = {
  create: async (userData) => {
    const { name, email, password, role, sector, phone } = userData;
    const [user] = await db.insert(users)
      .values({ name, email, password, role, sector, phone })
      .returning({
        id: users.id,
        uuid: users.uuid,
        name: users.name,
        email: users.email,
        role: users.role,
        sector: users.sector,
        phone: users.phone,
        is_active: users.is_active,
        created_at: users.created_at
      });
    return user;
  },

  findByEmail: async (email) => {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  },

  findById: async (id) => {
    const [user] = await db.select({
        id: users.id,
        uuid: users.uuid,
        name: users.name,
        email: users.email,
        role: users.role,
        sector: users.sector,
        phone: users.phone,
        is_active: users.is_active,
        created_at: users.created_at
      }).from(users).where(eq(users.id, id));
    return user;
  },

  findAll: async () => {
    return await db.select({
        id: users.id,
        uuid: users.uuid,
        name: users.name,
        email: users.email,
        role: users.role,
        sector: users.sector,
        phone: users.phone,
        is_active: users.is_active,
        created_at: users.created_at
      }).from(users).orderBy(desc(users.id));
  },

  update: async (id, updateData) => {
    const { name, email, role, sector, phone, is_active } = updateData;
    const [user] = await db.update(users)
      .set({ name, email, role, sector, phone, is_active, updated_at: new Date() })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        uuid: users.uuid,
        name: users.name,
        email: users.email,
        role: users.role,
        sector: users.sector,
        phone: users.phone,
        is_active: users.is_active,
        updated_at: users.updated_at
      });
    return user;
  },

  updatePassword: async (id, hashedPassword) => {
    await db.update(users)
      .set({ password: hashedPassword, updated_at: new Date() })
      .where(eq(users.id, id));
  },

  delete: async (id) => {
    const [user] = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
    return user;
  }
};

module.exports = userModel;
