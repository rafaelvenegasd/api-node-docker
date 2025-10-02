# B2B Order Management System

A comprehensive technical implementation for a B2B order management system featuring two REST APIs (Customers and Orders) and a Lambda orchestrator service. Built with Node.js, TypeScript, MySQL, and Docker for easy deployment and development.

## 🏗️ Architecture Overview

This monorepo contains:

- **Customers API** (`/customers-api`) - Customer management service (Port 3001)
- **Orders API** (`/orders-api`) - Product and order management service (Port 3002)
- **Lambda Orchestrator** (`/lambda-orchestrator`) - AWS Lambda function for atomic order operations
- **Database** (`/db`) - MySQL schema and seed data
- **Docker Compose** - Complete containerized environment

## 📋 Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- AWS CLI (for Lambda deployment)
- Git

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd api-node-docker
```

### 2. Environment Configuration

Copy environment files and configure:

```bash
# Copy environment templates
cp customers-api/.env.example customers-api/.env
cp orders-api/.env.example orders-api/.env
cp lambda-orchestrator/.env.example lambda-orchestrator/.env

# Edit environment files with your configuration
# Main variables to configure:
# - Database credentials
# - JWT secrets
# - Service tokens
# - API base URLs
```

### 3. Start with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# Or build first, then start
docker-compose build
docker-compose up -d

# Note: The first time you run this, it may take a few minutes for npm install
# to complete in each container before the services are fully ready.
```

### 4. Verify Services

Check that all services are running:

- **MySQL Database**: `http://localhost:3306`
- **Customers API**: `http://localhost:3001/health`
- **Orders API**: `http://localhost:3002/health`
- **Lambda Orchestrator**: `http://localhost:3003/health` (local development)

## 🔧 Development Setup

### Individual Service Development

#### Customers API

```bash
cd customers-api

# Install dependencies (required before running individually)
npm install

# Copy environment file
cp .env.example .env

# Start in development mode
npm run dev

# Build for production
npm run build
npm start
```

#### Orders API

```bash
cd orders-api

# Install dependencies (required before running individually)
npm install

# Copy environment file
cp .env.example .env

# Start in development mode
npm run dev

# Build for production
npm run build
npm start
```

#### Lambda Orchestrator

```bash
cd lambda-orchestrator

# Install dependencies (required before running individually)
npm install

# Copy environment file
cp .env.example .env

# Start local development server
npm run dev

# Deploy to AWS Lambda
npm run deploy
```

## 📚 API Documentation

### Customers API (Port 3001)

#### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/customers` | Create new customer |
| GET | `/api/v1/customers/:id` | Get customer details |
| GET | `/api/v1/customers` | List/search customers |
| PUT | `/api/v1/customers/:id` | Update customer |
| DELETE | `/api/v1/customers/:id` | Delete customer |
| GET | `/api/v1/internal/customers/:id` | Internal customer validation |

#### Example Usage

```bash
# Create customer
curl -X POST http://localhost:3001/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ACME Corporation",
    "email": "ops@acme.com",
    "phone": "+1-555-0101"
  }'

# Get customer
curl http://localhost:3001/api/v1/customers/1

# List customers with pagination
curl "http://localhost:3001/api/v1/customers?limit=10&cursor=0"
```

### Orders API (Port 3002)

#### Product Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/products` | Create new product |
| GET | `/api/v1/products/:id` | Get product details |
| GET | `/api/v1/products` | List/search products |
| PATCH | `/api/v1/products/:id` | Update product |

#### Order Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/orders` | Create new order |
| GET | `/api/v1/orders/:id` | Get order details |
| GET | `/api/v1/orders` | List orders with filters |
| POST | `/api/v1/orders/:id/confirm` | Confirm order (idempotent) |
| POST | `/api/v1/orders/:id/cancel` | Cancel order |

#### Example Usage

```bash
# Create product
curl -X POST http://localhost:3002/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "LAPTOP-001",
    "name": "Professional Laptop",
    "price_cents": 129900,
    "stock": 50
  }'

# Create order
curl -X POST http://localhost:3002/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "items": [
      {
        "product_id": 1,
        "qty": 2
      }
    ]
  }'

# Confirm order
curl -X POST http://localhost:3002/api/v1/orders/1/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "idempotency_key": "unique-key-123"
  }'
```

### Lambda Orchestrator

#### Main Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orchestrator/create-and-confirm-order` | Atomic order creation and confirmation |

#### Example Usage

```bash
# Create and confirm order atomically
curl -X POST http://localhost:3003/orchestrator/create-and-confirm-order \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "items": [
      {
        "product_id": 1,
        "qty": 2
      }
    ],
    "idempotency_key": "unique-key-123",
    "correlation_id": "req-789"
  }'
```

## 🗄️ Database Schema

### Core Tables

- **customers** - Customer information
- **products** - Product catalog with stock management
- **orders** - Order headers with status tracking
- **order_items** - Individual order line items
- **idempotency_keys** - Prevents duplicate order operations

## 🔒 Security Features

- **JWT Authentication** - Stateless token-based auth for Customers API
- **Service Tokens** - Internal API authentication between services
- **Input Validation** - Zod schema validation for all inputs
- **SQL Injection Protection** - Parameterized queries throughout
- **CORS Protection** - Configurable cross-origin policies
- **Helmet Security** - Security headers middleware


## 🚢 Deployment

### Local Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f customers-api
docker-compose logs -f orders-api
docker-compose logs -f mysql

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose build --no-cache
docker-compose up -d
```

### AWS Lambda Deployment

```bash
cd lambda-orchestrator

# Configure AWS credentials
aws configure

# Deploy to AWS
serverless deploy

# Deploy specific stage
serverless deploy --stage production

# Get deployment info
serverless info

# Remove deployment
serverless remove
```

### Production Considerations

1. **Environment Variables**: Use strong, unique secrets for production
2. **Database**: Configure production MySQL instance
3. **Monitoring**: Add logging and monitoring solutions
4. **SSL/TLS**: Configure HTTPS for all services
5. **Load Balancing**: Consider API gateway for production scale

## 📊 Monitoring and Health Checks

All services include health check endpoints:

- **Customers API**: `GET /health`
- **Orders API**: `GET /health`
- **Lambda Orchestrator**: `GET /health`

Health checks verify:
- Database connectivity
- Service availability
- Critical dependencies



## 🛠️ Development Scripts

Each service includes these npm scripts:

- `build` - Compile TypeScript to JavaScript
- `start` - Run production build
- `dev` - Run development server with hot reload
- `migrate` - Database migration placeholder
- `seed` - Seed database with sample data
- `test` - Run test suite

## 📝 API Examples

### Complete Order Flow Example

```bash
# 1. Create a customer
CUSTOMER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Example Corp",
    "email": "orders@example.com",
    "phone": "+1-555-0123"
  }')

CUSTOMER_ID=$(echo $CUSTOMER_RESPONSE | jq -r '.data.id')

# 2. Create products
PRODUCT1_RESPONSE=$(curl -s -X POST http://localhost:3002/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PROD-001",
    "name": "Sample Product",
    "price_cents": 10000,
    "stock": 100
  }')

PRODUCT_ID=$(echo $PRODUCT1_RESPONSE | jq -r '.data.id')

# 3. Create and confirm order atomically via Lambda
ORCHESTRATOR_RESPONSE=$(curl -s -X POST http://localhost:3003/orchestrator/create-and-confirm-order \
  -H "Content-Type: application/json" \
  -d "{
    \"customer_id\": $CUSTOMER_ID,
    \"items\": [
      {
        \"product_id\": $PRODUCT_ID,
        \"qty\": 2
      }
    ],
    \"idempotency_key\": \"order-$(date +%s)\",
    \"correlation_id\": \"example-flow-$(date +%s)\"
  }")

echo $ORCHESTRATOR_RESPONSE | jq .
```

## 🔧 Configuration

### Environment Variables

#### Database Configuration
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 3306)
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name (default: b2b_orders)

#### Security
- `JWT_SECRET` - JWT signing secret
- `SERVICE_TOKEN` - Internal service authentication token

#### API Configuration
- `CUSTOMERS_API_BASE` - Base URL for Customers API
- `ORDERS_API_BASE` - Base URL for Orders API


### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
DEBUG=* npm run dev
```


---

**Built with ❤️ 4U Jelou Team**
