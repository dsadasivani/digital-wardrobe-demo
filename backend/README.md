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

## Starter endpoints

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`

## API documentation

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`
