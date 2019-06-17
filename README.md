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

### Run

Run on the kubernetes master:
```
./fill-in-master-ip-address.sh
./experiment1.sh
```
You can browse to `<KUBE_MASTER_IP>:3000` to see Grafana with the results.

You can scale the amount of clients with, for example:
```
kubectl scale deployement/client --replicas=50
```

## Experiment 1

First, we want to test the latency according to the amount of clients with polling or pubsub, regardless of the liveness of the data; update frequency does not matter.

The request mode and polling interval of the clients can be set in `experiment1_client.yaml` with `MODE` to "pubsub" or "polling".
ALso, the polling interval of the clients can be set with `POLLING_INTERVAL` to the amount of milliseconds between HTTP requests.

For this experiment, the polling interval is fixed to 1 second and the update interval to 5 seconds.

<!-- This server has 3.7 GB of memory and uses a Dual-Core AMD Opteron(tm) Processor 2212 with 2010.276 MHz. -->

Hypothesis: *Pubsub and polling without HTTP cache interfaces induce a linear amount of latency according to the amount of users.*
Hypothesis: *Polling interfaces with a HTTP cache induce a more flatten amount of latency according to the amount of users.*
Hypothesis: *At a certain amount of users (cut-off point), the amount of latency of a pubsub interface exceeds the polling interface with HTTP cache.*

## Experiment 2

First, we want to test the maximum amount of CPU percentage on the server according to the amount of clients with polling or pubsub, regardless of the liveness of the data; update frequency does not matter.

The request mode and polling interval of the clients can be set in `experiment1_client.yaml` with `MODE` to "pubsub" or "polling".
ALso, the polling interval of the clients can be set with `POLLING_INTERVAL` to the amount of milliseconds between HTTP requests.

For this experiment, the polling interval is fixed to 1 second and the update interval to 5 seconds.

<!-- This server has 3.7 GB of memory and uses a Dual-Core AMD Opteron(tm) Processor 2212 with 2010.276 MHz. -->

Hypothesis: *Pubsub and polling without HTTP cache interfaces induce a linear amount of CPU usage according to the amount of users.*
Hypothesis: *Polling interfaces with a HTTP cache induce a more flatten amount of CPU usage according to the amount of users.*
Hypothesis: *At a certain amount of users (cut-off point), the amount of CPU of a pubsub interface exceeds the polling interface with HTTP cache.*
	
## Retrieve results

With Grafana (easy):
select on the visualisation the part you want to export. Note: the values that you see are what you will export.
Then select on the title of the visualisation and select "More..." > Export CSV > "Series as Columns" with Excel CSV dialect enabled

With CLI:
```
curl -H "Accept: application/csv" -G 'http://<KUBE_MASTER_IP>:8086/query?db=experiment1' --data-urlencode 'q=SELECT * FROM usage_server' > example.csv
```
