# Real-time Open Data benchmark

This set of experiments tries to give an answer when a Open Data publisher can use HTTP polling and otherwise use publish/subscribe for real-time data.

This benchmark uses a Kubernetes cluster to scale up to a dozen of clients.
One server is configured to deploy pull- and push-based interfaces.
A gateway can be configured to add network impairment. 

Research question: *What is the cut-off point between HTTP polling and publish/subscribe (pubsub) interfaces for real-time Open Data?*

Note: Server-Sent-Events (SSE) is tested for pubsub systems to use the same protocol (HTTP) as polling.

## Common preparation

This common preparation applies to all experiments `X`.

### Clone
Clone this repository on the master on cd to it.
```
git clone https://github.com/xxx/realtime-open-data-benchmark.git
cd realtime-open-data-benchmark
```

### Kubernetes master's IP address
Some files need to be adapted to contain the IP address `<KUBE_MASTER_IP>` of the kubernetes master.
These files have a placeholder for it: `EXTERNAL_IP`.
The value of `<KUBE_MASTER_IP>` could be found by running `kubectl cluster-info`,
but a script automates the entire file update procedure: `./fill-in-master-ip-address.sh`.

## Experiment 1

First, we want to test how many clients can be served with our server.
This server has 3.7 GB of memory and uses a Dual-Core AMD Opteron(tm) Processor 2212 with 2010.276 MHz.

Hypothesis: *Pubsub interfaces induce a linear amount of resources according to the amount of users.*

Run on the kubernetes master:
```
./fill-in-master-ip-address.sh
./experiment1.sh
```

You can browse to `<KUBE_MASTER_IP>:31306` to see Grafana with the results.
	
## Experiment 2

Hypothesis: *Pubsub interfaces have a constant total user latency according to the time between observations.*

## Retrieve results
```
curl -H "Accept: application/csv" -G 'http://<KUBE_MASTER_IP>:8086/query?db=experiment1' --data-urlencode 'q=SELECT * FROM usage_server' > example.csv
```
