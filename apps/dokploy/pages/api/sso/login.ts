import { randomBytes } from "node:crypto";
import { getSsoAuthUrl } from "@dokploy/server";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	if (req.method !== "GET") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		const state = randomBytes(16).toString("hex");
		const protocol = req.headers["x-forwarded-proto"] || "http";
		const host = req.headers.host;
		const redirectUri = `${protocol}://${host}/api/sso/callback`;

		const authUrl = await getSsoAuthUrl(state, redirectUri);

		if (!authUrl) {
			return res
				.status(404)
				.json({ error: "SSO not configured or not enabled" });
		}

		// Store state in a cookie for validation in callback
		res.setHeader(
			"Set-Cookie",
			`sso_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
		);

		return res.redirect(authUrl);
	} catch (error) {
		console.error("SSO login error:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
}
