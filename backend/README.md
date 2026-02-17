# Digital Wardrobe Backend

Spring Boot 4 + MongoDB backend skeleton for the Digital Wardrobe app.

## Prerequisites

- Java 21+
- Maven 3.9+
- MongoDB running locally or a `MONGODB_URI`

## Run

```bash
mvn spring-boot:run
```

From this folder (`backend/`), the API runs on `http://localhost:8080`.

## Docker

### Build image

```bash
docker build -t digital-wardrobe-backend .
```

### Run backend container

```bash
docker run --rm -p 8080:8080 -e MONGODB_URI='mongodb+srv://username:password@cluster-url/digital_wardrobe?retryWrites=true&w=majority' -e JWT_SECRET=replace-with-a-long-random-secret-at-least-32-chars digital-wardrobe-backend
```

### Run backend with Compose (cloud MongoDB)

```bash
# macOS/Linux
cp .env.example .env

# PowerShell
Copy-Item .env.example .env

docker compose up --build
```

The compose setup runs:
- API at `http://localhost:8080`

Compose reads overrides from `.env` (see `.env.example`). Set `MONGODB_URI` in `.env` to your cloud MongoDB connection string.

## JWT secret manual guide

### 1. Generate a strong secret

Use one of these commands to generate a random 32-byte (64 hex chars) secret.

```bash
# OpenSSL (macOS/Linux/Git Bash)
openssl rand -hex 32
```

```powershell
# PowerShell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
($bytes | ForEach-Object { $_.ToString("x2") }) -join ''
```

### 2. Set the secret

Put the generated value in `JWT_SECRET` inside your runtime env source (`.env` for local/dev, secret manager in production).

### 3. Rotate the secret manually

1. Generate a new secret using step 1.
2. Replace `JWT_SECRET` in your runtime env source.
3. Restart backend container:

```bash
docker compose up -d --force-recreate backend
```

4. Verify health endpoint:

```bash
curl http://localhost:8080/actuator/health
```

Note: this app currently uses one active JWT signing secret, so rotating `JWT_SECRET` invalidates existing tokens and users must log in again.

## Environment variables

- `MONGODB_URI` (default: `mongodb://localhost:27017/digital_wardrobe`)
- `SPRING_PROFILES_ACTIVE` (set to `observability` to enable advanced telemetry profile)
- `JWT_SECRET` (required, at least 32 characters)
- `JWT_EXPIRATION_SECONDS` (default: `86400`)
- `CORS_ALLOWED_ORIGINS` (default: `http://localhost:4200`)
- `DEFAULT_ADMIN_ENABLED` (default: `false`)
- `DEFAULT_ADMIN_EMAIL` (required when bootstrap enabled)
- `DEFAULT_ADMIN_NAME` (required when bootstrap enabled)
- `DEFAULT_ADMIN_PASSWORD` (required when bootstrap enabled, min 12 chars)
- `SPRINGDOC_API_DOCS_ENABLED` (default: `true`)
- `SPRINGDOC_SWAGGER_UI_ENABLED` (default: `true`)
- `ACTUATOR_PUBLIC_ENDPOINTS` (default: `/actuator/health,/actuator/info`)

When `SPRING_PROFILES_ACTIVE=observability`, these optional vars are used:

- `APP_ENV` (default: `dev`, used as metrics tag)
- `MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE` (default: `health,info,metrics,prometheus`)
- `MANAGEMENT_ENDPOINT_METRICS_ENABLED` (default: `true`)
- `MANAGEMENT_ENDPOINT_PROMETHEUS_ENABLED` (default: `true`)
- `MANAGEMENT_PROMETHEUS_METRICS_EXPORT_ENABLED` (default: `true`)
- `ACTUATOR_PUBLIC_ENDPOINTS` can be widened to include `/actuator/metrics,/actuator/prometheus`

## Starter endpoints

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`

## API documentation

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## Observability stack

Monitoring assets are maintained separately in `../observability` (or an external `digital-wardrobe-observability` repository).

Advanced telemetry tuning for p95/p99 histograms is in `backend/src/main/resources/application-observability.yml` and is activated only when the `observability` profile is enabled.
