#!/bin/bash

kubectl delete service,deployment,secrets,configmap server influx client

kubectl create -f ./experiment1_influx.yaml

# Sleep so influx is ready
sleep 20

kubectl create -f ./experiment1_server.yaml

kubectl create -f ./experiment1_client.yaml