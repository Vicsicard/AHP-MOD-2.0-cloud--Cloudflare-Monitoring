// API endpoint for monitoring metrics
// This endpoint provides detailed metrics for the monitoring service

export async function onRequest(context) {
  const { request, env } = context;
  
  // In a real implementation, we would fetch metrics from KV or D1
  // For this example, we'll return sample metrics
  
  const metrics = {
    uptime: {
      last24Hours: 99.8,
      last7Days: 99.5,
      last30Days: 99.2
    },
    responseTime: {
      average: 223,
      p95: 450,
      p99: 780,
      byEndpoint: {
        'Main App Health': 245,
        'Main App Root': 320,
        'Registration': 120,
        'Render Monitor Health': 280,
        'Billing': 150
      }
    },
    availability: {
      byEndpoint: {
        'Main App Health': 100.0,
        'Main App Root': 99.8,
        'Registration': 100.0,
        'Render Monitor Health': 99.9,
        'Billing': 99.7
      }
    },
    incidents: {
      total: 2,
      resolved: 2,
      ongoing: 0,
      recent: [
        {
          id: 'inc-001',
          title: 'Main App Root Redirect Issue',
          status: 'resolved',
          startTime: '2025-08-19T15:23:45Z',
          endTime: '2025-08-19T16:12:30Z',
          duration: 48.75 // minutes
        },
        {
          id: 'inc-002',
          title: 'Billing Endpoint Timeout',
          status: 'resolved',
          startTime: '2025-08-18T08:45:12Z',
          endTime: '2025-08-18T09:30:00Z',
          duration: 44.8 // minutes
        }
      ]
    },
    monitoringHealth: {
      status: 'operational',
      lastUpdate: new Date().toISOString(),
      checkFrequency: '15 seconds',
      redundancyStatus: 'active'
    }
  };
  
  // Return the metrics data
  return new Response(JSON.stringify(metrics), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
