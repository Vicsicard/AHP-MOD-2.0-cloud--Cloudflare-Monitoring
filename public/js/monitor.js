// AHP-MOD 2.0 Cloudflare Monitoring Service
// Core monitoring logic

// Configuration
const CONFIG = {
  endpoints: [
    // Main application endpoints
    { url: 'https://ahp-mod-2-0-cloud.onrender.com/api/health', name: 'Main App Health' },
    { url: 'https://ahp-mod-2-0-cloud.onrender.com/', name: 'Main App Root', method: 'HEAD' },
    
    // Registration endpoint (critical)
    { url: 'https://ahp-email-scheduler.vicsicard.workers.dev/registration', name: 'Registration', method: 'OPTIONS' },
    
    // Monitoring the monitor
    { url: 'https://ahp-mod-2-0-cloud-1.onrender.com/', name: 'Render Monitor Health' },
    
    // Stripe/billing endpoints
    { url: 'https://ahp-email-scheduler.vicsicard.workers.dev/billing/checkout', name: 'Billing' },
  ],
  interval: 15000, // 15 seconds - staggered from Render's 30-second interval
  retries: 3,
  retryDelay: 2000,
  alertThreshold: 3, // Number of consecutive failures before alerting
  storageKey: 'ahp-mod-monitoring-data'
};

// State management
let monitoringState = {
  endpointStatus: {},
  metrics: {
    uptime: 0,
    avgResponseTime: 0,
    successRate: 0,
    lastUpdated: null
  },
  history: [],
  consecutiveFailures: {},
  isMonitoring: false
};

// Initialize monitoring state
function initMonitoringState() {
  // Try to load state from localStorage
  try {
    const savedState = localStorage.getItem(CONFIG.storageKey);
    if (savedState) {
      monitoringState = JSON.parse(savedState);
    }
  } catch (error) {
    console.error('Error loading monitoring state:', error);
  }

  // Initialize endpoint status if not present
  CONFIG.endpoints.forEach(endpoint => {
    if (!monitoringState.endpointStatus[endpoint.name]) {
      monitoringState.endpointStatus[endpoint.name] = {
        status: 'unknown',
        lastChecked: null,
        responseTime: 0,
        statusCode: null,
        url: endpoint.url
      };
    }
    if (!monitoringState.consecutiveFailures[endpoint.name]) {
      monitoringState.consecutiveFailures[endpoint.name] = 0;
    }
  });

  monitoringState.isMonitoring = true;
  saveMonitoringState();
}

// Save monitoring state to localStorage
function saveMonitoringState() {
  try {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(monitoringState));
  } catch (error) {
    console.error('Error saving monitoring state:', error);
  }
}

// Add an event to history
function addHistoryEvent(type, message) {
  const event = {
    type,
    message,
    timestamp: new Date().toISOString()
  };
  monitoringState.history.unshift(event);
  
  // Limit history size
  if (monitoringState.history.length > 100) {
    monitoringState.history = monitoringState.history.slice(0, 100);
  }
  
  saveMonitoringState();
  return event;
}

// Ping a single endpoint
async function pingEndpoint(endpoint) {
  const { url, name, method = 'GET' } = endpoint;
  let retries = CONFIG.retries;
  let success = false;
  let responseTime = 0;
  let statusCode = 0;
  let errorMessage = '';
  
  while (retries > 0 && !success) {
    try {
      const startTime = Date.now();
      const response = await fetch(url, {
        method,
        headers: { 'User-Agent': 'Cloudflare-AHP-Monitor/1.0' },
        redirect: 'manual', // Handle redirects manually
        // Use no-cors mode for cross-origin requests without CORS headers
        mode: 'no-cors'
      });
      
      responseTime = Date.now() - startTime;
      statusCode = response.status;
      
      // Consider redirects as successful responses
      success = response.ok || [301, 302, 307, 308].includes(response.status);
      
      if (success) {
        break;
      } else {
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
        }
      }
    } catch (error) {
      errorMessage = error.message;
      retries--;
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
      }
    }
  }
  
  // Update endpoint status
  monitoringState.endpointStatus[name] = {
    status: success ? 'up' : 'down',
    lastChecked: new Date().toISOString(),
    responseTime,
    statusCode,
    url
  };
  
  // Update consecutive failures
  if (!success) {
    monitoringState.consecutiveFailures[name]++;
    
    // Alert if threshold reached
    if (monitoringState.consecutiveFailures[name] === CONFIG.alertThreshold) {
      const event = addHistoryEvent('error', `${name} is down (${errorMessage || statusCode})`);
      // Could trigger external alert here (e.g., send to API endpoint)
    }
  } else {
    // If it was previously failing but now succeeds, add recovery event
    if (monitoringState.consecutiveFailures[name] >= CONFIG.alertThreshold) {
      addHistoryEvent('success', `${name} has recovered`);
    }
    monitoringState.consecutiveFailures[name] = 0;
  }
  
  saveMonitoringState();
  updateMetrics();
  
  // Dispatch event for UI updates
  window.dispatchEvent(new CustomEvent('endpoint-updated', { 
    detail: { 
      name, 
      status: monitoringState.endpointStatus[name] 
    } 
  }));
  
  return success;
}

// Update overall metrics
function updateMetrics() {
  const endpoints = Object.values(monitoringState.endpointStatus);
  
  // Calculate success rate
  const totalEndpoints = endpoints.length;
  const upEndpoints = endpoints.filter(e => e.status === 'up').length;
  const successRate = totalEndpoints > 0 ? (upEndpoints / totalEndpoints) * 100 : 0;
  
  // Calculate average response time
  const responseTimes = endpoints.filter(e => e.status === 'up').map(e => e.responseTime);
  const avgResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
    : 0;
  
  // Update metrics
  monitoringState.metrics = {
    uptime: successRate,
    avgResponseTime,
    successRate,
    lastUpdated: new Date().toISOString()
  };
  
  // Dispatch event for UI updates
  window.dispatchEvent(new CustomEvent('metrics-updated', { 
    detail: monitoringState.metrics 
  }));
  
  saveMonitoringState();
}

// Monitor all endpoints
async function monitorEndpoints() {
  if (!monitoringState.isMonitoring) return;
  
  for (const endpoint of CONFIG.endpoints) {
    await pingEndpoint(endpoint);
  }
  
  // Schedule next run
  setTimeout(monitorEndpoints, CONFIG.interval);
}

// Get overall system status
function getOverallStatus() {
  const endpoints = Object.values(monitoringState.endpointStatus);
  const criticalEndpoints = endpoints.filter(e => 
    e.url.includes('registration') || e.url.includes('health')
  );
  
  const downCritical = criticalEndpoints.filter(e => e.status === 'down').length;
  const downTotal = endpoints.filter(e => e.status === 'down').length;
  
  if (downCritical > 0) {
    return 'critical';
  } else if (downTotal > 0) {
    return 'warning';
  } else {
    return 'healthy';
  }
}

// Export monitoring API
window.AHPMonitor = {
  start: function() {
    initMonitoringState();
    monitorEndpoints();
    addHistoryEvent('info', 'Monitoring started');
  },
  stop: function() {
    monitoringState.isMonitoring = false;
    saveMonitoringState();
    addHistoryEvent('info', 'Monitoring stopped');
  },
  getState: function() {
    return { ...monitoringState };
  },
  getStatus: function() {
    return getOverallStatus();
  },
  pingEndpointNow: async function(endpointName) {
    const endpoint = CONFIG.endpoints.find(e => e.name === endpointName);
    if (endpoint) {
      return await pingEndpoint(endpoint);
    }
    return false;
  }
};

// Start monitoring when page loads
document.addEventListener('DOMContentLoaded', () => {
  window.AHPMonitor.start();
});
