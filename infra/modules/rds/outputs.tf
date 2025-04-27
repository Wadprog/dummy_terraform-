output "db_instance_endpoint" {
  description = "The connection endpoint for the RDS instance"
  value       = aws_db_instance.main.endpoint
}

output "db_instance_name" {
  description = "The database name"
  value       = aws_db_instance.main.db_name
}

output "db_security_group_id" {
  description = "The security group ID of the RDS instance"
  value       = aws_security_group.db.id
} 