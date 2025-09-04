# Monitoring & Observability - XRayIOT

## 🎯 **System Monitoring Overview**

This guide covers comprehensive monitoring and observability for the XRayIOT system, including health checks, metrics, logging, and alerting.

## 📊 **Monitoring Architecture**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Services   │───▶│  Metrics    │───▶│  Dashboard  │
│  (Health)   │    │  Collection │    │  (Grafana)  │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Logs      │    │  Prometheus │    │  Alerting   │
│ (Structured)│    │  (Metrics)  │    │ (PagerDuty) │
└─────────────┘    └─────────────┘    └─────────────┘
```

## 🏥 **Health Monitoring**

### **Service Health Checks**

#### **API Service Health**
```bash
# Basic health check
curl http://localhost:3000/api/health

# Expected response
{
  "status": "ok",
  "timestamp": "2024-12-04T10:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

#### **Signals Service Health**
```bash
# Service health
curl http://localhost:3002/health

# Expected response
{
  "status": "ok",
  "timestamp": "2024-12-04T10:00:00.000Z",
  "processedMessages": 1000,
  "queueDepth": 0
}
```

#### **Producer Service Health**
```bash
# Service health
curl http://localhost:3001/health

# Expected response
{
  "status": "ok",
  "timestamp": "2024-12-04T10:00:00.000Z",
  "messagesGenerated": 5000
}
```

### **Infrastructure Health Checks**

#### **MongoDB Health**
```bash
# Database health
docker exec -it xrayiot_mongodb mongosh --eval "db.adminCommand('ping')"

# Expected response
{ ok: 1 }
```

#### **RabbitMQ Health**
```bash
# Queue health
curl -u admin:password http://localhost:15672/api/queues

# Expected response
[
  {
    "name": "xray.raw.q",
    "messages": 0,
    "consumers": 1,
    "state": "running"
  }
]
```

#### **Redis Health**
```bash
# Cache health
docker exec -it xrayiot_redis redis-cli ping

# Expected response
PONG
```

## 📈 **Metrics Collection**

### **Application Metrics**

#### **API Service Metrics**
```typescript
// Request metrics
const requestMetrics = {
  totalRequests: 10000,
  successfulRequests: 9950,
  failedRequests: 50,
  averageResponseTime: 150, // milliseconds
  p95ResponseTime: 300,
  p99ResponseTime: 500
};

// Database metrics
const dbMetrics = {
  totalQueries: 50000,
  averageQueryTime: 50,
  slowQueries: 5,
  connectionPoolSize: 10,
  activeConnections: 8
};
```

#### **Signals Service Metrics**
```typescript
// Message processing metrics
const processingMetrics = {
  messagesProcessed: 100000,
  messagesPerSecond: 50,
  averageProcessingTime: 100,
  failedMessages: 100,
  retryAttempts: 200
};

// Storage metrics
const storageMetrics = {
  documentsStored: 100000,
  storageUsed: 1024 * 1024 * 1024, // 1GB
  averageDocumentSize: 1024,
  gridfsFiles: 50000
};
```

### **Infrastructure Metrics**

#### **System Metrics**
```typescript
// CPU and Memory
const systemMetrics = {
  cpuUsage: 25, // percentage
  memoryUsage: 512, // MB
  diskUsage: 2048, // MB
  networkIn: 100, // MB/s
  networkOut: 50 // MB/s
};

// Container metrics
const containerMetrics = {
  containerCount: 6,
  runningContainers: 6,
  restartCount: 0,
  totalMemoryUsage: 2048 // MB
};
```

## 📝 **Logging Strategy**

### **Structured Logging**

#### **Log Format**
```json
{
  "timestamp": "2024-12-04T10:00:00.000Z",
  "level": "info",
  "service": "api",
  "correlationId": "req_123456",
  "message": "Request processed successfully",
  "metadata": {
    "method": "GET",
    "path": "/api/signals",
    "statusCode": 200,
    "responseTime": 150
  }
}
```

#### **Log Levels**
- **DEBUG**: Detailed information for debugging
- **INFO**: General information about system operation
- **WARN**: Warning messages for potential issues
- **ERROR**: Error messages for failed operations
- **FATAL**: Critical errors that cause system failure

### **Log Aggregation**

#### **Centralized Logging**
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  elasticsearch:
    image: elasticsearch:8.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  logstash:
    image: logstash:8.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5044:5044"

  kibana:
    image: kibana:8.0
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
```

## 🚨 **Alerting System**

### **Alert Rules**

#### **Critical Alerts**
```yaml
# Critical service down
- alert: ServiceDown
  expr: up{job="xrayiot-api"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "API service is down"
    description: "API service has been down for more than 1 minute"

# High error rate
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "High error rate detected"
    description: "Error rate is above 10% for more than 2 minutes"
```

#### **Warning Alerts**
```yaml
# High response time
- alert: HighResponseTime
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High response time"
    description: "95th percentile response time is above 500ms"

# High memory usage
- alert: HighMemoryUsage
  expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.8
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High memory usage"
    description: "Memory usage is above 80%"
```

### **Notification Channels**

#### **Slack Integration**
```yaml
# slack_config.yml
global:
  slack_api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'slack-notifications'

receivers:
- name: 'slack-notifications'
  slack_configs:
  - channel: '#xrayiot-alerts'
    title: 'XRayIOT Alert'
    text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
```

## 📊 **Dashboards**

### **Grafana Dashboard**

#### **System Overview Dashboard**
```json
{
  "dashboard": {
    "title": "XRayIOT System Overview",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{service}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "Error rate"
          }
        ]
      }
    ]
  }
}
```

#### **Infrastructure Dashboard**
```json
{
  "dashboard": {
    "title": "XRayIOT Infrastructure",
    "panels": [
      {
        "title": "CPU Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "100 - (avg by (instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "CPU Usage %"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100",
            "legendFormat": "Memory Usage %"
          }
        ]
      },
      {
        "title": "Disk Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "100 - ((node_filesystem_avail_bytes * 100) / node_filesystem_size_bytes)",
            "legendFormat": "Disk Usage %"
          }
        ]
      }
    ]
  }
}
```

## 🔧 **Monitoring Setup**

### **Prometheus Configuration**
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'xrayiot-api'
    static_configs:
      - targets: ['api:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'xrayiot-signals'
    static_configs:
      - targets: ['signals:3002']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'xrayiot-producer'
    static_configs:
      - targets: ['producer:3001']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
    scrape_interval: 15s
```

### **Docker Compose for Monitoring**
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-storage:/var/lib/grafana

  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'

volumes:
  grafana-storage:
```

## 🚀 **Monitoring Commands**

### **Start Monitoring Stack**
```bash
# Start monitoring services
docker-compose -f docker-compose.monitoring.yml up -d

# Check status
docker-compose -f docker-compose.monitoring.yml ps
```

### **Access Monitoring Tools**
```bash
# Prometheus
open http://localhost:9090

# Grafana
open http://localhost:3001
# Username: admin, Password: admin
```

### **Check Metrics**
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check specific metric
curl "http://localhost:9090/api/v1/query?query=up"
```

## 📋 **Monitoring Checklist**

### **Daily Checks**
- [ ] All services are healthy
- [ ] No critical alerts
- [ ] Response times are normal
- [ ] Error rates are low
- [ ] Resource usage is normal

### **Weekly Checks**
- [ ] Review alert history
- [ ] Check log retention
- [ ] Verify backup status
- [ ] Update monitoring rules
- [ ] Review performance trends

### **Monthly Checks**
- [ ] Capacity planning review
- [ ] Alert rule optimization
- [ ] Dashboard updates
- [ ] Monitoring tool updates
- [ ] Documentation updates

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Production Ready
