resource "linode_firewall" "lke_nodes" {
  label           = "website-fw"
  inbound_policy  = "DROP"
  outbound_policy = "ACCEPT"

  # Only allows traffic from cluster's private network and Tailscale network
    inbound {
    label    = "intra-cluster-tcp"
    action   = "ACCEPT"
    protocol = "TCP"
    ports    = "1-65535"
    ipv4     = ["192.168.128.0/17", "10.2.0.0/16", "10.128.0.0/16"]
  }

  inbound {
    label    = "intra-cluster-udp"
    action   = "ACCEPT"
    protocol = "UDP"
    ports    = "1-65535"
    ipv4     = ["192.168.128.0/17", "10.2.0.0/16", "10.128.0.0/16"]
  }

  # Attach to the node pool's instances
  linodes = [for n in linode_lke_cluster.website.pool[0].nodes : n.instance_id]
}