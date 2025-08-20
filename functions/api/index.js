// Main API handler for Cloudflare Pages Functions
// This file handles requests that don't match specific routes

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Handle OPTIONS requests for CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  
  // Handle root API request
  if (path === '/api' || path === '/api/') {
    return new Response(JSON.stringify({
      name: 'AHP-MOD 2.0 Cloudflare Monitoring API',
      version: '1.0.0',
      endpoints: [
        {
          path: '/api/ping',
          description: 'Ping a specific endpoint',
          params: {
            target: 'URL to ping',
            method: 'HTTP method (default: GET)'
          }
        },
        {
          path: '/api/status',
          description: 'Get current status of all monitored endpoints'
        },
        {
          path: '/api/metrics',
          description: 'Get detailed monitoring metrics'
        }
      ],
      documentation: 'See README.md for more information'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  // Handle scheduled cron triggers
  if (context.cron) {
    // This code runs on the scheduled cron trigger
    console.log('Running scheduled monitoring check');
    
    // In a real implementation, we would:
    // 1. Fetch the list of endpoints to monitor
    // 2. Ping each endpoint
    // 3. Store the results in KV
    // 4. Send alerts if needed
    
    const endpoints = [
      { url: env.MAIN_APP_URL + '/api/health', name: 'Main App Health' },
      { url: env.MAIN_APP_URL, name: 'Main App Root', method: 'HEAD' },
      { url: 'https://ahp-email-scheduler.vicsicard.workers.dev/registration', name: 'Registration', method: 'OPTIONS' },
      { url: env.RENDER_MONITOR_URL, name: 'Render Monitor Health' },
      { url: 'https://ahp-email-scheduler.vicsicard.workers.dev/billing/checkout', name: 'Billing' }
    ];
    
    // Sample monitoring logic (simplified)
    const results = await Promise.all(endpoints.map(async (endpoint) => {
      try {
        const response = await fetch(endpoint.url, {
          method: endpoint.method || 'GET',
          headers: { 'User-Agent': 'Cloudflare-AHP-Monitor/1.0' },
          redirect: 'manual'
        });
        
        return {
          name: endpoint.name,
          status: response.ok || [301, 302, 307, 308].includes(response.status) ? 'up' : 'down',
          statusCode: response.status,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return {
          name: endpoint.name,
          status: 'down',
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }));
    
    // In a real implementation, we would store these results in KV
    // await env.MONITOR_DATA.put('latest_results', JSON.stringify(results));
    
    return new Response(JSON.stringify({ success: true, message: 'Monitoring check completed', results }));
  }
  
  // Handle 404 for unknown API endpoints
  return new Response(JSON.stringify({
    error: 'Not Found',
    message: `Endpoint ${path} does not exist`
  }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
