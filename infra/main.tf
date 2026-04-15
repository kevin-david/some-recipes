terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}

variable "account_id" {
  type    = string
  default = "1c0e38c5fd46f502123b479cfed07506"
}

resource "cloudflare_d1_database" "db" {
  account_id = var.account_id
  name       = "some-recipes-db"

  lifecycle {
    ignore_changes = [read_replication]
  }
}

resource "cloudflare_pages_project" "site" {
  account_id = var.account_id
  name       = "some-recipes"

  production_branch = "master"
}

output "d1_database_id" {
  value = cloudflare_d1_database.db.id
}

output "pages_url" {
  value = "https://${cloudflare_pages_project.site.name}.pages.dev"
}
