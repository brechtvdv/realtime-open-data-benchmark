#!/bin/bash

kubectl delete service,deployment,secrets,configmap grafana grafana-creds grafana-config

kubectl create configmap grafana-config \
  --from-file=influxdb-datasource.yml=influxdb-datasource.yml \
  --from-file=dashboard-usage-server.json=dashboard-usage-server.json \
  --from-file=grafana-dashboard-provider.yml=grafana-dashboard-provider.yml

kubectl create -f ./experiment1_grafana.yaml
