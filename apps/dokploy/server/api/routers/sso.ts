import {
	createSsoConfig,
	findSsoConfigById,
	findSsoConfigByOrganizationId,
	removeSsoConfigById,
	updateSsoConfigById,
} from "@dokploy/server";
import { TRPCError } from "@trpc/server";
import { adminProcedure, createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
	apiCreateSsoConfig,
	apiFindOneSsoConfig,
	apiRemoveSsoConfig,
	apiUpdateSsoConfig,
} from "@/server/db/schema";

export const ssoRouter = createTRPCRouter({
	create: adminProcedure
		.input(apiCreateSsoConfig)
		.mutation(async ({ input, ctx }) => {
			try {
				return await createSsoConfig({
					...input,
					organizationId: ctx.session.activeOrganizationId,
				});
			} catch (error) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Error creating the SSO configuration",
					cause: error,
				});
			}
		}),
	update: adminProcedure
		.input(apiUpdateSsoConfig)
		.mutation(async ({ input, ctx }) => {
			try {
				const ssoConfig = await findSsoConfigById({
					ssoConfigId: input.ssoConfigId,
				});
				if (ssoConfig.organizationId !== ctx.session.activeOrganizationId) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "You are not allowed to update this SSO configuration",
					});
				}
				return await updateSsoConfigById(input);
			} catch (error) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Error updating the SSO configuration",
					cause: error,
				});
			}
		}),
	remove: adminProcedure
		.input(apiRemoveSsoConfig)
		.mutation(async ({ input, ctx }) => {
			try {
				const ssoConfig = await findSsoConfigById({
					ssoConfigId: input.ssoConfigId,
				});
				if (ssoConfig.organizationId !== ctx.session.activeOrganizationId) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "You are not allowed to delete this SSO configuration",
					});
				}
				return await removeSsoConfigById(input);
			} catch (error) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Error deleting the SSO configuration",
					cause: error,
				});
			}
		}),
	one: adminProcedure
		.input(apiFindOneSsoConfig)
		.query(async ({ input, ctx }) => {
			const ssoConfig = await findSsoConfigById(input);
			if (ssoConfig.organizationId !== ctx.session.activeOrganizationId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not allowed to access this SSO configuration",
				});
			}
			return ssoConfig;
		}),
	getByOrganization: adminProcedure.query(async ({ ctx }) => {
		return await findSsoConfigByOrganizationId(
			ctx.session.activeOrganizationId,
		);
	}),
	isEnabled: publicProcedure.query(async () => {
		const ssoConfig = await findSsoConfigByOrganizationId(
			process.env.DEFAULT_ORGANIZATION_ID || "",
		);
		return ssoConfig?.enabled || false;
	}),
});
