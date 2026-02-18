# Digital Wardrobe Observability

This folder is intentionally decoupled from app code and can be moved to its own repository (`digital-wardrobe-observability`).

## What is here

- `docker-compose.yml`: Prometheus + Grafana stack
- `prometheus/prometheus.yml`: scrape config
- `prometheus/prometheus.render.yml`: Render scrape config
- `prometheus/rules/api-slo-alerts.yml`: warning/critical SLO alert rules
- `grafana/provisioning/*`: auto-provisioned datasource and dashboards
- `grafana/dashboards/digital-wardrobe-api-slo.json`: API SLO dashboard
- `prometheus/Dockerfile` + `grafana/Dockerfile`: container images for Render deploy
- `observability-baseline.md`: SLI/SLO baseline contract

## Backend requirements

The backend must expose:

- `GET /actuator/prometheus`

For local development, set:

- `SPRING_PROFILES_ACTIVE=observability`
- `ACTUATOR_PUBLIC_ENDPOINTS=/actuator/health,/actuator/info,/actuator/metrics,/actuator/prometheus`

## Run locally

From `observability/`:

```bash
docker compose up -d
```

Open:

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000`

Default Grafana credentials:

- user: `admin`
- password: `admin`

## Deploy on Render

This repository includes `render.yaml` at project root to deploy:

- `prometheus` (private service)
- `grafana` (web service)

Steps:

1. Push repository changes.
2. In Render, create a new **Blueprint** and select this repository.
3. Set required secret env vars in Render:
   - `GF_SECURITY_ADMIN_PASSWORD`
4. Deploy blueprint.

Notes:

- Local config (`prometheus/prometheus.yml`) scrapes `host.docker.internal:8080`.
- Render config (`prometheus/prometheus.render.yml`) scrapes `https://digital-wardrobe-backend-beta-1-0-0.onrender.com/actuator/prometheus`.
- Ensure your backend service exposes `/actuator/prometheus` publicly.

## Alert rules

Prometheus alert rules are loaded from `prometheus/rules/*.yml`.

Implemented warning/critical thresholds:

- Read API p95 latency > 250ms for 10m (`warning`)
- Read API p95 latency > 500ms for 10m (`critical`)
- API 5xx rate > 0.5% for 5m (`warning`)
- API 5xx rate > 2% for 5m (`critical`)

After changing rules:

1. Validate config:
```bash
docker compose exec prometheus promtool check config /etc/prometheus/prometheus.yml
docker compose exec prometheus promtool check rules /etc/prometheus/rules/api-slo-alerts.yml
```
2. Reload Prometheus:
```bash
curl -X POST http://localhost:9090/-/reload
```
3. Verify:
- Prometheus UI: `http://localhost:9090/alerts`
- Grafana panel: `Active SLO Alerts (Firing)` on the API SLO dashboard

## Notes

- Prometheus scrapes `host.docker.internal:8080`, so backend should be reachable on host port `8080`.
- To use a different backend port/host, edit `prometheus/prometheus.yml` and restart Prometheus.
- If backend runs without `observability` profile, `/actuator/prometheus` will not be exposed.
