# DigitalWardrobe

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.1.3.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Dashboard Loader Debug (Dev Only)

To force dashboard in-page loaders to remain visible for testing, set a minimum loader duration (in milliseconds) in browser `localStorage`:

```js
localStorage.setItem('dw-debug-dashboard-loader-ms', '1200');
```

Reload the dashboard page after setting it.

To disable this debug behavior:

```js
localStorage.removeItem('dw-debug-dashboard-loader-ms');
```

Notes:
- This is read only in Angular dev mode.
- It affects dashboard counters and category breakdown loader minimum duration.

## Image Storage Flow

The app now supports backend-managed image uploads to Firebase Storage:

- Frontend uploads cropped images to `POST /api/v1/media/images`.
- Backend stores image bytes in Firebase Storage and returns signed URLs + storage paths.
- Wardrobe/accessory records persist storage references (`imagePaths`, `primaryImagePath`) in MongoDB.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
