# Legal Court Case Tracking System - Backend Implementation Plan

This document outlines the architecture, file structure, database schema, and step-by-step implementation plan for the complete, production-ready backend system.

## Project Overview
A RESTful API built with Node.js and Express.js, using PostgreSQL (Supabase) for data persistence, secured by JWT authentication and Role-Based Access Control (RBAC).

**Tech Stack**: Node.js, Express.js, PostgreSQL (`pg`), JWT, bcrypt, Multer (for uploads), express-validator.

## User Review Required
> [!IMPORTANT]
> - **Database Execution**: I will provide the complete `schema.sql` containing all table creations, relationships, and UUID setups. You will need to execute this SQL script manually in your Supabase SQL Editor, as I do not have direct access to your Supabase dashboard.
> - **Environment Variables**: I will create a `.env.example` file. You will need to create your own `.env` file containing your actual `DATABASE_URL` from Supabase and a secure `JWT_SECRET`.
> - **File Uploads**: The plan uses `multer` to store files locally in `backend/uploads/`. For a true production environment on serverless platforms, you might eventually want to upload directly to Supabase Storage, but I will implement local uploads as requested.

## Open Questions
> [!NOTE]
> 1. Do you have a preferred method for creating the initial Admin user, or should I include a seeding script/query in the `schema.sql`?
> 2. The `full_file_no` and `full_fir_no` are marked as auto-generated. I will implement this auto-generation logic within the Node.js controllers before inserting into the database to ensure formats like `120/2025 - Varanasi` are correctly constructed. Is this acceptable?

## Proposed Architecture & File Structure

We will work within the `backend/` directory of your workspace (`c:\Users\acer\OneDrive\Desktop\Training Classes\Court-Case-Tracking-System\backend\`).

```
backend/
├── app.js                 # Express app setup, middleware registration
├── server.js              # Entry point, starts the server
├── package.json
├── .env.example
├── config/
│   └── db.js              # PostgreSQL connection pool configuration
├── database/
│   └── schema.sql         # Full PostgreSQL schema with tables & foreign keys
├── middleware/
│   ├── auth.js            # JWT verification & RBAC
│   ├── error.js           # Centralized error handler
│   ├── upload.js          # Multer configuration
│   └── validator.js       # express-validator result handler
├── models/
│   ├── userModel.js       # User queries
│   ├── fileModel.js       # Investigation files queries
│   ├── firModel.js        # FIR cases queries
│   ├── hearingModel.js    # Hearings queries
│   ├── alertModel.js      # Alerts queries
│   ├── documentModel.js   # Documents queries
│   └── auditModel.js      # Audit log queries
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── fileController.js
│   ├── firController.js
│   ├── hearingController.js
│   ├── alertController.js
│   ├── documentController.js
│   └── reportController.js
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── fileRoutes.js
│   ├── firRoutes.js
│   ├── hearingRoutes.js
│   ├── alertRoutes.js
│   ├── documentRoutes.js
│   └── reportRoutes.js
├── validations/
│   ├── authValidator.js
│   ├── fileValidator.js
│   ├── firValidator.js
│   └── hearingValidator.js
└── utils/
    ├── response.js        # Standard API response formatter
    └── generateNumber.js  # Logic to auto-generate file/fir numbers
```

## Step-by-Step Execution Plan

1. **Project Initialization & Setup**
   - Create `package.json` and install required dependencies.
   - Create folder structure.
   - Set up `config/db.js` using `pg` Pool.
   - Setup `server.js` and `app.js` with essential middleware (Helmet, CORS, Morgan, Error Handler).

2. **Database Schema**
   - Write `database/schema.sql` defining all 7 tables with UUIDs, timestamps, constraints, and foreign keys.

3. **Core Utilities & Middleware**
   - Implement `utils/response.js` for standardized JSON responses.
   - Implement `middleware/auth.js` for JWT decoding and Role-Based Access Control (`isAdmin`, `isSupervisor`, etc.).
   - Implement `middleware/upload.js` for Multer configuration (filtering PDFs, DOCs, images).

4. **Authentication & User Management**
   - Create `userModel.js` and `authController.js` (Register, Login, Profile).
   - Implement User CRUD in `userController.js`.
   - Setup `authRoutes.js` and `userRoutes.js`.

5. **Investigation Files & FIRs (Core Entities)**
   - Implement logic in models and controllers for Files and FIRs.
   - Add auto-generation logic for `full_file_no` and `full_fir_no`.
   - Ensure `is_deleted` or soft delete logic is implemented where necessary.

6. **Hearings, Alerts & Documents**
   - Implement Hearing CRUD and logic to automatically trigger Alerts (e.g., if status is "Affidavit Required").
   - Implement Document upload logic linked to FIRs.
   - Implement Audit Logging utility to track actions automatically.

7. **Reporting & Search**
   - Create custom PostgreSQL queries in `reportController.js` to aggregate data for Daily Hearings, Pending Compliance, etc.
   - Add search, filter, sorting, and pagination logic to `GET` endpoints in controllers.

## Verification Plan

### Automated Tests
- While full unit tests aren't explicitly requested, I will provide example `curl` commands or a Postman-compatible structure within the `backend/README.md` to test endpoints.

### Manual Verification
- You will need to run the `schema.sql` in Supabase.
- I will start the server locally (`npm run dev`) and test a basic route to ensure the server bootstraps without syntax errors.
- We will verify that JWT authentication correctly blocks unauthorized access to protected routes.
