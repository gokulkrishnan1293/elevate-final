ALTER TABLE "elevate"."team" DROP CONSTRAINT "team_organization_key_art_art_key_fk";
--> statement-breakpoint
ALTER TABLE "elevate"."team" ADD CONSTRAINT "team_organization_key_organization_organization_key_fk" FOREIGN KEY ("organization_key") REFERENCES "elevate"."organization"("organization_key") ON DELETE cascade ON UPDATE no action;