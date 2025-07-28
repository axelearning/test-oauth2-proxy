# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Docker Compose-based data platform running on a Raspberry Pi 5, exposed via Cloudflare Tunnel. It provides GitHub OAuth2 authentication for accessing protected admin services with the following architecture:

- **Caddy**: Reverse proxy and web server (ports 80/443)
- **OAuth2 Proxy**: GitHub OAuth2 authentication service (port 4180)
- **Database**: PostgreSQL with DuckDB extension (port 5432)
- **Metabase**: Business intelligence dashboard (public access)
- **Portainer**: Container management interface (ports 9000/8000) - protected by OAuth2
- **pgweb**: Database web interface - protected by OAuth2
- **Glances**: System monitoring - protected by OAuth2

## Architecture Flow

The setup uses Cloudflare Tunnel to expose the Raspberry Pi services:

1. **Public Access**: `external.axelrasse.com` → Cloudflare Tunnel → Caddy → Metabase
2. **Protected Access**: `admin.axelrasse.com` → Cloudflare Tunnel → Caddy → OAuth2 Proxy → Admin Services
   - `/oauth2/*` routes → oauth2-proxy for authentication flows
   - `/portainer/*` → Portainer container management
   - `/pgweb/*` → pgweb database interface
   - `/glances/*` → Glances system monitoring
   - Other routes → forward_auth to oauth2-proxy, then to services if authenticated
   - Unauthenticated requests redirect to `/oauth2/sign_in`

## Key Configuration Files

### Docker Compose (`docker-compose.yml`)
- Defines all services with proper networking on `app-network`
- OAuth2 proxy configured with GitHub provider
- Environment variables required: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `COOKIE_SECRET`
- Key oauth2-proxy flags:
  - `--skip-provider-button=true`: Direct GitHub auth without provider selection
  - `--reverse-proxy=true`: Enables reverse proxy mode
  - `--email-domain=*`: Allows any email domain
  - `--redirect-url=https://portainer.axelrasse.com/oauth2/callback`: GitHub OAuth callback

### Caddy Configuration (`Caddyfile`)
- `external.axelrasse.com`: Public access to Metabase business intelligence
- `admin.axelrasse.com`: OAuth2-protected admin services
  - Uses `forward_auth` directive for authentication
  - Handles OAuth2 callback routes (`/oauth2/*`)
  - Redirects unauthenticated users to sign-in page
  - Routes: `/portainer/*`, `/pgweb/*`, `/glances/*`
- `axelrasse.com`: Main status page
- All configured for port 80 (Cloudflare Tunnel handles HTTPS termination)

## Common Development Commands

```bash
# Start all services
docker-compose up -d

# View logs for specific services
docker-compose logs -f oauth2-proxy
docker-compose logs -f caddy
docker-compose logs -f database
docker-compose logs -f metabase
docker-compose logs -f portainer

# Restart specific service
docker-compose restart oauth2-proxy

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

## Environment Setup

Create a `.env` file with required credentials:
```
# GitHub OAuth App credentials
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
COOKIE_SECRET=your_32_character_random_string

# Database configuration
POSTGRES_DB=data_warehouse
POSTGRES_USER=admin
POSTGRES_HOST=database
POSTGRES_PASSWORD=your_secret_password

# Portainer admin password
PORTAINER_ADMIN_HASH_PASSWORD=your_secret_hash_password
```

Note: GitHub OAuth App should be configured with:
- Authorization callback URL: `https://admin.axelrasse.com/oauth2/callback`

## Service Access

- **Main site**: `axelrasse.com` (status page)
- **Public Metabase**: `external.axelrasse.com` (business intelligence, no auth required)
- **Protected Admin Portal**: `admin.axelrasse.com` (requires GitHub OAuth)
  - `/portainer/` → Container management
  - `/pgweb/` → Database web interface
  - `/glances/` → System monitoring

## Raspberry Pi & Cloudflare Tunnel Considerations

- Services bind to internal Docker network, exposed through Caddy
- Cloudflare Tunnel handles external connectivity and SSL termination
- OAuth2 proxy cookie security set to `false` since HTTPS is handled by Cloudflare
- All services configured with `restart: unless-stopped` for reliability