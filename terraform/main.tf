resource "linode_lke_cluster" "website" {
  label       = var.cluster_label
  region      = var.region
  k8s_version = var.k8s_version
  tags        = []

  pool {
    type  = var.node_type
    count = var.node_count
  }
}
