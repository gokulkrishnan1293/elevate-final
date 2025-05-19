ALTER TABLE "elevate"."employee" RENAME COLUMN "cigna_manager_id" TO "cigna_manager_lan_id";--> statement-breakpoint
ALTER TABLE "elevate"."employee" ALTER COLUMN "first_name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "elevate"."employee" ALTER COLUMN "last_name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "elevate"."employee" ALTER COLUMN "email" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "elevate"."employee" ALTER COLUMN "lan_id" SET DATA TYPE varchar(255);--> statement-breakpoint
CREATE INDEX "employee_cigna_manager_id_idx" ON "elevate"."employee" USING btree ("cigna_manager_lan_id");--> statement-breakpoint
CREATE INDEX "employee_email_idx" ON "elevate"."employee" USING btree ("email");--> statement-breakpoint
CREATE INDEX "employee_lan_id_idx" ON "elevate"."employee" USING btree ("lan_id");