# Blog App

A small blog application with a **Next.js** frontend and a **Spring Boot** REST API, in a blue and white design.
Visitors can read posts, registered users can comment, and admins can write posts and manage categories.

- **Frontend:** Next.js 16 (App Router, React 19) in [`frontend/`](frontend)
- **Backend:** Spring Boot 3.3, Spring Security + JWT, Spring Data JPA, Bean Validation, springdoc OpenAPI
- **Database:** embedded H2 by default (zero setup), MySQL via profiles or Docker Compose

```
Browser ──> Next.js (localhost:3000) ──/api/*──> Spring Boot (localhost:8080) ──> H2 / MySQL
```

The browser only talks to Next.js. Next.js proxies `/api/*` (and the Swagger pages) to Spring Boot,
so there is no CORS configuration to maintain.

---

## Quick start

Requirements: **JDK 17+** and **Node.js 20.9+**. Maven is not required, the Maven wrapper is included.

Open two terminals in the project root.

**Terminal 1 – backend** (http://localhost:8080)

```powershell
.\mvnw.cmd spring-boot:run        # Windows
./mvnw spring-boot:run             # macOS / Linux / Git Bash
```

**Terminal 2 – frontend** (http://localhost:3000)

```bash
cd frontend
npm install      # first time only
npm run dev
```

Then open **http://localhost:3000**.

| What            | URL                                         |
|-----------------|---------------------------------------------|
| Web UI          | http://localhost:3000                       |
| Swagger UI      | http://localhost:3000/swagger-ui/index.html (or :8080 directly) |
| REST API        | http://localhost:8080/api/v1                |

If the backend runs somewhere else, start the frontend with `BACKEND_URL`, e.g.
`$env:BACKEND_URL="http://localhost:9090"; npm run dev` (PowerShell) or `BACKEND_URL=http://localhost:9090 npm run dev` (bash).

For a production build of the frontend: `npm run build` then `npm start`.

### Default accounts

On startup the app creates an admin account if it does not exist yet:

| Username | Email            | Password   | Roles                  |
|----------|------------------|------------|------------------------|
| `admin`  | `admin@blog.com` | `admin123` | `ROLE_ADMIN`, `ROLE_USER` |

Override with the `ADMIN_USERNAME`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables. Anyone can sign up at `/signup`; new accounts get `ROLE_USER`.

With the default `local` profile the app also seeds two categories and three sample posts the first time it runs against an empty database.

---

## Using the UI

| Page | Path | Access |
|------|------|--------|
| Home – post list, category filter, sorting, paging | `/` | Everyone |
| Post with comments | `/posts/{id}` | Everyone (commenting needs login) |
| Log in | `/login` | Everyone |
| Sign up | `/signup` | Everyone |
| Write a post | `/posts/new` | Admin |
| Edit a post | `/posts/{id}/edit` | Admin |
| Manage categories | `/categories` | Admin |

| Who        | Can do |
|------------|--------|
| Everyone   | Browse posts, filter by category, sort (newest, oldest, title), page through posts, read a post and its comments |
| Logged in  | Everything above, plus post comments (name and email are pre-filled from the account) |
| Admin      | Everything above, plus write / edit / delete posts, add / rename / delete categories, edit / delete any comment |

Notes:
- Post content is plain text. Leave a blank line between paragraphs.
- Deleting a category also deletes all of its posts and their comments (the UI asks for confirmation).
- The login session is stored in the browser and expires together with the JWT (7 days by default).
  After login or sign up you are sent back to the page you came from.
- Sign up validates the same rules as the API (username 3–50 chars, valid email, password 6+ chars, matching confirmation) and logs you in straight away.

---

## Profiles and databases

The active profile is chosen with `SPRING_PROFILES_ACTIVE` (default: `local`).

| Profile            | Database                                    | Notes |
|--------------------|---------------------------------------------|-------|
| `local` (default)  | H2 file database in `./data/blogdb`         | No install needed. Data survives restarts. Delete the `data/` folder to reset. Seeds demo content. |
| `dev`, `qa`, `prod`| MySQL `jdbc:mysql://localhost:3306/myblog`  | Database is created automatically if missing. Override with `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`. |
| `docker`           | MySQL container `mysqldb` (`postsdb`)       | Used by `docker-compose.yml`. Seeds demo content. |

Run with MySQL locally:

```powershell
# PowerShell
$env:SPRING_PROFILES_ACTIVE="dev"; $env:DB_PASSWORD="your-password"; .\mvnw.cmd spring-boot:run
```

```bash
# bash
SPRING_PROFILES_ACTIVE=dev DB_PASSWORD=your-password ./mvnw spring-boot:run
```

### Docker Compose

The Dockerfile copies the pre-built jar, so build it first:

```bash
./mvnw clean package -DskipTests
docker compose up --build
```

The API waits for the MySQL health check before starting and is available on http://localhost:8080.
Compose only runs the backend and database; start the frontend with `cd frontend && npm run dev` as usual.

### Other configuration

| Property / env var | Default | Description |
|--------------------|---------|-------------|
| `JWT_SECRET`       | (dev key in `application.properties`) | Base64 HMAC key used to sign tokens. **Set your own outside of local development.** |
| `app-jwt-expiration-milliseconds` | `604800000` (7 days) | Token lifetime |
| `app.seed-demo-data` | `true` for `local`/`docker`, else `false` | Seed sample categories and posts when there are no posts |
| `server.port`      | `8080` | e.g. `./mvnw spring-boot:run -Dspring-boot.run.arguments=--server.port=9090` |

---

## REST API

Base path: `/api/v1`. Protected endpoints need the header `Authorization: Bearer <accessToken>`.

### Auth

| Method | Path | Access | Body |
|--------|------|--------|------|
| POST | `/auth/register` (alias `/auth/signup`) | Public | `{ "name", "username", "email", "password" }` |
| POST | `/auth/login` (alias `/auth/signin`) | Public | `{ "usernameOrEmail", "password" }` |

Login response:

```json
{
  "accessToken": "eyJhbGciOi...",
  "tokenType": "Bearer",
  "name": "Administrator",
  "username": "admin",
  "email": "admin@blog.com",
  "roles": ["ROLE_ADMIN", "ROLE_USER"]
}
```

### Posts

| Method | Path | Access |
|--------|------|--------|
| GET | `/posts?pageNo=0&pageSize=10&sortBy=id&sortDir=asc` | Public |
| GET | `/posts/{id}` | Public |
| GET | `/posts/category/{categoryId}` | Public |
| POST | `/posts` | Admin |
| PUT | `/posts/{id}` | Admin |
| DELETE | `/posts/{id}` | Admin |

- `sortBy` accepts `id`, `title`, `createdAt`, `updatedAt`. `pageSize` is capped at 100.
- Post body: `{ "title" (min 2), "description" (min 10), "content" (min 15), "categoryId" (required) }`.
- Responses include `categoryName`, `createdAt`, `updatedAt` and the post's `comments`.
- Titles are unique; a duplicate returns `409 Conflict`.
- The old path `GET /api/posts/v1/{id}` still works.

### Comments

| Method | Path | Access |
|--------|------|--------|
| GET | `/posts/{postId}/comments` | Public |
| GET | `/posts/{postId}/comments/{id}` | Public |
| POST | `/posts/{postId}/comments` | Logged in |
| PUT | `/posts/{postId}/comments/{id}` | Admin |
| DELETE | `/posts/{postId}/comments/{id}` | Admin |

Comment body: `{ "name", "email", "body" (min 10) }`.

### Categories

| Method | Path | Access |
|--------|------|--------|
| GET | `/category` | Public |
| GET | `/category/{id}` | Public |
| POST | `/category` | Admin |
| PUT | `/category/{id}` | Admin |
| DELETE | `/category/{id}` | Admin (also deletes the category's posts) |

Category body: `{ "name" (required, max 100), "description" }`. A trailing slash (`/category/`) is also accepted.

### Errors

| Status | When | Body |
|--------|------|------|
| 400 | Validation failed | `{ "field": "message", ... }` |
| 400 | Bad request (e.g. invalid sort field) | `{ "timeStamp", "message", "details" }` |
| 401 | Missing/invalid/expired token, or wrong login | same as above |
| 403 | Logged in but not allowed (e.g. a user creating a post) | same as above |
| 404 | Post, comment or category not found | same as above |
| 409 | Duplicate post title or other data conflict | same as above |

### Example with curl

```bash
# log in as admin and keep the token
TOKEN=$(curl -s -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"admin","password":"admin123"}' \
  http://localhost:8080/api/v1/auth/login | sed 's/.*"accessToken":"\([^"]*\)".*/\1/')

# create a post
curl -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Hello world","description":"My very first post","content":"Welcome to my new blog!","categoryId":1}' \
  http://localhost:8080/api/v1/posts
```

---

## Project structure

```
frontend/
├── app/                    Next.js App Router pages
│   ├── page.js             Home (post list)
│   ├── login/, signup/     Auth pages
│   ├── posts/[id]/         Post page, posts/[id]/edit, posts/new
│   ├── categories/         Category management
│   ├── layout.js           Header, footer, providers
│   └── globals.css         Blue and white theme
├── components/             AuthProvider, UiProvider (toasts/dialogs), Header, forms
├── lib/                    API client, session storage, formatting helpers
└── next.config.mjs         /api proxy to Spring Boot (BACKEND_URL)
src/main/java/com/springboot/blog
├── config/        SecurityConfig, DataInitializer (roles, admin user, demo data)
├── controller/    Auth, Post, Comment, Category REST controllers
├── dto/           Request / response objects with validation rules
├── entity/        JPA entities: Post, Comment, Category, User, Role
├── exception/     Custom exceptions + GlobalExceptionHandler
├── repository/    Spring Data JPA repositories
├── security/      JWT provider, filter and entry point
├── service/       Service interfaces and implementations
└── utils/         Constants
src/main/resources
└── application*.properties
```

---

## Changes in this version

### New
- **Next.js web UI** (blue and white, responsive): post list with category filter, sorting and paging, post page with comments, dedicated login and sign up pages, post editor and category management for admins.
- **Embedded H2 database** as the default `local` profile so the app runs without MySQL. MySQL profiles are unchanged apart from env var overrides.
- **Default admin account** and optional **demo content** created on startup.
- `createdAt` / `updatedAt` timestamps on posts and `createdAt` on comments.
- Login response now includes the user's name, username, email and roles.

### Fixes
- **Roles were inserted again on every startup.** After the second start `findByName("ROLE_USER")` found duplicates and registration failed. Seeding is now idempotent.
- **No way to get an admin.** Every account was `ROLE_USER`, so posts and categories could never be created. A default admin is now created.
- **`GET /api/posts/v1/{id}` required a login** because it was outside the public `GET /api/v1/**` rule. It now lives at `/api/v1/posts/{id}` (old path kept as an alias, and made public).
- **`GET /api/v1/category` returned 404** without a trailing slash (Spring 6 no longer matches trailing slashes). Both forms now work.
- **`categoryId` was always `null` in post responses** (ModelMapper STRICT does not flatten `category.id`). Now set explicitly, along with `categoryName`.
- **Post content and comment bodies were limited to 255 characters** (`VARCHAR(255)`). They are now `TEXT`.
- **Creating a comment with an `id` overwrote an existing comment** (and could move it to another post). Client ids are now ignored on create, same for posts and categories.
- **Invalid or expired JWTs caused a 500** because the filter threw an exception outside the controller advice, and also broke public GET requests. Bad tokens are now treated as anonymous. Tokens of deleted users are handled the same way.
- **Wrong login returned 500**; now `401` with a clear message.
- **Missing role returned 401**; now `403 Forbidden`.
- `BlogApiException` always returned 400; it now uses the status it was created with.
- Duplicate post titles returned a raw SQL error with 500; now `409 Conflict`.
- Invalid `sortBy` values returned 500; now `400` with the allowed values.
- Registration, login and category requests were not validated; they now are.
- Any logged-in user could edit or delete any comment; this is now admin only.
- `docker-compose.yml`: the app now waits for MySQL to be healthy, sets the `docker` profile explicitly and pins the MySQL image to `8.4`.

- The long "CONDITION EVALUATION DELTA" report that devtools printed on every restart is switched off (`spring.devtools.restart.log-condition-evaluation-delta=false`). It was informational, not an error.

### Upgrading an existing MySQL database
`ddl-auto=update` adds the new timestamp columns automatically, but it does **not** change existing column types. To allow long posts and comments on an existing MySQL database run once:

```sql
ALTER TABLE posts MODIFY content TEXT NOT NULL;
ALTER TABLE posts MODIFY description VARCHAR(1000) NOT NULL;
ALTER TABLE comments MODIFY body TEXT;
```

If the `role` table already has duplicate rows from earlier runs, keep one row per name:

```sql
DELETE r1 FROM role r1 JOIN role r2 ON r1.name = r2.name AND r1.id > r2.id;
```

(Check `users_roles` first if users already reference the duplicate rows.)
