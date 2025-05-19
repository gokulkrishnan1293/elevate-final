CREATE TABLE "elevate"."art" (
	"art_key" serial PRIMARY KEY NOT NULL,
	"art_name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"organization_key" integer NOT NULL,
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "art_name_organization_id_unique" UNIQUE("art_name","organization_key")
);
--> statement-breakpoint
CREATE TABLE "elevate"."employee_art" (
	"employee_key" integer NOT NULL,
	"art_key" integer NOT NULL,
	"art_owner" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "employee_art_link_pkey" PRIMARY KEY("employee_key","art_key")
);
--> statement-breakpoint
CREATE TABLE "elevate"."employee_org" (
	"employee_key" integer NOT NULL,
	"organization_key" integer NOT NULL,
	"org_owner" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "employee_org_link_pkey" PRIMARY KEY("employee_key","organization_key")
);
--> statement-breakpoint
CREATE TABLE "elevate"."employee_team" (
	"employee_key" integer NOT NULL,
	"team_key" integer NOT NULL,
	"job_title" varchar(255) NOT NULL,
	"team_owner" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "employee_team_link_pkey" PRIMARY KEY("employee_key","team_key","job_title")
);
--> statement-breakpoint
CREATE TABLE "elevate"."team" (
	"team_key" serial PRIMARY KEY NOT NULL,
	"team_name" varchar(255) NOT NULL,
	"art_key" integer NOT NULL,
	"organization_key" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "team_name_art_id_unique" UNIQUE("team_name","art_key")
);
--> statement-breakpoint
ALTER TABLE "elevate"."art" ADD CONSTRAINT "art_organization_key_organization_organization_key_fk" FOREIGN KEY ("organization_key") REFERENCES "elevate"."organization"("organization_key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "elevate"."employee_art" ADD CONSTRAINT "employee_art_employee_key_employee_employee_key_fk" FOREIGN KEY ("employee_key") REFERENCES "elevate"."employee"("employee_key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "elevate"."employee_art" ADD CONSTRAINT "employee_art_art_key_art_art_key_fk" FOREIGN KEY ("art_key") REFERENCES "elevate"."art"("art_key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "elevate"."employee_org" ADD CONSTRAINT "employee_org_employee_key_employee_employee_key_fk" FOREIGN KEY ("employee_key") REFERENCES "elevate"."employee"("employee_key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "elevate"."employee_org" ADD CONSTRAINT "employee_org_organization_key_organization_organization_key_fk" FOREIGN KEY ("organization_key") REFERENCES "elevate"."organization"("organization_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "elevate"."employee_team" ADD CONSTRAINT "employee_team_employee_key_employee_employee_key_fk" FOREIGN KEY ("employee_key") REFERENCES "elevate"."employee"("employee_key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "elevate"."employee_team" ADD CONSTRAINT "employee_team_team_key_team_team_key_fk" FOREIGN KEY ("team_key") REFERENCES "elevate"."team"("team_key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "elevate"."team" ADD CONSTRAINT "team_art_key_art_art_key_fk" FOREIGN KEY ("art_key") REFERENCES "elevate"."art"("art_key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "elevate"."team" ADD CONSTRAINT "team_organization_key_art_art_key_fk" FOREIGN KEY ("organization_key") REFERENCES "elevate"."art"("art_key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "art_organization_id_idx" ON "elevate"."art" USING btree ("organization_key");--> statement-breakpoint
CREATE INDEX "art_created_by_id_idx" ON "elevate"."art" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "art_updated_by_id_idx" ON "elevate"."art" USING btree ("updated_by_id");--> statement-breakpoint
CREATE INDEX "employee_art_link_art_id_idx" ON "employee_art" USING btree ("art_key");--> statement-breakpoint
CREATE INDEX "employee_art_link_employee_id_idx" ON "employee_art" USING btree ("employee_key");--> statement-breakpoint
CREATE INDEX "employee_org_link_employee_id_idx" ON "employee_org" USING btree ("employee_key");--> statement-breakpoint
CREATE INDEX "employee_org_link_organization_id_idx" ON "employee_org" USING btree ("organization_key");--> statement-breakpoint
CREATE INDEX "employee_team_link_employee_id_idx" ON "employee_team" USING btree ("employee_key");--> statement-breakpoint
CREATE INDEX "employee_team_link_team_id_idx" ON "employee_team" USING btree ("team_key");--> statement-breakpoint
CREATE INDEX "team_art_id_idx" ON "elevate"."team" USING btree ("art_key");--> statement-breakpoint
CREATE INDEX "team_organization_id_idx" ON "elevate"."team" USING btree ("organization_key");--> statement-breakpoint
CREATE INDEX "team_created_by_id_idx" ON "elevate"."team" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "team_updated_by_id_idx" ON "elevate"."team" USING btree ("updated_by_id");