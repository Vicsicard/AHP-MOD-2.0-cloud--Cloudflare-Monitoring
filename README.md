# AHP-MOD 2.0 Cloudflare Monitoring Solution

A redundant monitoring system built on Cloudflare Pages to ensure the AHP-MOD 2.0 Render application stays online by preventing free tier spin-down.

## Overview

This monitoring solution works in tandem with the existing Render monitoring service to provide redundant monitoring from different infrastructure providers. The system pings critical endpoints every 15 seconds on a staggered schedule from the Render monitoring service to ensure the main application remains active.

## Features

- **Real-time Monitoring Dashboard**: Visual interface showing the status of all monitored endpoints
- **Redundant Monitoring**: Complements the existing Render monitoring service
- **Staggered Ping Schedule**: Coordinates with Render monitoring for optimal coverage
- **API Endpoints**: External access to monitoring data and status
- **Redirect Handling**: Properly handles HTTP redirects (301, 302, 307, 308)
- **Historical Data**: Tracks uptime and response times over time
- **Alerting**: Configurable alerts for endpoint failures

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │
│  Cloudflare Pages   │     │  Render Monitoring  │
│  Monitoring Service │     │  Service (cloud-1)  │
│                     │     │                     │
└──────────┬──────────┘     └──────────┬──────────┘
           │                           │
           │                           │
           ▼                           ▼
┌─────────────────────────────────────────────────┐
│                                                 │
│            Main Render Application              │
│            (ahp-mod-2-0-cloud)                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Monitored Endpoints

- **Main App Health**: `https://ahp-mod-2-0-cloud.onrender.com/api/health`
- **Main App Root**: `https://ahp-mod-2-0-cloud.onrender.com/`
- **Registration Endpoint**: `https://ahp-email-scheduler.vicsicard.workers.dev/registration`
- **Render Monitor Health**: `https://ahp-mod-2-0-cloud-1.onrender.com/`
- **Billing Endpoint**: `https://ahp-email-scheduler.vicsicard.workers.dev/billing/checkout`

## Staggered Ping Schedule

The Cloudflare monitoring service pings endpoints at 15/45 seconds past the minute, while the Render monitoring service pings at 0/30 seconds. This ensures the main application receives a ping at least every 15 seconds, preventing any chance of spin-down.

```
Timeline (seconds):
0  5  10 15 20 25 30 35 40 45 50 55 60
R     C     R     C     R     C     R
```
- R = Render monitoring ping
- C = Cloudflare monitoring ping

## Setup and Deployment

### Prerequisites

- Cloudflare account
- Node.js and npm installed

### Local Development

1. Install dependencies:
   ```
   cd cloudflare-monitor
   npm install
   ```

2. Run locally:
   ```
   npm run dev
   ```

3. Access the dashboard at `http://localhost:8788`

### Deployment to Cloudflare Pages

1. Connect your GitHub repository to Cloudflare Pages
2. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `public`
3. Set up environment variables:
   - `MAIN_APP_URL`: Main Render app URL
   - `RENDER_MONITOR_URL`: Render monitoring service URL
   - `PING_INTERVAL`: Ping interval in milliseconds
   - `ALERT_THRESHOLD`: Consecutive failures before alerting

## API Endpoints

- **GET /api/ping**: Ping a specific endpoint
  - Query parameters:
    - `target`: URL to ping
    - `method`: HTTP method (default: GET)

- **GET /api/status**: Get current status of all monitored endpoints

- **GET /api/metrics**: Get detailed monitoring metrics

## Integration with Render Monitoring

The Cloudflare monitoring service and Render monitoring service work together to provide redundant coverage:

1. Each service monitors the other to ensure both monitoring systems are operational
2. Staggered ping schedule distributes load and provides more frequent checks
3. Different infrastructure providers eliminate single points of failure
4. Combined coverage ensures 24/7 uptime for the main application

## Maintenance

- Check the dashboard regularly to monitor system health
- Update endpoint configurations as needed in `monitor.js`
- Adjust ping intervals if rate limiting becomes an issue
