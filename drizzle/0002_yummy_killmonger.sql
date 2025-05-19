CREATE TABLE "elevate"."organization" (
	"id" serial PRIMARY KEY NOT NULL,
	"organisation_name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "organization_organisation_name_unique" UNIQUE("organisation_name")
);
