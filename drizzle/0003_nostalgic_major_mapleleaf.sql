ALTER TABLE "elevate"."organization" RENAME COLUMN "id" TO "organization_key";--> statement-breakpoint
ALTER TABLE "elevate"."organization" RENAME COLUMN "organisation_name" TO "organization_name";--> statement-breakpoint
ALTER TABLE "elevate"."organization" DROP CONSTRAINT "organization_organisation_name_unique";--> statement-breakpoint
ALTER TABLE "elevate"."organization" ADD CONSTRAINT "organization_organization_name_unique" UNIQUE("organization_name");