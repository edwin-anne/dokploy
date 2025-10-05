import { relations } from "drizzle-orm";
import { boolean, pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { nanoid } from "nanoid";
import { z } from "zod";
import { organization } from "./account";

export const ssoConfig = pgTable("sso_config", {
	ssoConfigId: text("ssoConfigId")
		.notNull()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	issuerUrl: text("issuerUrl").notNull(),
	clientId: text("clientId").notNull(),
	clientSecret: text("clientSecret").notNull(),
	redirectUri: text("redirectUri").notNull(),
	enabled: boolean("enabled").notNull().default(false),
	createdAt: text("createdAt").notNull(),
	organizationId: text("organizationId")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
});

export const ssoConfigRelations = relations(ssoConfig, ({ one }) => ({
	organization: one(organization, {
		fields: [ssoConfig.organizationId],
		references: [organization.id],
	}),
}));

const createSchema = createInsertSchema(ssoConfig, {
	ssoConfigId: z.string().min(1),
	issuerUrl: z.string().url(),
	clientId: z.string().min(1),
	clientSecret: z.string().min(1),
	redirectUri: z.string().url(),
	enabled: z.boolean(),
});

export const apiCreateSsoConfig = createSchema
	.pick({
		issuerUrl: true,
		clientId: true,
		clientSecret: true,
		redirectUri: true,
		enabled: true,
	})
	.required();

export const apiFindOneSsoConfig = createSchema
	.pick({
		ssoConfigId: true,
	})
	.required();

export const apiUpdateSsoConfig = createSchema
	.pick({
		ssoConfigId: true,
		issuerUrl: true,
		clientId: true,
		clientSecret: true,
		redirectUri: true,
		enabled: true,
	})
	.required();

export const apiRemoveSsoConfig = createSchema
	.pick({
		ssoConfigId: true,
	})
	.required();
