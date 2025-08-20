// API endpoint for external monitoring
// This endpoint allows external services to ping our monitoring service

export async function onRequest(context) {
  const { request, env } = context;
  
  // Get the request parameters
  const url = new URL(request.url);
  const target = url.searchParams.get('target');
  const method = url.searchParams.get('method') || 'GET';
  
  // Validate the request
  if (!target) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Missing target parameter'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  
  try {
    // Perform the ping
    const startTime = Date.now();
    const response = await fetch(target, {
      method,
      headers: {
        'User-Agent': 'Cloudflare-AHP-Monitor/1.0'
      },
      redirect: 'manual'
    });
    
    const responseTime = Date.now() - startTime;
    const success = response.ok || [301, 302, 307, 308].includes(response.status);
    
    // Return the result
    return new Response(JSON.stringify({
      success,
      target,
      status: response.status,
      responseTime,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    // Handle errors
    return new Response(JSON.stringify({
      success: false,
      target,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
