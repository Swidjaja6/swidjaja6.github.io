terraform {
  required_version = ">= 1.5"

  # Added for remote state management in Terraform Cloud
  cloud {
    organization = "seanslab"
    workspaces {
      name = "website-lke"
    }
  }


  required_providers {
    linode = {
      source  = "linode/linode"
      version = "~> 2.0"
    }
  }
}

provider "linode" {
  token = var.linode_token
}