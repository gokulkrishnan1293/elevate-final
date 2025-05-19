CREATE SCHEMA elevate;

CREATE TABLE "elevate"."employee" (
	"employee_key" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" varchar NOT NULL,
	"lan_id" varchar NOT NULL,
	"is_contractor" boolean DEFAULT true NOT NULL,
	"cigna_manager_id" varchar,
	"is_user_active" boolean DEFAULT true NOT NULL,
	"profile_photo" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "employee_email_unique" UNIQUE("email"),
	CONSTRAINT "employee_lan_id_unique" UNIQUE("lan_id")
);
