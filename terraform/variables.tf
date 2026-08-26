variable "linode_token" {
  description = "Linode API token, read and write"
  type        = string
  sensitive   = true
}

variable "cluster_label" {
  description = "LKE cluster label"
  type        = string
  default     = "website"
}

variable "region" {
  description = "Linode region"
  type        = string
  default     = "us-east"
}

variable "k8s_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.36"
}

variable "node_type" {
  description = "Linode instance type"
  type        = string
  default     = "g6-standard-1" # shared CPU, Linode 2GB
}

variable "node_count" {
  description = "Number of nodes"
  type        = number
  default     = 3
}