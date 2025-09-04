# Quick Start Guide - XRayIOT

## 🚀 **Get Up and Running in 5 Minutes**

This guide will get you from zero to a fully running XRayIOT system in just 5 minutes.

## ⚡ **Prerequisites Check**

Before we start, make sure you have:
- **Node.js** 18+ installed
- **Docker** and **Docker Compose** installed
- **Git** installed
- **5GB** free disk space

```bash
# Quick check
node --version    # Should show 18+ 
docker --version  # Should show 20.10+
git --version     # Any recent version
```

## 🏃‍♂️ **5-Minute Setup**

### **Step 1: Clone and Install (1 minute)**
```bash
# Clone the repository
git clone <repository-url>
cd XRayIOT

# Install dependencies
yarn install
```

### **Step 2: Start Infrastructure (2 minutes)**
```bash
# Start all infrastructure services (MongoDB, RabbitMQ, Redis)
yarn infra:up

# Wait for services to be ready (about 30 seconds)
sleep 30
```

### **Step 3: Start Services (2 minutes)**
```bash
# Terminal 1: API Service
yarn dev:api

# Terminal 2: Signals Service  
yarn dev:signals

# Terminal 3: Producer Service
yarn dev:producer
```

### **Step 4: Verify Everything Works (1 minute)**
```bash
# Test API health
curl http://localhost:3000/api/health

# Expected response:
# {"status":"ok","timestamp":"2024-12-04T10:00:00.000Z"}
```

## 🎉 **You're Done!**

Your XRayIOT system is now running with:
- **API Service**: http://localhost:3000
- **Producer Service**: http://localhost:3001  
- **Signals Service**: http://localhost:3002
- **RabbitMQ Management**: http://localhost:15672 (admin/password)
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

## 🧪 **Test the System**

### **Generate Test Data**
```bash
# Generate some test IoT data
curl -X POST http://localhost:3001/generate-test-data
```

### **View Processed Data**
```bash
# Get all processed signals
curl http://localhost:3000/api/signals

# Get specific signal
curl http://localhost:3000/api/signals/{signal-id}
```

### **Check System Health**
```bash
# All services should return {"status":"ok"}
curl http://localhost:3000/api/health
curl http://localhost:3001/health  
curl http://localhost:3002/health
```

## 🔧 **What's Running**

### **Services**
- **API Service**: REST endpoints for data retrieval
- **Signals Service**: Processes IoT messages and stores data
- **Producer Service**: Generates test IoT data

### **Infrastructure**
- **MongoDB**: Stores processed data and metadata
- **RabbitMQ**: Message queue for service communication
- **Redis**: Idempotency and caching

## 🚨 **Troubleshooting**

### **Port Already in Use**
```bash
# Find what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### **Docker Issues**
```bash
# Restart Docker
sudo systemctl restart docker

# Clean up
docker system prune -a
```

### **Service Won't Start**
```bash
# Check logs
docker-compose logs

# Restart infrastructure
yarn infra:down
yarn infra:up
```

## 📚 **Next Steps**

Now that you have XRayIOT running:

1. **Explore the API**: Check out the [API Reference](../reference/api-reference.md)
2. **Set up Development**: Follow the [Local Setup Guide](../development/local-setup.md)
3. **Learn the Architecture**: Read the [System Overview](../architecture/system-overview.md)
4. **Run Tests**: Try `yarn test` to run the test suite

## 🆘 **Need Help?**

- **Documentation**: Check the [main docs](../README.md)
- **Issues**: Create a GitHub issue
- **Discussions**: Join GitHub discussions

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Ready to Use
