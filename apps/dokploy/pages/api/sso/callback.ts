import type { NextApiRequest, NextApiResponse } from "next";
import { exchangeCodeForToken, getUserInfo } from "@dokploy/server";
import { auth } from "@dokploy/server/lib/auth";
import { db } from "@dokploy/server/db";
import { users_temp, member, organization } from "@dokploy/server/db/schema";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	if (req.method !== "GET") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		const { code, state } = req.query;

		if (!code || typeof code !== "string") {
			return res.status(400).json({ error: "Missing authorization code" });
		}

		// Validate state (CSRF protection)
		const cookies = parseCookies(req.headers.cookie || "");
		const storedState = cookies.sso_state;

		if (!storedState || storedState !== state) {
			return res.status(400).json({ error: "Invalid state parameter" });
		}

		// Clear the state cookie
		res.setHeader(
			"Set-Cookie",
			"sso_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
		);

		const protocol = req.headers["x-forwarded-proto"] || "http";
		const host = req.headers.host;
		const redirectUri = `${protocol}://${host}/api/sso/callback`;

		// Exchange code for token
		const tokenResponse = await exchangeCodeForToken(code, redirectUri);

		if (!tokenResponse) {
			return res.status(500).json({ error: "Failed to exchange code for token" });
		}

		// Get user info
		const userInfo = await getUserInfo(tokenResponse.access_token);

		if (!userInfo || !userInfo.email) {
			return res.status(500).json({ error: "Failed to get user info" });
		}

		// Find or create user
		let user = await db.query.users_temp.findFirst({
			where: eq(users_temp.email, userInfo.email),
		});

		if (!user) {
			// Create new user with SSO
			const randomPassword = randomBytes(32).toString("hex");
			const hashedPassword = await bcrypt.hash(randomPassword, 10);

			const newUser = await db
				.insert(users_temp)
				.values({
					email: userInfo.email,
					name: userInfo.name || userInfo.preferred_username || userInfo.email,
					emailVerified: true,
					password: hashedPassword,
				})
				.returning()
				.then((res) => res[0]);

			if (!newUser) {
				return res.status(500).json({ error: "Failed to create user" });
			}

			// Create organization and member for new user
			await db.transaction(async (tx) => {
				const org = await tx
					.insert(organization)
					.values({
						name: "My Organization",
						ownerId: newUser.id,
						createdAt: new Date(),
					})
					.returning()
					.then((res) => res[0]);

				await tx.insert(member).values({
					userId: newUser.id,
					organizationId: org?.id || "",
					role: "owner",
					createdAt: new Date(),
				});
			});

			user = newUser;
		}

		// Create session using better-auth API
		const sessionResponse = await auth.api.createSession({
			body: {
				userId: user.id,
			},
		});

		if (!sessionResponse?.data?.session) {
			return res.status(500).json({ error: "Failed to create session" });
		}

		// Get the session token from the response
		const { session, token } = sessionResponse.data;

		// Set the session cookie
		res.setHeader(
			"Set-Cookie",
			`better-auth.session_token=${token}; Path=/; HttpOnly; SameSite=Lax; Secure=${protocol === "https"}; Max-Age=${60 * 60 * 24 * 3}`,
		);

		return res.redirect("/dashboard/projects");
	} catch (error) {
		console.error("SSO callback error:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
}

function parseCookies(cookieHeader: string): Record<string, string> {
	const cookies: Record<string, string> = {};
	cookieHeader.split(";").forEach((cookie) => {
		const [name, ...rest] = cookie.split("=");
		const value = rest.join("=").trim();
		if (name) {
			cookies[name.trim()] = value;
		}
	});
	return cookies;
}
