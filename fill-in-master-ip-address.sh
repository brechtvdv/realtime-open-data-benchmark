#!/bin/bash

# replace all occurrences of EXTERNAL_IP in *.y* files with the Kubernetes master's IP address (reported by kubectl)
KUBE_MASTER_IP=$(kubectl cluster-info | head -n 1 | egrep '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' -o --color=never)
if [ "$KUBE_MASTER_IP" == "" ]; then
	# Remove externalIP config
	sed --in-place "s/- EXTERNAL_IP//g" *.y*
	sed --in-place "s/EXTERNAL_IP/localhost/g" influxdb-datasource.yml
else 
	echo "Kubernetes master's IP address is ${KUBE_MASTER_IP}"
	sed --in-place "s/EXTERNAL_IP/${KUBE_MASTER_IP}/g" *.y*
fi