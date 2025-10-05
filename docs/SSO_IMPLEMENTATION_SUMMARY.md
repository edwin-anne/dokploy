# SSO/OIDC Implementation Summary

## Overview
Implemented complete SSO/OIDC authentication support for Dokploy, allowing administrators to configure Single Sign-On with identity providers like Keycloak. The implementation follows OIDC standard authorization code flow and integrates seamlessly with the existing better-auth authentication system.

## Files Created/Modified

### Database Schema
**Created:**
- `packages/server/src/db/schema/sso-config.ts` - SSO configuration table schema
- `apps/dokploy/drizzle/0117_add_sso_config.sql` - Database migration

**Modified:**
- `packages/server/src/db/schema/index.ts` - Added SSO schema export

### Services
**Created:**
- `packages/server/src/services/sso-config.ts` - CRUD operations for SSO config
- `packages/server/src/services/sso-auth.ts` - OIDC authentication flow handlers

**Modified:**
- `packages/server/src/index.ts` - Export SSO services
- `packages/server/src/lib/auth.ts` - Export auth API for session creation

### API Routes
**Created:**
- `apps/dokploy/server/api/routers/sso.ts` - TRPC router for SSO management
- `apps/dokploy/pages/api/sso/login.ts` - OIDC flow initiator
- `apps/dokploy/pages/api/sso/callback.ts` - OIDC callback handler

**Modified:**
- `apps/dokploy/server/api/root.ts` - Added SSO router
- `apps/dokploy/server/api/routers/settings.ts` - Added SSO to OpenAPI tags

### UI Components
**Created:**
- `apps/dokploy/components/dashboard/settings/sso/sso-settings.tsx` - SSO configuration form
- `apps/dokploy/pages/dashboard/settings/sso.tsx` - SSO settings page

**Modified:**
- `apps/dokploy/components/layouts/side.tsx` - Added SSO menu item
- `apps/dokploy/pages/index.tsx` - Added SSO login button

### Documentation
**Created:**
- `docs/SSO_CONFIGURATION.md` - Complete SSO setup and usage guide

## Features Implemented

### 1. Admin Configuration Interface
- Clean, form-based UI following Dokploy design patterns
- Input validation using Zod schemas
- Edit/Create modes with proper state management
- Toggle to enable/disable SSO globally

### 2. OIDC Authentication Flow
- Standard authorization code flow implementation
- State parameter for CSRF protection
- Automatic token exchange
- User info retrieval
- Session creation via better-auth

### 3. User Management
- Automatic user creation on first SSO login
- Organization creation for new users
- Member role assignment
- Email verification bypass for SSO users

### 4. Security Features
- CSRF protection via state parameter validation
- HttpOnly cookies for state management
- Secure session token handling
- Organization-scoped SSO configuration

### 5. API Endpoints

#### TRPC Routes
- `sso.create` - Create SSO configuration (admin only)
- `sso.update` - Update SSO configuration (admin only)
- `sso.remove` - Delete SSO configuration (admin only)
- `sso.getByOrganization` - Get configuration (admin only)
- `sso.isEnabled` - Check if SSO is enabled (public)

#### REST Routes
- `GET /api/sso/login` - Initiate OIDC flow
- `GET /api/sso/callback` - Handle OIDC callback

## Database Schema

### sso_config Table
```sql
CREATE TABLE sso_config (
  ssoConfigId TEXT PRIMARY KEY,
  issuerUrl TEXT NOT NULL,
  clientId TEXT NOT NULL,
  clientSecret TEXT NOT NULL,
  redirectUri TEXT NOT NULL,
  enabled BOOLEAN DEFAULT FALSE NOT NULL,
  createdAt TEXT NOT NULL,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE
);
```

## Configuration Fields

1. **Issuer URL** - OIDC provider's issuer URL (e.g., Keycloak realm URL)
2. **Client ID** - OAuth client identifier
3. **Client Secret** - OAuth client secret
4. **Redirect URI** - Callback URL for OIDC flow
5. **Enabled** - Boolean flag to activate SSO

## Authentication Flow

1. User clicks "Sign in with SSO" on login page
2. Redirected to `/api/sso/login`
3. State parameter generated and stored in cookie
4. Redirected to identity provider's authorization endpoint
5. User authenticates with identity provider
6. Identity provider redirects to `/api/sso/callback` with code
7. State parameter validated
8. Code exchanged for access token
9. User info retrieved from identity provider
10. User created/retrieved in database
11. Session created via better-auth
12. User redirected to dashboard

## Security Considerations

1. **CSRF Protection**: State parameter validation prevents CSRF attacks
2. **Secure Cookies**: HttpOnly, SameSite, and Secure flags on cookies
3. **Organization Scoping**: Each organization can have its own SSO config
4. **Admin-Only Access**: Only owners can configure SSO
5. **HTTPS Required**: Should only be used over HTTPS in production

## Integration Points

- **better-auth**: Uses auth.api for session creation
- **Drizzle ORM**: Database operations via Drizzle queries
- **TRPC**: Type-safe API with authorization
- **Zod**: Schema validation for all inputs
- **Next.js**: API routes and server-side rendering

## Testing Checklist

- [ ] Admin can access SSO settings page
- [ ] Non-admin users cannot access SSO settings
- [ ] SSO configuration can be created
- [ ] SSO configuration can be updated
- [ ] SSO configuration can be deleted
- [ ] SSO button appears when enabled
- [ ] SSO button hidden when disabled
- [ ] OIDC flow initiates correctly
- [ ] State parameter validated on callback
- [ ] User created on first SSO login
- [ ] Existing user logged in on subsequent SSO logins
- [ ] Session created and persisted
- [ ] User redirected to dashboard after login
- [ ] Organization created for new users
- [ ] Member role assigned correctly

## Known Limitations

1. **Single SSO Config**: Currently supports one SSO configuration per organization
2. **No Group Mapping**: User roles are set to "owner" for new users, no group-based role assignment
3. **No SSO Metadata Discovery**: Manual configuration required, no automatic metadata discovery
4. **No Logout Propagation**: Logging out of Dokploy doesn't log out of identity provider

## Future Enhancements

1. Support for multiple SSO providers per organization
2. Role/group mapping from identity provider
3. OIDC metadata discovery endpoint
4. Single logout (SLO) support
5. Just-in-time (JIT) provisioning with custom user attributes
6. SSO login audit logging
7. Client secret encryption at rest

## Keycloak Configuration Example

1. Create a new Client in Keycloak
2. Set Client ID to match Dokploy configuration
3. Set Access Type to "confidential"
4. Add Valid Redirect URIs: `https://your-dokploy.com/api/sso/callback`
5. Enable Standard Flow Enabled
6. Copy Client Secret from Credentials tab
7. Ensure openid, email, profile scopes are available

## Troubleshooting

### Common Issues

1. **SSO button not visible**
   - Check if SSO is enabled in settings
   - Verify API query returns enabled status

2. **Callback fails**
   - Verify redirect URI matches exactly
   - Check state parameter is present in cookies
   - Ensure identity provider is accessible

3. **User not created**
   - Verify email claim is returned by identity provider
   - Check database permissions
   - Review server logs

4. **Session not persisted**
   - Verify better-auth configuration
   - Check cookie settings
   - Ensure HTTPS in production

## Conclusion

The SSO/OIDC implementation provides a clean, secure, and extensible authentication method for Dokploy. It follows established standards, integrates with existing systems, and provides a foundation for future enhancements.
