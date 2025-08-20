// AHP-MOD 2.0 Cloudflare Monitoring Dashboard
// UI functionality for the monitoring dashboard

document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const overallStatusEl = document.getElementById('overall-status');
  const lastUpdatedEl = document.getElementById('last-updated');
  const endpointsContainerEl = document.getElementById('endpoints-container');
  const uptimeValueEl = document.getElementById('uptime-value');
  const responseTimeValueEl = document.getElementById('response-time-value');
  const successRateValueEl = document.getElementById('success-rate-value');
  const monitoringStatusValueEl = document.getElementById('monitoring-status-value');
  const historyContainerEl = document.getElementById('history-container');
  const versionEl = document.getElementById('version');

  // Set version
  versionEl.textContent = 'v1.0.0';

  // Format date for display
  function formatDate(dateString) {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  // Format time elapsed
  function formatTimeElapsed(dateString) {
    if (!dateString) return '--';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    
    if (diffMs < 1000) return 'just now';
    if (diffMs < 60000) return `${Math.floor(diffMs / 1000)}s ago`;
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
    if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
    
    return `${Math.floor(diffMs / 86400000)}d ago`;
  }

  // Update overall status display
  function updateOverallStatus() {
    const status = window.AHPMonitor.getStatus();
    overallStatusEl.className = `status-badge ${status}`;
    
    switch(status) {
      case 'healthy':
        overallStatusEl.textContent = 'All Systems Operational';
        break;
      case 'warning':
        overallStatusEl.textContent = 'Partial Outage';
        break;
      case 'critical':
        overallStatusEl.textContent = 'Critical Systems Down';
        break;
      default:
        overallStatusEl.textContent = 'Status Unknown';
    }
  }

  // Update metrics display
  function updateMetrics() {
    const state = window.AHPMonitor.getState();
    const { metrics } = state;
    
    uptimeValueEl.textContent = `${metrics.uptime.toFixed(1)}%`;
    responseTimeValueEl.textContent = `${metrics.avgResponseTime.toFixed(0)}ms`;
    successRateValueEl.textContent = `${metrics.successRate.toFixed(1)}%`;
    monitoringStatusValueEl.textContent = state.isMonitoring ? 'Active' : 'Paused';
    
    lastUpdatedEl.textContent = `Last updated: ${formatTimeElapsed(metrics.lastUpdated)}`;
  }

  // Create endpoint card
  function createEndpointCard(name, status) {
    const card = document.createElement('div');
    card.className = 'endpoint-card';
    card.id = `endpoint-${name.replace(/\s+/g, '-').toLowerCase()}`;
    
    const statusIndicator = document.createElement('div');
    statusIndicator.className = `status-indicator ${status.status}`;
    
    const title = document.createElement('h3');
    title.textContent = name;
    
    const url = document.createElement('div');
    url.className = 'endpoint-url';
    url.textContent = status.url;
    
    const stats = document.createElement('div');
    stats.className = 'endpoint-stats';
    
    const responseTime = document.createElement('span');
    responseTime.textContent = `${status.responseTime}ms`;
    
    const lastChecked = document.createElement('span');
    lastChecked.textContent = formatTimeElapsed(status.lastChecked);
    
    stats.appendChild(responseTime);
    stats.appendChild(lastChecked);
    
    card.appendChild(statusIndicator);
    card.appendChild(title);
    card.appendChild(url);
    card.appendChild(stats);
    
    // Add ping button
    const pingButton = document.createElement('button');
    pingButton.textContent = 'Ping Now';
    pingButton.className = 'ping-button';
    pingButton.addEventListener('click', () => {
      pingButton.disabled = true;
      pingButton.textContent = 'Pinging...';
      
      window.AHPMonitor.pingEndpointNow(name)
        .then(() => {
          pingButton.disabled = false;
          pingButton.textContent = 'Ping Now';
        });
    });
    
    card.appendChild(pingButton);
    
    return card;
  }

  // Update endpoints display
  function updateEndpoints() {
    const state = window.AHPMonitor.getState();
    
    // Clear loading message
    endpointsContainerEl.innerHTML = '';
    
    // Create cards for each endpoint
    Object.entries(state.endpointStatus).forEach(([name, status]) => {
      const card = createEndpointCard(name, status);
      endpointsContainerEl.appendChild(card);
    });
  }

  // Update history display
  function updateHistory() {
    const state = window.AHPMonitor.getState();
    
    // Clear loading message
    historyContainerEl.innerHTML = '';
    
    // Create items for each history event
    state.history.forEach(event => {
      const item = document.createElement('div');
      item.className = 'history-item';
      
      const icon = document.createElement('span');
      icon.className = `history-icon ${event.type}`;
      
      switch(event.type) {
        case 'success':
          icon.innerHTML = '<i class="fas fa-check-circle"></i>';
          break;
        case 'warning':
          icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
          break;
        case 'error':
          icon.innerHTML = '<i class="fas fa-times-circle"></i>';
          break;
        default:
          icon.innerHTML = '<i class="fas fa-info-circle"></i>';
      }
      
      const content = document.createElement('div');
      content.className = 'history-content';
      content.textContent = event.message;
      
      const time = document.createElement('div');
      time.className = 'history-time';
      time.textContent = formatTimeElapsed(event.timestamp);
      
      item.appendChild(icon);
      item.appendChild(content);
      item.appendChild(time);
      
      historyContainerEl.appendChild(item);
    });
    
    // If no history events
    if (state.history.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-message';
      emptyMessage.textContent = 'No activity recorded yet.';
      historyContainerEl.appendChild(emptyMessage);
    }
  }

  // Update all UI elements
  function updateUI() {
    updateOverallStatus();
    updateMetrics();
    updateEndpoints();
    updateHistory();
  }

  // Listen for endpoint updates
  window.addEventListener('endpoint-updated', () => {
    updateUI();
  });

  // Listen for metrics updates
  window.addEventListener('metrics-updated', () => {
    updateMetrics();
    updateOverallStatus();
  });

  // Initial UI update
  updateUI();

  // Set up periodic UI refresh (for time elapsed displays)
  setInterval(() => {
    updateUI();
  }, 30000); // Update every 30 seconds
});
