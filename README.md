# Lerida Frontend - Archive

React + TypeScript + Vite + TailwindCSS frontend intended to be built and embedded inside a Java backend application (for example, a Spring Boot service). This repository holds the SPA source. Build output (dist) should be copied or served by the Java app so the backend can serve the static frontend in production.

Key facts
- Framework: React (TypeScript)
- Bundler: Vite
- Styling: TailwindCSS
- Intended usage: Developed standalone during development; build output embedded into Java backend for production
- Languages: TypeScript (≈98%), HTML, other

Table of contents
- Features
- Prerequisites
- Local development
- Environment variables
- Building for production
- Embedding / deploying with a Java backend
  - Simple copy approach
  - Example: Gradle task
  - Example: Maven (frontend-maven-plugin + copy-resources)
  - Serving SPA routes from Spring Boot
- Previewing production build
- CI / Automation recommendations
- Troubleshooting
- Contributing
- License

Features
- Fast development with Vite HMR
- TypeScript-first codebase
- TailwindCSS for utility-first styling
- Small production bundle (Vite + modern build)

Prerequisites
- Node.js >= 16 (or the version pinned in project)
- npm or pnpm or yarn
- Java backend (e.g., Spring Boot) if embedding in a Java app
- Recommended: a separate repo or monorepo where the backend project is adjacent to this frontend

Local development
1. Install dependencies
   - npm
     npm install
   - or pnpm
     pnpm install

2. Start the dev server
   npm run dev

3. Open http://localhost:5173 (or as printed by Vite).

If your Java backend exposes APIs, configure the Vite dev server proxy (see vite.config.ts) to forward API requests to your backend during development (example below).

Example vite.config.ts (proxy)
```ts
// (example snippet — adjust host/port to your backend)
export default defineConfig({
  // ...
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
```

Environment variables
- Vite exposes env variables that start with `VITE_`. Use these for runtime configuration your frontend needs (API base URLs, feature flags).
- Common variables:
  - VITE_API_BASE - base URL for backend API requests during runtime (used by your app code)
  - VITE_BASE_PATH - base path the app is served from (if embedding under a subpath)

Example `.env`
```env
VITE_API_BASE=http://localhost:8080/api
VITE_BASE_PATH=/
```

Example `.env.production`
```env
VITE_API_BASE=https://api.example.com/api
VITE_BASE_PATH=/app/
```

Building for production
- Build the frontend:
  npm run build

- The production-ready static files will be emitted to the `dist/` directory by default.

Embedding / deploying with a Java backend
You can integrate the built static assets into your Java backend in a few ways.

Simple copy approach
1. Build frontend:
   npm run build
2. Copy files into your backend resources directory (Spring Boot example)
   cp -r dist/* ../backend/src/main/resources/static/

Place the contents of `dist` directly under `src/main/resources/static/` (default Spring Boot static location). If you need the app to be served under a subpath, either set the Vite build base or put the files in a different static location and configure Spring Boot accordingly.

Gradle example (task to build and copy)
```groovy
// Put in build.gradle (backend project)
task copyFrontend(type: Copy) {
    dependsOn ':lerida-frontend:build' // if frontend is included as a composite project
    from('../lerida-frontend/dist') {
        into ''
    }
    into "$buildDir/resources/main/static"
}

processResources.dependsOn(copyFrontend)
```

Maven example (recommended when using a separate frontend repo)
Use the frontend-maven-plugin to run npm and then the maven-resources-plugin to copy the dist output.

Example pom snippets:
```xml
<!-- run npm build -->
<plugin>
  <groupId>com.github.eirslett</groupId>
  <artifactId>frontend-maven-plugin</artifactId>
  <version>1.12.1</version>
  <executions>
    <execution>
      <id>install node and npm</id>
      <goals><goal>install-node-and-npm</goal></goals>
      <configuration>
        <nodeVersion>v18.16.0</nodeVersion>
        <npmVersion>9.6.0</npmVersion>
      </configuration>
    </execution>
    <execution>
      <id>npm install</id>
      <goals><goal>npm</goal></goals>
      <configuration><arguments>install</arguments></configuration>
    </execution>
    <execution>
      <id>npm build</id>
      <goals><goal>npm</goal></goals>
      <phase>generate-resources</phase>
      <configuration><arguments>run build</arguments></configuration>
    </execution>
  </executions>
</plugin>

<!-- copy dist into the packaged jar -->
<plugin>
  <artifactId>maven-resources-plugin</artifactId>
  <version>3.3.1</version>
  <executions>
    <execution>
      <id>copy-frontend</id>
      <phase>process-resources</phase>
      <goals><goal>copy-resources</goal></goals>
      <configuration>
        <outputDirectory>${project.build.outputDirectory}/static</outputDirectory>
        <resources>
          <resource>
            <directory>${project.basedir}/../lerida-frontend/dist</directory>
            <filtering>false</filtering>
          </resource>
        </resources>
      </configuration>
    </execution>
  </executions>
</plugin>
```

Serving SPA routes from Spring Boot
If your SPA uses client-side routing (React Router), configure your backend to fallback to `index.html` for unknown routes so direct links work.

Simple controller example:
```java
@Controller
public class SpaController {
    @RequestMapping(value = "/{path:[^\\.]*}")
    public String redirect() {
        return "forward:/index.html";
    }
}
```

Or configure WebMvcConfigurer to add fallback mapping.

Previewing production build
- After building, you can preview locally:
  npm run preview
- Or serve `dist` folder via a static file server (http-server, serve, or the Java backend).

CI / Automation recommendations
- Have CI run `npm ci` + `npm run build` and then copy artifacts into backend packaging step.
- Cache node_modules or pnpm store for faster builds.
- Use the frontend build output commit or artifact storage if your backend CI needs to fetch the assets separately.

Troubleshooting
- Assets 404 after embedding: check Vite `base` (VITE_BASE_PATH) and make sure paths match where the Java app serves the files.
- Client-side router 404s on reload: ensure backend returns index.html for non-API routes.
- Environment variables not applied: ensure you set the right .env files during build time (Vite replaces at build).

Contributing
- Use feature branches and open PRs.
- Linting and formatting are encouraged; run the included scripts before opening a PR.
- If integrating with a backend, add or update build-copy automation to keep integration smooth.

Scripts (package.json)
- npm run dev — start Vite dev server
- npm run build — build production assets into `dist/`
- npm run preview — preview production build locally
- npm run lint — run linter (if present)

Project layout (top-level)
- src/ — TypeScript/React source
- index.html — app entry
- tailwind.config.js — Tailwind config
- vite.config.ts — Vite config
- dist/ — generated by build (not committed)

License
- See LICENSE (if present). If none, add a license suitable for your project.

Contact
- Repository: https://github.com/acaree-dev/lerida-frontend
- For questions about embedding details (Maven/Gradle), include your backend build system and I can suggest exact snippets.

Thanks — build the frontend with `npm run build` and copy `dist` into your Java backend's static resources. If you'd like, I can also generate a sample Gradle or Maven configuration tailored to your backend repository layout.
