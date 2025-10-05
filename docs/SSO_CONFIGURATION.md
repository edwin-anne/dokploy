# SSO/OIDC Configuration

This implementation adds Single Sign-On (SSO) support to Dokploy using OpenID Connect (OIDC) protocol, compatible with identity providers like Keycloak.

## Features

- **Admin-only Configuration**: Only owners can configure SSO settings
- **OIDC Standard Compliance**: Implements standard OIDC authorization code flow
- **Automatic User Creation**: Creates users automatically on first SSO login
- **Session Management**: Integrates seamlessly with better-auth
- **Security**: Includes CSRF protection with state parameter validation

## Configuration

### 1. Access SSO Settings

Navigate to **Dashboard → Settings → SSO** (admin only)

### 2. Configure Your Identity Provider

Required fields:
- **Issuer URL**: The OIDC issuer URL from your identity provider
  - Example for Keycloak: `https://keycloak.example.com/realms/myrealm`
- **Client ID**: The client ID configured in your identity provider
- **Client Secret**: The client secret from your identity provider
- **Redirect URI**: The callback URL that should be configured in your identity provider
  - Example: `https://dokploy.example.com/api/sso/callback`
- **Enabled**: Toggle to enable/disable SSO authentication

### 3. Configure Your Identity Provider (Keycloak Example)

In Keycloak:
1. Create a new client with the Client ID from step 2
2. Set the **Access Type** to `confidential`
3. Add the **Redirect URI** from step 2 to **Valid Redirect URIs**
4. Note the **Client Secret** from the **Credentials** tab
5. Ensure the following scopes are available: `openid`, `email`, `profile`

### 4. Enable SSO

Toggle the "Enable SSO" switch in the Dokploy SSO settings page.

## Usage

Once configured and enabled, users will see a "Sign in with SSO" button on the login page.

## Technical Details

### Database Schema

A new `sso_config` table stores the SSO configuration:
- `ssoConfigId`: Primary key
- `issuerUrl`: OIDC issuer URL
- `clientId`: OAuth client ID
- `clientSecret`: OAuth client secret
- `redirectUri`: OAuth redirect URI
- `enabled`: Boolean flag to enable/disable SSO
- `organizationId`: Foreign key to organization

### API Routes

- `/api/sso/login`: Initiates the OIDC flow
- `/api/sso/callback`: Handles the OIDC callback and creates user session

### TRPC Routes

- `sso.create`: Create SSO configuration (admin only)
- `sso.update`: Update SSO configuration (admin only)
- `sso.remove`: Delete SSO configuration (admin only)
- `sso.getByOrganization`: Get SSO configuration for current organization (admin only)
- `sso.isEnabled`: Check if SSO is enabled (public)

## Migration

To apply the database migration, run:

```bash
pnpm run migration:run
```

Or manually execute the SQL in `drizzle/0117_add_sso_config.sql`.

## Security Considerations

1. **Client Secret**: Store securely and consider encrypting in the database
2. **HTTPS Required**: SSO should only be used over HTTPS in production
3. **State Validation**: CSRF protection is implemented via state parameter
4. **Token Validation**: Access tokens are validated before creating sessions

## Troubleshooting

### SSO Button Not Appearing

- Ensure SSO is enabled in settings
- Check that the `sso.isEnabled` API returns `true`
- Verify browser console for any errors

### Authentication Fails

- Verify all configuration values are correct
- Check that the redirect URI matches exactly (including protocol and port)
- Ensure the identity provider is accessible from the Dokploy server
- Check server logs for detailed error messages

### User Not Created

- Verify the identity provider returns `email` in the user info
- Check that the email claim is properly configured in your identity provider
- Review server logs for database errors
