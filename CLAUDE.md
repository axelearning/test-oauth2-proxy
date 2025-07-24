# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Docker Compose-based OAuth2 proxy demonstration setup running on a Raspberry Pi 5, exposed via Cloudflare Tunnel. It provides GitHub OAuth2 authentication for accessing protected services with the following architecture:

- **Caddy**: Reverse proxy and web server (ports 80/443)
- **OAuth2 Proxy**: GitHub OAuth2 authentication service (port 4180)
- **Portainer**: Container management interface (ports 9000/8000) - protected by OAuth2
- **External Service**: Public nginx service serving static HTML
- **Internal Service**: Example internal service (currently unused)

## Architecture Flow

The setup uses Cloudflare Tunnel to expose the Raspberry Pi services:

1. **Public Access**: `external.axelrasse.com` → Cloudflare Tunnel → Caddy → External Service
2. **Protected Access**: `portainer.axelrasse.com` → Cloudflare Tunnel → Caddy → OAuth2 Proxy → Portainer
   - `/oauth2/*` routes → oauth2-proxy for authentication flows
   - Other routes → forward_auth to oauth2-proxy, then to portainer if authenticated
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
- `external.axelrasse.com`: Public access to external service
- `portainer.axelrasse.com`: OAuth2-protected Portainer access
  - Uses `forward_auth` directive for authentication
  - Handles OAuth2 callback routes (`/oauth2/*`)
  - Redirects unauthenticated users to sign-in page
- `axelrasse.com`: Main status page
- All configured for port 80 (Cloudflare Tunnel handles HTTPS termination)

## Common Development Commands

```bash
# Start all services
docker-compose up -d

# View logs for specific services
docker-compose logs -f oauth2-proxy
docker-compose logs -f caddy
docker-compose logs -f portainer

# Restart specific service
docker-compose restart oauth2-proxy

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

## Environment Setup

Create a `.env` file with GitHub OAuth App credentials:
```
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
COOKIE_SECRET=your_32_character_random_string
```

Note: GitHub OAuth App should be configured with:
- Authorization callback URL: `https://portainer.axelrasse.com/oauth2/callback`

## Service Access

- **Main site**: `axelrasse.com` (status page)
- **External service**: `external.axelrasse.com` (public access)
- **Protected Portainer**: `portainer.axelrasse.com` (requires GitHub OAuth)
- **Direct Portainer** (Raspberry Pi local): `localhost:9000` (development only)

## Raspberry Pi & Cloudflare Tunnel Considerations

- Services bind to internal Docker network, exposed through Caddy
- Cloudflare Tunnel handles external connectivity and SSL termination
- OAuth2 proxy cookie security set to `false` since HTTPS is handled by Cloudflare
- All services configured with `restart: unless-stopped` for reliability