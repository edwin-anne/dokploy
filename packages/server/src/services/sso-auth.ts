import type { NextApiRequest, NextApiResponse } from "next";
import { findEnabledSsoConfig } from "@dokploy/server";

interface TokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	id_token?: string;
}

interface UserInfo {
	sub: string;
	email: string;
	name?: string;
	preferred_username?: string;
}

export const getSsoAuthUrl = async (
	state: string,
	redirectUri: string,
): Promise<string | null> => {
	const ssoConfig = await findEnabledSsoConfig();

	if (!ssoConfig) {
		return null;
	}

	const authUrl = new URL(`${ssoConfig.issuerUrl}/protocol/openid-connect/auth`);
	authUrl.searchParams.set("client_id", ssoConfig.clientId);
	authUrl.searchParams.set("redirect_uri", redirectUri);
	authUrl.searchParams.set("response_type", "code");
	authUrl.searchParams.set("scope", "openid email profile");
	authUrl.searchParams.set("state", state);

	return authUrl.toString();
};

export const exchangeCodeForToken = async (
	code: string,
	redirectUri: string,
): Promise<TokenResponse | null> => {
	const ssoConfig = await findEnabledSsoConfig();

	if (!ssoConfig) {
		return null;
	}

	const tokenUrl = `${ssoConfig.issuerUrl}/protocol/openid-connect/token`;

	const params = new URLSearchParams({
		grant_type: "authorization_code",
		code,
		redirect_uri: redirectUri,
		client_id: ssoConfig.clientId,
		client_secret: ssoConfig.clientSecret,
	});

	const response = await fetch(tokenUrl, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: params.toString(),
	});

	if (!response.ok) {
		console.error("Token exchange failed:", await response.text());
		return null;
	}

	return response.json();
};

export const getUserInfo = async (
	accessToken: string,
): Promise<UserInfo | null> => {
	const ssoConfig = await findEnabledSsoConfig();

	if (!ssoConfig) {
		return null;
	}

	const userInfoUrl = `${ssoConfig.issuerUrl}/protocol/openid-connect/userinfo`;

	const response = await fetch(userInfoUrl, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	if (!response.ok) {
		console.error("UserInfo request failed:", await response.text());
		return null;
	}

	return response.json();
};
