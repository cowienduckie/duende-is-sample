# Duende IdentityServer Sample

This repository contains:

- AuthServer sample (Duende IdentityServer + ASP.NET Identity)
- WebClient SPA demo (React + Vite + TypeScript)
- AI delivery documentation from requirements to testing readiness

## Quick Start

1. Install WebClient dependencies (first time only):

cd src/WebClient
npm install
cd ../..

2. Seed local auth data:

make seed

3. Run both AuthServer and WebClient from repository root:

make run-all

4. Open the SPA at http://localhost:5173 and sign in via AuthServer.

AuthServer local URL is configured in launch settings as https://localhost:5001.

### Make Targets

- make seed: seed users and apply local migrations
- make authserver: run AuthServer only
- make webclient: run WebClient only
- make run-all: run AuthServer and WebClient together

Press Ctrl+C while running make run-all to stop both processes.

### Manual Run (Alternative)

If you prefer separate terminals:

1. Seed and run AuthServer:

dotnet run --project src/AuthServer/AuthServer.csproj -- /seed
dotnet run --project src/AuthServer/AuthServer.csproj

2. Run WebClient SPA:

cd src/WebClient
npm run dev

## AuthServer Seed Data

Seed flow behavior:

- Applies EF Core migrations to SQLite
- Creates development test users if missing

Default connection string in src/AuthServer/appsettings.json:

"DefaultConnection": "Data Source=AspIdUsers.db;"

### Test Accounts

Shared password for all seeded users:

- Pass123$

alice:

- Username: alice
- Email: AliceSmith@email.com
- Claims: name, given_name, family_name, website

bob:

- Username: bob
- Email: BobSmith@email.com
- Claims: name, given_name, family_name, website, location

## Identity Resources and Scopes

From src/AuthServer/Config.cs:

- Identity resources: openid, profile
- API scopes: scope1, scope2

## Predefined Clients

From src/AuthServer/Config.cs:

1. m2m.client

- Grant type: client_credentials
- Secret (plain): 511536EF-F270-4058-80CA-1C89C192F69A
- Allowed scopes: scope1

2. interactive

- Grant type: authorization_code (+ PKCE)
- Secret (plain): 49C1A7E1-0C79-4A89-A3D6-A37998FB86B0
- Redirect URI: https://localhost:44300/signin-oidc
- Front-channel logout URI: https://localhost:44300/signout-oidc
- Post-logout redirect URI: https://localhost:44300/signout-callback-oidc
- Allowed scopes: openid, profile, scope2

3. webclient.spa

- Grant type: authorization_code (+ PKCE)
- Public client (no secret)
- Redirect URI: http://localhost:5173/auth/callback
- Post-logout redirect URI: http://localhost:5173/auth/logout-callback
- Allowed CORS origin: http://localhost:5173
- Allowed scopes: openid, profile, scope1

## WebClient OIDC Flow

The WebClient demonstrates:

- Authorization Code flow with PKCE via oidc-client-ts
- Route protection using react-router-dom
- Callback routes:
  - /auth/callback
  - /auth/logout-callback
- Protected route:
  - /profile

Environment variables are documented in src/WebClient/README.md.

## Delivery Workflow

This sample follows an AI-assisted delivery workflow with these phases:

- Requirements
- Design
- Planning
- Implementation
- Testing

## External Login Placeholder

Google external authentication in src/AuthServer/Program.cs uses placeholder credentials.
Replace these for real external provider testing.

## Development-Only Notice

Seeded users, client secrets, and sample claims are for local development only.
Do not use them in production.
