import { eq } from "drizzle-orm";
import type { z } from "zod";
import { db } from "../db";
import type {
	apiCreateSsoConfig,
	apiFindOneSsoConfig,
	apiRemoveSsoConfig,
	apiUpdateSsoConfig,
	ssoConfig,
} from "../db/schema";

export type SsoConfig = typeof ssoConfig.$inferSelect;

export type CreateSsoConfig = z.infer<typeof apiCreateSsoConfig> & {
	organizationId: string;
};

export type UpdateSsoConfig = z.infer<typeof apiUpdateSsoConfig>;

export const createSsoConfig = async (input: CreateSsoConfig) => {
	const newSsoConfig = await db
		.insert(ssoConfig)
		.values({
			...input,
			createdAt: new Date().toISOString(),
		})
		.returning()
		.then((res) => res[0]);

	if (!newSsoConfig) {
		throw new Error("Error to create the SSO config");
	}

	return newSsoConfig;
};

export const findSsoConfigById = async (
	input: z.infer<typeof apiFindOneSsoConfig>,
) => {
	const result = await db.query.ssoConfig.findFirst({
		where: eq(ssoConfig.ssoConfigId, input.ssoConfigId),
	});

	if (!result) {
		throw new Error("SSO config not found");
	}

	return result;
};

export const findSsoConfigByOrganizationId = async (organizationId: string) => {
	const result = await db.query.ssoConfig.findFirst({
		where: eq(ssoConfig.organizationId, organizationId),
	});

	return result;
};

export const findEnabledSsoConfig = async () => {
	const result = await db.query.ssoConfig.findFirst({
		where: eq(ssoConfig.enabled, true),
	});

	return result;
};

export const updateSsoConfigById = async (input: UpdateSsoConfig) => {
	const result = await db
		.update(ssoConfig)
		.set({
			...input,
		})
		.where(eq(ssoConfig.ssoConfigId, input.ssoConfigId))
		.returning();

	return result[0];
};

export const removeSsoConfigById = async (
	input: z.infer<typeof apiRemoveSsoConfig>,
) => {
	const result = await db
		.delete(ssoConfig)
		.where(eq(ssoConfig.ssoConfigId, input.ssoConfigId))
		.returning();

	return result[0];
};
