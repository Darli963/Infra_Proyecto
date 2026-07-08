output "vpc_id" {
  description = "ID de la VPC creada."
  value       = aws_vpc.this.id
}

output "public_subnet_ids" {
  description = "IDs de las subnets públicas."
  value       = [for subnet in aws_subnet.public : subnet.id]
}

output "private_subnet_ids" {
  description = "IDs de las subnets privadas."
  value       = [for subnet in aws_subnet.private : subnet.id]
}

output "internet_gateway_id" {
  description = "ID del Internet Gateway."
  value       = aws_internet_gateway.this.id
}

output "nat_gateway_id" {
  description = "ID del NAT Gateway."
  value       = var.enable_nat_gateway ? aws_nat_gateway.this[var.availability_zones[0]].id : null
}

output "public_route_table_id" {
  description = "ID de la route table pública."
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "IDs de las route tables privadas."
  value       = var.enable_nat_gateway ? values(aws_route_table.private)[*].id : [aws_route_table.private["isolated"].id]
}
