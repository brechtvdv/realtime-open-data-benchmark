#!/bin/bash

kubectl delete service,deployment,secrets,configmap server influx client run-nginx

kubectl create configmap run-nginx \
  --from-file=run_nginx.sh=run_nginx.sh

kubectl create -f ./experiment1_influx.yaml

# Sleep so influx is ready
sleep 20

kubectl create -f ./experiment1_server.yaml

# Grafana
kubectl delete service,deployment,secrets,configmap grafana grafana-creds grafana-config

kubectl create configmap grafana-config \
  --from-file=influxdb-datasource.yml=influxdb-datasource.yml \
  --from-file=dashboard-usage-server.json=dashboard-usage-server.json \
  --from-file=grafana-dashboard-provider.yml=grafana-dashboard-provider.yml

kubectl create -f ./experiment1_grafana.yaml

alias util='kubectl get nodes | grep node | awk '\''{print $1}'\'' | xargs -I {} sh -c '\''echo   {} ; kubectl describe node {} | grep Allocated -A 5 | grep -ve Event -ve Allocated -ve percent -ve -- ; echo '\'''

sleep 60

kubectl create -f ./experiment1_client.yaml