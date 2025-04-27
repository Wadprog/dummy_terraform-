# API-VWN Project

This project contains Terraform configurations to deploy a containerized application on AWS using ECS, RDS, and other AWS services.

## Infrastructure Components

- VPC with public and private subnets
- RDS PostgreSQL database
- ECR repository for Docker images
- ECS cluster using Fargate
- Application Load Balancer
- Express.js application with a sample REST API

## Prerequisites

- AWS CLI configured with appropriate permissions
- Terraform (version >= 1.2.0)
- Docker
- Node.js (for local development)

## Directory Structure

- `app/` - contains the Express.js application
- `infra/` - contains Terraform configurations
  - `modules/` - reusable Terraform modules
    - `vpc/` - VPC configuration
    - `ecr/` - ECR repository configuration
    - `rds/` - RDS configuration
    - `ecs/` - ECS cluster, task and service configurations
    - `alb/` - Application Load Balancer configuration

## Deployment

### 1. Initialize Terraform

```bash
cd infra
terraform init
```

### 2. Set Variables

Create a `terraform.tfvars` file in the `infra` directory with the following content:

```hcl
aws_region       = "us-east-1"  # Change to your desired region
project_name     = "api-vwn"
db_password      = "your-secure-password"  # Change this to a secure password
```

### 3. Deploy the Infrastructure

```bash
terraform apply
```

After reviewing the plan, type `yes` to proceed with the deployment.

### 4. Build and Push the Docker Image

After the infrastructure is deployed, build and push the Docker image to the ECR repository:

```bash
# Navigate to the app directory
cd ../app

# Get the ECR repository URL from Terraform output
ECR_REPO=$(cd ../infra && terraform output -raw ecr_repository_url)

# Authenticate Docker with ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REPO

# Build the Docker image
docker build -t api-vwn .

# Tag the image
docker tag api-vwn:latest $ECR_REPO:latest

# Push the image to ECR
docker push $ECR_REPO:latest
```

### 5. Access the Application

After deploying the infrastructure and pushing the Docker image, you can access the application using the ALB DNS name:

```bash
cd ../infra
terraform output alb_dns_name
```

Use this DNS name to access the API endpoints:

- Health check: `http://<alb_dns_name>/health`
- List items: `http://<alb_dns_name>/api/items`
- Get item by ID: `http://<alb_dns_name>/api/items/1`

## Application Endpoints

- `GET /health` - Health check endpoint
- `GET /api/items` - Get all items
- `GET /api/items/:id` - Get item by ID
- `POST /api/items` - Create a new item (requires JSON body with `name` and optional `description`)

## Clean Up

To delete all resources:

```bash
cd infra
terraform destroy
```

After reviewing the plan, type `yes` to proceed with the deletion. 