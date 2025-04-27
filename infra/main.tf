module "vpc" {
  source = "./modules/vpc"

  project_name         = var.project_name
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

module "ecr" {
  source = "./modules/ecr"

  repository_name = "${var.project_name}-repository"
}

# Create secrets for database
resource "aws_secretsmanager_secret" "db_password" {
  name        = "${var.project_name}-db-password-new"
  description = "Database password for ${var.project_name}"

  tags = {
    Name = "${var.project_name}-db-password"
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = var.db_password
}

# Create IAM policy for accessing the secret
resource "aws_iam_policy" "secrets_access" {
  name        = "${var.project_name}-secrets-access"
  description = "Policy to access the database secret"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Effect   = "Allow"
        Resource = aws_secretsmanager_secret.db_password.arn
      }
    ]
  })
}

module "alb" {
  source = "./modules/alb"

  project_name       = var.project_name
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  health_check_path  = var.health_check_path
}

# Create RDS module
module "rds" {
  source = "./modules/rds"

  project_name          = var.project_name
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  app_security_group_id = module.ecs.ecs_security_group_id
  db_name               = var.db_name
  db_username           = var.db_username
  db_password           = var.db_password
  db_instance_class     = var.db_instance_class
}

# Create ECS module
module "ecs" {
  source = "./modules/ecs"

  project_name          = var.project_name
  aws_region            = var.aws_region
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  alb_security_group_id = module.alb.alb_security_group_id
  target_group_arn      = module.alb.target_group_arn
  lb_listener           = module.alb.alb_id
  ecr_repository_url    = module.ecr.repository_url
  container_port        = var.container_port
  task_cpu              = var.ecs_task_cpu
  task_memory           = var.ecs_task_memory
  desired_count         = var.desired_count
  db_host               = split(":", module.rds.db_instance_endpoint)[0]
  db_name               = var.db_name
  db_username           = var.db_username
  db_password_arn       = aws_secretsmanager_secret.db_password.arn
}

# Attach secrets access policy to ECS task execution role
resource "aws_iam_role_policy_attachment" "task_execution_role_secrets_access" {
  role       = module.ecs.task_execution_role_name
  policy_arn = aws_iam_policy.secrets_access.arn
}
