# Production Deployment Guide - XRayIOT

## 🎯 **Production Deployment Overview**

This guide provides comprehensive instructions for deploying XRayIOT to production environments, including infrastructure setup, service deployment, monitoring, and maintenance.

## 📋 **Prerequisites**

### **Infrastructure Requirements**
- **Server**: 4+ CPU cores, 8GB+ RAM, 50GB+ storage
- **OS**: Ubuntu 20.04+ LTS (recommended)
- **Docker**: 20.10+ with Docker Compose
- **Network**: Stable internet connection, firewall configured

### **External Services**
- **MongoDB**: 7.0+ (or MongoDB Atlas)
- **RabbitMQ**: 3.12+ (or cloud provider)
- **Redis**: 7.2+ (or cloud provider)
- **Domain**: SSL certificate for HTTPS

### **Security Requirements**
- **SSL/TLS**: Valid SSL certificate
- **Firewall**: Configured ports (80, 443, 22)
- **Secrets**: Secure secret management
- **Backups**: Automated backup strategy

## 🏗️ **Infrastructure Setup**

### **Server Preparation**

#### **1. System Update**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx
```

#### **2. Docker Installation**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

#### **3. Firewall Configuration**
```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Check status
sudo ufw status
```

### **Domain and SSL Setup**

#### **1. Domain Configuration**
```bash
# Point domain to server IP
# A record: your-domain.com -> SERVER_IP
# CNAME record: www.your-domain.com -> your-domain.com
```

#### **2. SSL Certificate (Let's Encrypt)**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## 🐳 **Docker Deployment**

### **Production Docker Compose**

#### **docker-compose.prod.yml**
```yaml
version: '3.8'

services:
  # API Service
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile.optimized
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - MONGO_URI=${MONGO_URI}
      - RABBITMQ_URI=${RABBITMQ_URI}
      - REDIS_URI=${REDIS_URI}
      - API_KEY=${API_KEY}
    depends_on:
      - mongodb
      - rabbitmq
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Signals Service
  signals:
    build:
      context: .
      dockerfile: apps/signals/Dockerfile.optimized
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - PORT=3002
      - MONGO_URI=${MONGO_URI}
      - RABBITMQ_URI=${RABBITMQ_URI}
      - REDIS_URI=${REDIS_URI}
    depends_on:
      - mongodb
      - rabbitmq
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Producer Service
  producer:
    build:
      context: .
      dockerfile: apps/producer/Dockerfile.optimized
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - RABBITMQ_URI=${RABBITMQ_URI}
    depends_on:
      - rabbitmq
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # MongoDB
  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
      - MONGO_INITDB_DATABASE=iotp
    volumes:
      - mongodb_data:/data/db
      - ./scripts/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 3

  # RabbitMQ
  rabbitmq:
    image: rabbitmq:3.12-management
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      - RABBITMQ_DEFAULT_USER=admin
      - RABBITMQ_DEFAULT_PASS=${RABBITMQ_PASSWORD}
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
      - ./config/rabbitmq-definitions.json:/etc/rabbitmq/definitions.json:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis
  redis:
    image: redis:7.2
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  mongodb_data:
  rabbitmq_data:
  redis_data:
```

### **Environment Configuration**

#### **Production Environment (.env.production)**
```bash
# Node Environment
NODE_ENV=production

# MongoDB Configuration
MONGO_URI=mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/iotp?authSource=admin
MONGO_DB=iotp
MONGO_PASSWORD=your-secure-mongo-password

# RabbitMQ Configuration
RABBITMQ_URI=amqp://admin:${RABBITMQ_PASSWORD}@rabbitmq:5672
RABBITMQ_EXCHANGE=iot.xray
RABBITMQ_QUEUE=xray.raw.q
RABBITMQ_DLX=iot.dlx
RABBITMQ_PASSWORD=your-secure-rabbitmq-password

# Redis Configuration
REDIS_URI=redis://redis:6379
IDEMP_TTL_SEC=900
HMAC_NONCE_TTL_SEC=300

# API Configuration
API_KEY=your-secure-api-key
RATE_LIMIT_RPM=600

# Service Ports
API_PORT=3000
SIGNALS_PORT=3002
PRODUCER_PORT=3001

# Security
JWT_SECRET=your-secure-jwt-secret
HMAC_SECRET=your-secure-hmac-secret

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true
```

### **Deployment Process**

#### **1. Clone Repository**
```bash
# Clone repository
git clone <repository-url>
cd XRayIOT

# Checkout production branch
git checkout main

# Create production environment file
cp env.production.example .env.production
nano .env.production
```

#### **2. Build and Deploy**
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### **3. Verify Deployment**
```bash
# Check API health
curl https://your-domain.com/api/health

# Check all services
curl https://your-domain.com/api/health
curl https://your-domain.com:3001/health
curl https://your-domain.com:3002/health
```

## 🌐 **Nginx Configuration**

### **Nginx Reverse Proxy**

#### **nginx.conf**
```nginx
upstream api_backend {
    server localhost:3000;
}

upstream signals_backend {
    server localhost:3002;
}

upstream producer_backend {
    server localhost:3001;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # API Routes
    location /api/ {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Signals Service (if needed externally)
    location /signals/ {
        proxy_pass http://signals_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Producer Service (if needed externally)
    location /producer/ {
        proxy_pass http://producer_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health Check
    location /health {
        proxy_pass http://api_backend/api/health;
        access_log off;
    }

    # Static Files (if any)
    location /static/ {
        alias /var/www/xrayiot/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### **Apply Nginx Configuration**
```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Enable Nginx
sudo systemctl enable nginx
```

## 📊 **Monitoring Setup**

### **Health Monitoring**

#### **Health Check Script**
```bash
#!/bin/bash
# /opt/xrayiot/health-check.sh

API_URL="https://your-domain.com/api/health"
SIGNALS_URL="https://your-domain.com:3002/health"
PRODUCER_URL="https://your-domain.com:3001/health"

# Check API
if curl -f -s $API_URL > /dev/null; then
    echo "API: OK"
else
    echo "API: FAILED"
    exit 1
fi

# Check Signals
if curl -f -s $SIGNALS_URL > /dev/null; then
    echo "Signals: OK"
else
    echo "Signals: FAILED"
    exit 1
fi

# Check Producer
if curl -f -s $PRODUCER_URL > /dev/null; then
    echo "Producer: OK"
else
    echo "Producer: FAILED"
    exit 1
fi

echo "All services healthy"
```

#### **Cron Job for Health Checks**
```bash
# Add to crontab
crontab -e

# Check every 5 minutes
*/5 * * * * /opt/xrayiot/health-check.sh >> /var/log/xrayiot-health.log 2>&1
```

### **Log Management**

#### **Log Rotation Configuration**
```bash
# /etc/logrotate.d/xrayiot
/var/log/xrayiot/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        docker-compose -f /opt/xrayiot/docker-compose.prod.yml restart
    endscript
}
```

## 🔄 **Deployment Automation**

### **Deployment Script**

#### **deploy.sh**
```bash
#!/bin/bash
# /opt/xrayiot/deploy.sh

set -e

echo "Starting XRayIOT deployment..."

# Navigate to project directory
cd /opt/xrayiot

# Pull latest changes
git pull origin main

# Build new images
docker-compose -f docker-compose.prod.yml build

# Stop services gracefully
docker-compose -f docker-compose.prod.yml down

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
sleep 30

# Run health checks
./health-check.sh

echo "Deployment completed successfully!"
```

#### **Make Script Executable**
```bash
chmod +x /opt/xrayiot/deploy.sh
```

### **GitHub Actions Deployment**

#### **.github/workflows/deploy.yml**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /opt/xrayiot
          ./deploy.sh
```

## 🔒 **Security Configuration**

### **Firewall Rules**
```bash
# Allow only necessary ports
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 3000:3002  # Block direct access to services
sudo ufw enable
```

### **Docker Security**
```bash
# Run containers as non-root user
# Add to docker-compose.prod.yml
user: "1001:1001"

# Use read-only root filesystem
read_only: true

# Limit container resources
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
```

### **Secrets Management**
```bash
# Use Docker secrets for sensitive data
# Create secrets
echo "your-secure-password" | docker secret create mongo_password -
echo "your-secure-api-key" | docker secret create api_key -

# Reference in docker-compose.prod.yml
secrets:
  - mongo_password
  - api_key
```

## 📈 **Performance Optimization**

### **Docker Optimization**
```bash
# Use multi-stage builds
# Optimize image layers
# Use .dockerignore
# Enable BuildKit
export DOCKER_BUILDKIT=1
```

### **Database Optimization**
```bash
# MongoDB indexes
db.signals.createIndex({ "deviceId": 1, "timestamp": -1 })
db.signals.createIndex({ "timestamp": -1 })
db.signals.createIndex({ "processedAt": 1 }, { expireAfterSeconds: 2592000 })
```

### **Nginx Optimization**
```nginx
# Enable gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Enable caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Service Won't Start**
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs service_name

# Check resource usage
docker stats

# Check disk space
df -h
```

#### **Database Connection Issues**
```bash
# Check MongoDB logs
docker logs xrayiot_mongodb

# Test connection
docker exec -it xrayiot_mongodb mongosh --eval "db.adminCommand('ping')"
```

#### **SSL Certificate Issues**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test SSL
openssl s_client -connect your-domain.com:443
```

### **Emergency Procedures**

#### **Rollback Deployment**
```bash
# Stop current services
docker-compose -f docker-compose.prod.yml down

# Checkout previous version
git checkout HEAD~1

# Deploy previous version
docker-compose -f docker-compose.prod.yml up -d
```

#### **Database Recovery**
```bash
# Restore from backup
docker exec -i xrayiot_mongodb mongorestore --archive < backup.archive

# Check database integrity
docker exec -it xrayiot_mongodb mongosh --eval "db.runCommand({dbStats: 1})"
```

## 📚 **Maintenance Tasks**

### **Daily Tasks**
- Monitor service health
- Check disk space
- Review error logs
- Verify backups

### **Weekly Tasks**
- Update system packages
- Review security logs
- Check certificate expiration
- Analyze performance metrics

### **Monthly Tasks**
- Update application dependencies
- Review and rotate secrets
- Test disaster recovery procedures
- Update documentation

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: Operations Team  
**Status**: Production Ready
