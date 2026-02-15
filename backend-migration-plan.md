# Backend Integration Plan (Angular + Signals)

This document maps the current frontend to a backend-ready architecture with minimal UI churn.

## 1) Current Baseline

- App shell and routes are in:
  - `src/app/app.ts`
  - `src/app/app.config.ts`
  - `src/app/app.routes.ts`
- Domain models are in:
  - `src/app/core/models/index.ts`
- Mock seed data is in:
  - `src/app/core/mock-data/index.ts`
- State and CRUD are currently in-memory + `sessionStorage`:
  - `src/app/core/services/wardrobe.service.ts`
  - `src/app/core/services/auth.service.ts`

## 2) Target Architecture

Keep UI components mostly unchanged. Introduce a data-access layer and mapper layer.

```txt
src/app/core/
  api/
    auth.api.ts
    wardrobe.api.ts
    accessories.api.ts
    outfits.api.ts
  dto/
    auth.dto.ts
    wardrobe.dto.ts
    accessories.dto.ts
    outfits.dto.ts
  mappers/
    auth.mapper.ts
    wardrobe.mapper.ts
    accessories.mapper.ts
    outfits.mapper.ts
  services/
    auth.service.ts
    wardrobe.service.ts
```

## 3) Backend Contract Shape

Suggested resources:

- `POST /auth/login`
- `POST /auth/signup`
- `POST /auth/logout`
- `GET /users/me`
- `PATCH /users/me`

- `GET /wardrobe-items`
- `GET /wardrobe-items/:id`
- `POST /wardrobe-items`
- `PATCH /wardrobe-items/:id`
- `DELETE /wardrobe-items/:id`

- `GET /accessories`
- `GET /accessories/:id`
- `POST /accessories`
- `PATCH /accessories/:id`
- `DELETE /accessories/:id`

- `GET /outfits`
- `GET /outfits/:id`
- `POST /outfits`
- `PATCH /outfits/:id`
- `DELETE /outfits/:id`

Optional:

- `GET /dashboard/stats`
- `GET /outfits/calendar?month=YYYY-MM`

## 4) DTO Strategy

Keep UI models unchanged for now (`core/models/index.ts`).
Use DTO files for API shape and map DTOs to UI models in mapper files.

Example rule:

- API date fields as ISO string
- UI model date fields as `Date`

## 5) Service Refactor Pattern

Your AGENTS rules prefer `httpResource` for HttpClient calls in Angular 19.2+.

Pattern:

1. `*.api.ts`: raw HTTP calls and endpoint paths
2. `*.mapper.ts`: DTO <-> model conversion
3. `*.service.ts`: signal state, resource coordination, mutation methods

Use `resource/httpResource` for fetch flows and explicit action methods for create/update/delete.

## 6) Migration Phases

### Phase 1: Infrastructure

- Add API, DTO, mapper folders/files.
- Add environment API base URL.
- Add auth interceptor (token attach + 401 handling).

### Phase 2: Auth

- Replace mock login/signup/logout in `auth.service.ts`.
- Hydrate current user from `/users/me`.
- Keep current signal API to avoid component rewrites.

### Phase 3: Wardrobe + Accessories

- Replace in-memory read/mutate methods with backend calls.
- Keep computed signals for derived UI state (`dashboardStats`, filters, counts).
- Persist only auth/session metadata locally; avoid persisting full datasets.

### Phase 4: Outfits + Calendar

- Move outfit CRUD to backend.
- Support `plannedDates` server-side.
- Add date-range query endpoints if calendar load gets heavy.

### Phase 5: Hardening

- Error handling model (API errors to user-facing toasts/inline errors).
- Optimistic update policy (where needed).
- Retry/timeout policy for network failures.
- E2E test coverage for core CRUD flows.

## 7) Compatibility Notes

- Existing component contracts can remain stable if service method names stay the same.
- Keep route structure unchanged (`app.routes.ts`) to avoid navigation regressions.
- If backend IDs differ, map once in mapper layer and hide differences from components.

## 8) First Concrete Tasks (Next Sprint)

1. Add `core/api/auth.api.ts` + `core/dto/auth.dto.ts` + `core/mappers/auth.mapper.ts`.
2. Refactor `core/services/auth.service.ts` to backend auth.
3. Add `core/api/wardrobe.api.ts` + corresponding DTO/mapper.
4. Refactor read flows in `wardrobe.service.ts` first, then mutations.
5. Remove dependency on `core/mock-data/index.ts` when parity is complete.

## 9) Suggested Definition of Done

- No feature uses mock arrays for source-of-truth data.
- Refreshing browser preserves auth and loads data from backend.
- Wardrobe/accessories/outfits CRUD works end-to-end.
- Calendar reads real `plannedDates`.
- Build passes with no functional regressions.

## 10) Spring Boot 4 + MongoDB Blueprint

Use this as the initial backend implementation contract.

### 10.1 Tech Stack

- Java 21+
- Spring Boot 4.x
- Spring Web + Spring Validation
- Spring Security + JWT
- Spring Data MongoDB
- springdoc-openapi (Swagger)

### 10.2 Package Structure (Feature-first)

```txt
src/main/java/com/digitalwardrobe
  common/
    api/ApiError.java
    api/GlobalExceptionHandler.java
    security/JwtService.java
    security/JwtAuthenticationFilter.java
    security/SecurityConfig.java
  auth/
    api/AuthController.java
    dto/LoginRequest.java
    dto/SignupRequest.java
    dto/AuthResponse.java
    service/AuthService.java
  users/
    api/UserController.java
    dto/UpdateUserRequest.java
    dto/UserResponse.java
    domain/UserDocument.java
    repository/UserRepository.java
    service/UserService.java
  wardrobe/
    api/WardrobeController.java
    dto/WardrobeItemRequest.java
    dto/WardrobeItemResponse.java
    domain/WardrobeItemDocument.java
    repository/WardrobeItemRepository.java
    service/WardrobeService.java
  accessories/
    api/AccessoriesController.java
    dto/AccessoryRequest.java
    dto/AccessoryResponse.java
    domain/AccessoryDocument.java
    repository/AccessoryRepository.java
    service/AccessoryService.java
  outfits/
    api/OutfitController.java
    dto/OutfitRequest.java
    dto/OutfitResponse.java
    domain/OutfitDocument.java
    repository/OutfitRepository.java
    service/OutfitService.java
```

### 10.3 API Prefix and Versioning

- Prefix all endpoints with `/api/v1`.
- Example: `POST /api/v1/auth/login`.

### 10.4 MongoDB Collections

- `users`
- `wardrobe_items`
- `accessories`
- `outfits`

All domain collections must include `userId` for data isolation.

### 10.5 Index Plan

Create these indexes up front:

- `users`: unique `{ email: 1 }`
- `wardrobe_items`: `{ userId: 1, category: 1 }`, `{ userId: 1, favorite: 1 }`, `{ userId: 1, createdAt: -1 }`
- `accessories`: `{ userId: 1, category: 1 }`, `{ userId: 1, favorite: 1 }`
- `outfits`: `{ userId: 1, plannedDates: 1 }`, `{ userId: 1, createdAt: -1 }`

### 10.6 ID and Date Rules

- Persist Mongo `_id` as `ObjectId`.
- Return all IDs as `string` in response DTOs.
- Persist dates as `Instant` (UTC).
- Return dates as ISO strings in JSON.
- Frontend mapper converts ISO strings to `Date`.

### 10.7 Auth Model

- JWT bearer token auth.
- Token contains `sub` (userId), `email`, roles.
- Endpoints:
  - `POST /api/v1/auth/signup`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/logout` (stateless no-op or token blacklist if required)
  - `GET /api/v1/users/me`
  - `PATCH /api/v1/users/me`

### 10.8 Error Envelope

Use a single response shape for all errors:

```json
{
  "timestamp": "2026-02-12T12:00:00Z",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "path": "/api/v1/wardrobe-items",
  "fieldErrors": [
    { "field": "name", "message": "must not be blank" }
  ]
}
```

### 10.9 Initial Request/Response Contracts

Keep contract names aligned to frontend models.

`POST /api/v1/auth/login`

```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

```json
{
  "token": "jwt",
  "user": {
    "id": "67b...",
    "name": "User",
    "email": "user@example.com",
    "avatar": null,
    "preferences": {
      "favoriteColors": [],
      "stylePreferences": [],
      "location": null,
      "notificationsEnabled": true,
      "darkMode": false
    },
    "createdAt": "2026-02-12T10:00:00Z"
  }
}
```

`POST /api/v1/wardrobe-items`

```json
{
  "name": "Black Blazer",
  "category": "outerwear",
  "color": "Black",
  "colorHex": "#000000",
  "size": "M",
  "brand": "Zara",
  "price": 129.99,
  "purchaseDate": "2026-01-10T00:00:00Z",
  "imageUrl": "https://...",
  "favorite": false,
  "tags": ["formal"],
  "notes": "Slim fit"
}
```

```json
{
  "id": "67c...",
  "name": "Black Blazer",
  "category": "outerwear",
  "color": "Black",
  "colorHex": "#000000",
  "size": "M",
  "brand": "Zara",
  "price": 129.99,
  "purchaseDate": "2026-01-10T00:00:00Z",
  "imageUrl": "https://...",
  "worn": 0,
  "lastWorn": null,
  "favorite": false,
  "tags": ["formal"],
  "notes": "Slim fit",
  "createdAt": "2026-02-12T10:30:00Z"
}
```

`POST /api/v1/outfits`

```json
{
  "name": "Work Monday",
  "items": [
    {
      "itemId": "67c...",
      "type": "wardrobe",
      "positionX": 12,
      "positionY": 22,
      "scale": 1,
      "rotation": 0,
      "zIndex": 1
    }
  ],
  "occasion": "office",
  "season": "all",
  "rating": 5,
  "favorite": true,
  "notes": "Board meeting",
  "imageUrl": null,
  "plannedDates": ["2026-02-16"]
}
```

### 10.10 Frontend Integration Mapping

- Keep Angular service method names unchanged to avoid component churn.
- Replace mock source in services with API adapters:
  - `auth.api.ts`
  - `wardrobe.api.ts`
  - `accessories.api.ts`
  - `outfits.api.ts`
- Keep DTO-to-model mapping in `core/mappers`.

### 10.11 Execution Plan (Backend + Frontend)

1. Stand up backend skeleton with auth + `/users/me`.
2. Integrate frontend auth service and interceptor.
3. Implement wardrobe/accessory read endpoints and integrate read flows.
4. Add wardrobe/accessory mutations.
5. Add outfits + calendar-oriented queries.
6. Remove mock-data dependency and lock e2e regression tests.
