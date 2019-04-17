#!/bin/bash

kubectl delete service,deployment,secrets,configmap server influx client

kubectl create -f ./experiment1_influx.yaml

# Sleep so influx is ready
sleep 20

kubectl create -f ./experiment1_server.yaml

kubectl create -f ./experiment1_client.yaml

# Grafana
kubectl delete service,deployment,secrets,configmap grafana grafana-creds grafana-config

kubectl create configmap grafana-config \
  --from-file=influxdb-datasource.yml=influxdb-datasource.yml \
  --from-file=dashboard-usage-server.json=dashboard-usage-server.json \
  --from-file=grafana-dashboard-provider.yml=grafana-dashboard-provider.yml

kubectl create -f ./experiment1_grafana.yaml
