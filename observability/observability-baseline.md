# Observability Baseline and SLOs

This document defines the first performance baseline for the backend and the SLO targets we will track before making optimization changes.

## Scope

- APIs under `/api/v1/**`
- Auth endpoints under `/api/v1/auth/**`
- Platform endpoints under `/actuator/**` for health and telemetry only

## Service Level Indicators (SLIs)

1. Latency
- Metric: `http.server.requests` (Actuator) / `http_server_requests_seconds_*` (Prometheus)
- Dimensions: `uri`, `method`, `status`, `outcome`

2. Availability
- Metric: `http.server.requests`
- Formula: `1 - (5xx responses / total responses)` over the SLO window

3. Error Rate
- Metric: `http.server.requests`
- Formula: `5xx responses / total responses`

4. Saturation (supporting signal)
- Metrics: `jvm.memory.used`, `jvm.threads.live`, `system.cpu.usage`, container CPU/memory

## Initial SLO Targets

These are the starting targets for the next iteration and should be reviewed after we collect 2 weeks of traffic baseline.

1. Read API latency
- p95 < 250 ms
- p99 < 600 ms
- Endpoints: `GET /api/v1/wardrobe-items`, `GET /api/v1/accessories`, `GET /api/v1/outfits`, detail `GET` endpoints

2. Write API latency
- p95 < 400 ms
- p99 < 900 ms
- Endpoints: `POST`, `PATCH`, `DELETE`, `mark-worn`

3. Availability
- >= 99.9% monthly for `/api/v1/**`

4. Server-side error rate
- < 0.5% over 5 minutes
- < 0.1% daily

## Alert Thresholds (Initial)

1. High latency (warning)
- Condition: read API p95 > 250 ms for 10 minutes

2. High latency (critical)
- Condition: read API p95 > 500 ms for 10 minutes

3. Elevated server errors (warning)
- Condition: 5xx error rate > 0.5% for 5 minutes

4. Elevated server errors (critical)
- Condition: 5xx error rate > 2% for 5 minutes

Current implementation:

- Prometheus rules file: `prometheus/rules/api-slo-alerts.yml`

## Baseline Capture Runbook

1. Deploy with actuator metrics and Prometheus endpoint enabled.
2. Collect at least 14 days of production-like traffic.
3. Capture baseline for:
- p50/p90/p95/p99 per endpoint group
- request rate (RPS)
- payload sizes for list endpoints
- error breakdown by endpoint and status
4. Freeze current numbers in this document as `Baseline v1`.
5. Every optimization phase (image pipeline, cache layer, pagination) must include:
- before vs after latency comparison
- error-rate impact
- infra cost impact (CPU/memory/network)

## Suggested PromQL Starters

1. Read p95 latency
```promql
histogram_quantile(0.95, sum(rate(http_server_requests_seconds_bucket{uri=~"/api/v1/(wardrobe-items|accessories|outfits).*",method="GET"}[5m])) by (le, uri))
```

2. Write p95 latency
```promql
histogram_quantile(0.95, sum(rate(http_server_requests_seconds_bucket{uri=~"/api/v1/.*",method=~"POST|PATCH|DELETE"}[5m])) by (le, uri))
```

3. 5xx error rate
```promql
sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m])) / sum(rate(http_server_requests_seconds_count[5m]))
```
