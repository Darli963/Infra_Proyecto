terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

locals {
  common_tags = merge(
    {
      Module = "networking"
    },
    var.tags
  )

  public_subnets = {
    for index, az in var.availability_zones :
    az => {
      az   = az
      cidr = var.public_subnet_cidrs[index]
      name = "${var.name}-public-${index + 1}"
    }
  }

  private_subnets = {
    for index, az in var.availability_zones :
    az => {
      az   = az
      cidr = var.private_subnet_cidrs[index]
      name = "${var.name}-private-${index + 1}"
    }
  }

  nat_gateway_azs = var.single_nat_gateway ? [var.availability_zones[0]] : var.availability_zones
  nat_gateways    = var.enable_nat_gateway ? { for az in local.nat_gateway_azs : az => az } : {}
  private_route_tables = var.enable_nat_gateway ? (
    var.single_nat_gateway ? { shared = var.availability_zones[0] } : { for az in var.availability_zones : az => az }
  ) : { isolated = "isolated" }
}

resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(
    local.common_tags,
    {
      Name = "${var.name}-vpc"
    }
  )

  lifecycle {
    precondition {
      condition     = length(var.availability_zones) > 0 && length(var.availability_zones) == length(var.public_subnet_cidrs) && length(var.availability_zones) == length(var.private_subnet_cidrs)
      error_message = "Debes definir la misma cantidad de availability_zones, public_subnet_cidrs y private_subnet_cidrs."
    }
  }
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = merge(
    local.common_tags,
    {
      Name = "${var.name}-igw"
    }
  )
}

resource "aws_subnet" "public" {
  for_each = local.public_subnets

  vpc_id                  = aws_vpc.this.id
  cidr_block              = each.value.cidr
  availability_zone       = each.value.az
  map_public_ip_on_launch = var.map_public_ip_on_launch

  tags = merge(
    local.common_tags,
    {
      Name = each.value.name
      Tier = "public"
    }
  )
}

resource "aws_subnet" "private" {
  for_each = local.private_subnets

  vpc_id            = aws_vpc.this.id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az

  tags = merge(
    local.common_tags,
    {
      Name = each.value.name
      Tier = "private"
    }
  )
}

resource "aws_eip" "nat" {
  for_each = local.nat_gateways

  domain = "vpc"

  tags = merge(
    local.common_tags,
    {
      Name = "${var.name}-nat-eip-${each.key}"
    }
  )
}

resource "aws_nat_gateway" "this" {
  for_each = local.nat_gateways

  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = aws_subnet.public[each.key].id

  tags = merge(
    local.common_tags,
    {
      Name = "${var.name}-nat-${each.key}"
    }
  )

  depends_on = [aws_internet_gateway.this]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.name}-public-rt"
    }
  )
}

resource "aws_route_table" "private" {
  for_each = local.private_route_tables

  vpc_id = aws_vpc.this.id

  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []

    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = var.single_nat_gateway ? aws_nat_gateway.this[var.availability_zones[0]].id : aws_nat_gateway.this[each.key].id
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = each.key == "shared" ? "${var.name}-private-rt" : "${var.name}-private-rt-${each.key}"
    }
  )
}

resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  for_each = aws_subnet.private

  subnet_id = each.value.id
  route_table_id = var.enable_nat_gateway ? (
    var.single_nat_gateway ? aws_route_table.private["shared"].id : aws_route_table.private[each.key].id
  ) : aws_route_table.private["isolated"].id
}
