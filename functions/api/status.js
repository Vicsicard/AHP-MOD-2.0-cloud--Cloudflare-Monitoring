// API endpoint for status reporting
// This endpoint provides the current status of all monitored endpoints

export async function onRequest(context) {
  const { request, env } = context;
  
  // In a real implementation, we would fetch status from KV or D1
  // For this example, we'll return a static response
  
  const monitoringData = {
    status: 'healthy', // healthy, warning, critical
    lastUpdated: new Date().toISOString(),
    endpoints: {
      'Main App Health': {
        status: 'up',
        url: 'https://ahp-mod-2-0-cloud.onrender.com/api/health',
        lastChecked: new Date().toISOString(),
        responseTime: 245,
        statusCode: 200
      },
      'Main App Root': {
        status: 'up',
        url: 'https://ahp-mod-2-0-cloud.onrender.com/',
        lastChecked: new Date().toISOString(),
        responseTime: 320,
        statusCode: 200
      },
      'Registration': {
        status: 'up',
        url: 'https://ahp-email-scheduler.vicsicard.workers.dev/registration',
        lastChecked: new Date().toISOString(),
        responseTime: 120,
        statusCode: 200
      },
      'Render Monitor Health': {
        status: 'up',
        url: 'https://ahp-mod-2-0-cloud-1.onrender.com/',
        lastChecked: new Date().toISOString(),
        responseTime: 280,
        statusCode: 200
      },
      'Billing': {
        status: 'up',
        url: 'https://ahp-email-scheduler.vicsicard.workers.dev/billing/checkout',
        lastChecked: new Date().toISOString(),
        responseTime: 150,
        statusCode: 200
      }
    },
    metrics: {
      uptime: 100.0,
      avgResponseTime: 223,
      successRate: 100.0
    }
  };
  
  // Return the status data
  return new Response(JSON.stringify(monitoringData), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
