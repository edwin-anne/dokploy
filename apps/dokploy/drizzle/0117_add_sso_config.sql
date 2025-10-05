CREATE TABLE IF NOT EXISTS "sso_config" (
	"ssoConfigId" text PRIMARY KEY NOT NULL,
	"issuerUrl" text NOT NULL,
	"clientId" text NOT NULL,
	"clientSecret" text NOT NULL,
	"redirectUri" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"createdAt" text NOT NULL,
	"organizationId" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sso_config" ADD CONSTRAINT "sso_config_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
