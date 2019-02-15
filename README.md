# Real-time Open Data benchmark

This set of experiments tries to give an answer when a Open Data publisher can use HTTP polling and otherwise use publish/subscribe for real-time data.

This benchmark uses a Kubernetes cluster to scale up to a dozen of clients.
One server is configured to deploy pull- and push-based interfaces.
A gateway can be configured to add network impairment. 

Research question: *What is the cut-off point between HTTP polling and publish/subscribe (pubsub) interfaces for real-time Open Data?*

Note: Server-Sent-Events_manager (SSE) is tested for pubsub systems to use the same protocol (HTTP) as polling.

## Experiment 1

First, we want to test how many clients can be served with our server.
This server has 3.7 GB of memory and uses a Dual-Core AMD Opteron(tm) Processor 2212 with 2010.276 MHz.

Hypothesis: *Pubsub interfaces induce a linear amount of resources according to the amount of users.*

## Experiment 2

Hypothesis: *Pubsub interfaces have a constant total user latency according to the time between observations.*