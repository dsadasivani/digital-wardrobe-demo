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

4. Verify OpenAPI endpoint:

```bash
curl http://localhost:8080/v3/api-docs
```

Note: this app currently uses one active JWT signing secret, so rotating `JWT_SECRET` invalidates existing tokens and users must log in again.

## Environment variables

- `MONGODB_URI` (default: `mongodb://localhost:27017/digital_wardrobe`)
- `JWT_SECRET` (required, at least 32 characters)
- `JWT_EXPIRATION_SECONDS` (default: `86400`)
- `CORS_ALLOWED_ORIGINS` (default: `http://localhost:4200`)
- `DEFAULT_ADMIN_ENABLED` (default: `false`)
- `DEFAULT_ADMIN_EMAIL` (required when bootstrap enabled)
- `DEFAULT_ADMIN_NAME` (required when bootstrap enabled)
- `DEFAULT_ADMIN_PASSWORD` (required when bootstrap enabled, min 12 chars)
- `SPRINGDOC_API_DOCS_ENABLED` (default: `true`)
- `SPRINGDOC_SWAGGER_UI_ENABLED` (default: `true`)
- `MULTIPART_MAX_FILE_SIZE` (default: `12MB`)
- `MULTIPART_MAX_REQUEST_SIZE` (default: `50MB`)
- `FIREBASE_STORAGE_ENABLED` (default: `false`)
- `FIREBASE_STORAGE_BUCKET` (required when Firebase storage is enabled)
- `FIREBASE_PROJECT_ID` (optional but recommended)
- `FIREBASE_CREDENTIALS_FILE` (path to service account JSON)
- `FIREBASE_CREDENTIALS_JSON` (raw service account JSON string)
- `FIREBASE_CREDENTIALS_JSON_BASE64` (base64-encoded service account JSON)
- `FIREBASE_STORAGE_ROOT_PATH` (default: `users`)
- `FIREBASE_SIGNED_URL_TTL` (default: `24h`)
- `FIREBASE_SIGNED_URL_CACHE_ENABLED` (default: `true`)
- `FIREBASE_SIGNED_URL_CACHE_MAXIMUM_SIZE` (default: `10000`)
- `FIREBASE_SIGNED_URL_CACHE_REFRESH_BEFORE_EXPIRY` (default: `5m`)
- `FIREBASE_THUMBNAILS_ENABLED` (default: `true`)
- `FIREBASE_THUMBNAIL_MAX_WIDTH` (default: `480`)

## Starter endpoints

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- `POST /api/v1/media/images` (multipart upload, authenticated, returns `{ path, url, ... }` for Firebase-backed images)
- `POST /api/v1/media/images/thumbnails/backfill` (authenticated, idempotent thumbnail backfill for the current user's existing image paths)
- `POST /api/v1/media/images/thumbnails/backfill/admin` (authenticated, `ROLE_ADMIN` required, batch backfill with cursor + dry-run support)

Image payload behavior:
- `GET /api/v1/wardrobe-items` and `GET /api/v1/wardrobe-items/page` return preview gallery image data (`imageUrls` includes up to 4 images, primary first) plus total `imageCount`.
- `GET /api/v1/accessories` and `GET /api/v1/accessories/page` return preview gallery image data (`imageUrls` includes up to 4 images, primary first) plus total `imageCount`.
- When thumbnail support is enabled, list/summary responses prefer signed thumbnail URLs and automatically fall back to original image URLs if a thumbnail is unavailable.
- Detail endpoints (`GET /api/v1/wardrobe-items/{id}`, `GET /api/v1/accessories/{id}`) return full image galleries.

Thumbnail backfill response fields:
- `wardrobeItemsScanned`, `accessoriesScanned`, `uniqueSourcePaths`
- `thumbnailsCreated`, `thumbnailsAlreadyPresent`
- `skippedNotEligible` (small/non-decodable images), `skippedMissingSource`, `failed`

Admin thumbnail backfill request body (all fields optional):
- `batchSize` (default `25`, max `200`)
- `maxUsers` (default `batchSize`, max `1000`)
- `cursor` (last processed user id from previous response; empty for first batch)
- `dryRun` (`true` to simulate without writes)

Admin thumbnail backfill response fields:
- `dryRun`, `processedUsers`, `nextCursor`, `hasMore`
- `wardrobeItemsScanned`, `accessoriesScanned`, `uniqueSourcePaths`
- `thumbnailsCreated`, `thumbnailsWouldCreate`, `thumbnailsAlreadyPresent`
- `skippedNotEligible`, `skippedMissingSource`, `failed`

Admin batch runner script (PowerShell):
- Path: `backend/scripts/run-thumbnail-backfill.ps1`
- It keeps calling the admin endpoint using `nextCursor` until `hasMore=false` (or guard limits are hit).

Examples:
```powershell
# Dry run over all users (uses ADMIN_JWT env var)
.\scripts\run-thumbnail-backfill.ps1 -DryRun

# Real run with explicit token and batch sizing
.\scripts\run-thumbnail-backfill.ps1 -Token "<ADMIN_JWT>" -BatchSize 50

# Resume from a cursor and cap to 10 batches for controlled rollout
.\scripts\run-thumbnail-backfill.ps1 -Token "<ADMIN_JWT>" -Cursor "<LAST_CURSOR>" -MaxBatches 10
```

Windows Command Prompt (`cmd`) equivalents:
```cmd
:: Run from backend folder
:: c:\dilip\repos\digital-wardrobe-demo\backend

:: Dry run over all users (uses ADMIN_JWT env var)
set "ADMIN_JWT=<ADMIN_JWT>"
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\run-thumbnail-backfill.ps1" -DryRun

:: Real run with explicit token and batch sizing
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\run-thumbnail-backfill.ps1" -Token "<ADMIN_JWT>" -BatchSize 50

:: Resume from a cursor and cap to 10 batches for controlled rollout
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\run-thumbnail-backfill.ps1" -Token "<ADMIN_JWT>" -Cursor "<LAST_CURSOR>" -MaxBatches 10
```

## API documentation

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`
