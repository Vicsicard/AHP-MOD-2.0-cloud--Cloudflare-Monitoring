# Deployment Guide for AHP-MOD 2.0 Cloudflare Monitoring

This guide provides step-by-step instructions for deploying the Cloudflare Pages monitoring solution.

## Prerequisites

- Cloudflare account
- GitHub account
- Node.js and npm installed locally

## Step 1: Create a GitHub Repository

1. Create a new GitHub repository named `ahp-mod-cloudflare-monitor`
2. Push the local code to the repository:

```bash
cd cloudflare-monitor
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/ahp-mod-cloudflare-monitor.git
git push -u origin main
```

## Step 2: Connect to Cloudflare Pages

1. Log in to your Cloudflare dashboard
2. Navigate to **Pages** > **Create a project** > **Connect to Git**
3. Select the GitHub repository you just created
4. Configure your build settings:
   - **Project name**: `ahp-mod-cloudflare-monitor`
   - **Production branch**: `main`
   - **Build command**: `npm install && npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave as default)

> **Note**: The build output directory is set to `dist` to match the `pages_build_output_dir` in wrangler.toml

## Step 3: Configure Environment Variables

In the Cloudflare Pages project settings, add the following environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `MAIN_APP_URL` | `https://ahp-mod-2-0-cloud.onrender.com` | URL of the main Render app |
| `RENDER_MONITOR_URL` | `https://ahp-mod-2-0-cloud-1.onrender.com` | URL of the Render monitoring service |
| `PING_INTERVAL` | `15000` | Ping interval in milliseconds |
| `ALERT_THRESHOLD` | `3` | Consecutive failures before alerting |

## Step 4: Create KV Namespace

1. In the Cloudflare dashboard, navigate to **Workers & Pages** > **KV**
2. Click **Create namespace**
3. Name it `monitor-data`
4. Copy the namespace ID

## Step 5: Update wrangler.toml Configuration

Edit the `wrangler.toml` file to include both Pages and Workers configurations:

```toml
name = "ahp-mod-cloudflare-monitor"
main = "./functions/api/index.js"
compatibility_date = "2023-10-30"

# Route all requests to the public directory by default
[site]
bucket = "./public"

# Cloudflare Pages configuration
[build]
command = "npm install && npm run build"
[build.upload]
format = "directory"
pages_build_output_dir = "dist"

# Define KV namespace for storing monitoring data
[[kv_namespaces]]
binding = "MONITOR_DATA"
id = "YOUR_ACTUAL_NAMESPACE_ID_HERE"
preview_id = "YOUR_ACTUAL_NAMESPACE_ID_HERE"
```

> **Note**: The `pages_build_output_dir` property is required for Cloudflare Pages to recognize your wrangler.toml configuration.

## Step 6: Deploy Functions

1. Install Wrangler CLI globally:
   ```bash
   npm install -g wrangler
   ```

2. Log in to Cloudflare:
   ```bash
   wrangler login
   ```

3. Deploy the Functions:
   ```bash
   cd cloudflare-monitor
   wrangler deploy
   ```

## Step 7: Set Up Cron Triggers

1. In the Cloudflare dashboard, navigate to **Workers & Pages** > **your-project** > **Settings** > **Triggers**
2. Add a cron trigger with the pattern: `*/1 * * * *` (runs every minute)

## Step 8: Verify Deployment

1. Visit your Cloudflare Pages URL (e.g., `https://ahp-mod-cloudflare-monitor.pages.dev`)
2. Check that the dashboard loads and displays monitoring data
3. Test the API endpoints:
   - `https://ahp-mod-cloudflare-monitor.pages.dev/api`
   - `https://ahp-mod-cloudflare-monitor.pages.dev/api/status`
   - `https://ahp-mod-cloudflare-monitor.pages.dev/api/metrics`

## Step 9: Set Up Custom Domain (Optional)

1. In the Cloudflare Pages project settings, navigate to **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain (e.g., `monitor.ahp-mod.com`)
4. Follow the instructions to verify and configure DNS

## Step 10: Configure Monitoring Alerts (Optional)

For advanced alerting, you can set up:

1. **Email notifications**: Configure in the Functions code to send emails via SendGrid or similar service
2. **Webhook integrations**: Add code to send alerts to Slack, Discord, or other platforms
3. **SMS alerts**: Integrate with Twilio for critical alerts

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check build logs in Cloudflare Pages dashboard
   - Ensure all dependencies are properly listed in package.json

2. **API Endpoints Not Working**
   - Verify Functions are properly deployed
   - Check for CORS issues in browser console

3. **KV Storage Issues**
   - Confirm KV namespace ID is correctly configured
   - Check KV access permissions

### Logs and Debugging

- View real-time logs in Cloudflare dashboard under **Workers & Pages** > **your-project** > **Logs**
- For local debugging, use `wrangler dev` to test Functions locally

## Maintenance

- Regularly check the dashboard for monitoring status
- Update endpoints as needed in the configuration
- Monitor KV usage and clean up old data if necessary
