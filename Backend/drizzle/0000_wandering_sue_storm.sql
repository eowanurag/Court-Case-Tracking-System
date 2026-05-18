CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"sector" varchar(100),
	"phone" varchar(20),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "investigation_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid(),
	"file_no" varchar(50) NOT NULL,
	"file_year" varchar(4) NOT NULL,
	"full_file_no" varchar(100) NOT NULL,
	"sector_name" varchar(100) NOT NULL,
	"io_id" integer,
	"file_title" varchar(255),
	"investigation_status" varchar(50) DEFAULT 'Active',
	"remarks" text,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "investigation_files_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "investigation_files_full_file_no_unique" UNIQUE("full_file_no")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fir_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid(),
	"file_id" integer,
	"fir_no" varchar(50) NOT NULL,
	"fir_year" varchar(4) NOT NULL,
	"full_fir_no" varchar(150) NOT NULL,
	"district" varchar(100) NOT NULL,
	"police_station" varchar(150) NOT NULL,
	"court_name" varchar(150) NOT NULL,
	"current_status" varchar(50) DEFAULT 'Investigation',
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "fir_cases_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "fir_cases_full_fir_no_unique" UNIQUE("full_fir_no")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hearings" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid(),
	"fir_id" integer,
	"hearing_date" date NOT NULL,
	"next_hearing_date" date,
	"court_status" varchar(50) NOT NULL,
	"remarks" text,
	"updated_by" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "hearings_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid(),
	"fir_id" integer,
	"alert_type" varchar(100) NOT NULL,
	"message" text,
	"assigned_to" integer,
	"priority" varchar(20) DEFAULT 'Medium',
	"status" varchar(50) DEFAULT 'Pending',
	"deadline" date,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "alerts_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid(),
	"fir_id" integer,
	"document_type" varchar(100) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_url" varchar(500) NOT NULL,
	"uploaded_by" integer,
	"uploaded_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "documents_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" varchar(100) NOT NULL,
	"module_name" varchar(100) NOT NULL,
	"record_id" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "investigation_files" ADD CONSTRAINT "investigation_files_io_id_users_id_fk" FOREIGN KEY ("io_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "investigation_files" ADD CONSTRAINT "investigation_files_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fir_cases" ADD CONSTRAINT "fir_cases_file_id_investigation_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "investigation_files"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hearings" ADD CONSTRAINT "hearings_fir_id_fir_cases_id_fk" FOREIGN KEY ("fir_id") REFERENCES "fir_cases"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hearings" ADD CONSTRAINT "hearings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alerts" ADD CONSTRAINT "alerts_fir_id_fir_cases_id_fk" FOREIGN KEY ("fir_id") REFERENCES "fir_cases"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alerts" ADD CONSTRAINT "alerts_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_fir_id_fir_cases_id_fk" FOREIGN KEY ("fir_id") REFERENCES "fir_cases"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
