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
  count = var.single_nat_gateway ? 1 : 0

  domain = "vpc"

  tags = merge(
    local.common_tags,
    {
      Name = "${var.name}-nat-eip"
    }
  )
}

resource "aws_nat_gateway" "this" {
  count = var.single_nat_gateway ? 1 : 0

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[var.availability_zones[0]].id

  tags = merge(
    local.common_tags,
    {
      Name = "${var.name}-nat"
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
  vpc_id = aws_vpc.this.id

  dynamic "route" {
    for_each = var.single_nat_gateway ? [aws_nat_gateway.this[0].id] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = route.value
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.name}-private-rt"
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

  subnet_id      = each.value.id
  route_table_id = aws_route_table.private.id
}
