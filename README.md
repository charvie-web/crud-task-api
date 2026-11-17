# FlyRank A4 - Authentication API

A REST API built using Node.js, Express, Supabase Authentication and JWT for secure user authentication and protected routes. The project also retains the original SQLite-based Task CRUD API.

## Features

- User registration (Signup)
- User login
- JWT access and refresh tokens
- Protected routes using Bearer token authentication
- Reusable authentication middleware
- User logout and token revocation
- Public API endpoint
- Protected user profile
- Protected dashboard
- SQLite Task CRUD operations
- Interactive Swagger UI documentation

## Technologies

- Node.js
- Express.js
- Supabase Authentication
- JSON Web Tokens (JWT)
- SQLite
- better-sqlite3
- Swagger UI Express
- dotenv

## Project Setup

Clone the repository:

```bash
git clone https://github.com/charvie-web/crud-task-api.git
cd crud-task-api
```

Install dependencies:

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_publishable_key
PORT=3000
```

Replace the placeholder values with your own Supabase Project URL and publishable key.

Never commit the `.env` file or expose secret API keys.

## Run the Server

```bash
npm start
```

The server runs on port 3000 by default.

## API Documentation

Open Swagger UI at:

```text
http://localhost:3000/docs
```

Swagger provides an interactive interface to explore and test the API endpoints.

## Authentication Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /auth/signup | Register a new user |
| POST | /auth/login | Authenticate a user and receive tokens |
| POST | /auth/logout | Log out an authenticated user |
| GET | /public/info | Access public information |
| GET | /protected/profile | Retrieve authenticated user profile |
| GET | /protected/dashboard | Access protected dashboard |

## Task CRUD Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /tasks | Retrieve all tasks |
| GET | /tasks/:id | Retrieve a task |
| POST | /tasks | Create a task |
| PUT | /tasks/:id | Update a task |
| DELETE | /tasks/:id | Delete a task |

## Testing Authentication

1. Register a user using POST /auth/signup.
2. Log in using POST /auth/login.
3. Copy the access_token from the login response.
4. Click Authorize in Swagger UI and provide the Bearer token.
5. Access /protected/profile and /protected/dashboard.
6. Call POST /auth/logout to revoke the session.
7. Verify that the revoked token can no longer access protected routes.

## Authentication Middleware

The reusable `authenticateToken` middleware:

- Reads the Bearer token from the Authorization header.
- Verifies the token with Supabase Auth.
- Attaches the authenticated user to the request.
- Rejects missing, invalid or expired tokens with HTTP 401.

## Expected HTTP Status Codes

| Status | Meaning |
|---|---|
| 200 | Successful request |
| 201 | User or task created |
| 204 | Logout or deletion successful |
| 400 | Invalid input |
| 401 | Missing, invalid or expired token |
| 404 | Resource not found |
| 500 | Internal server error |

## Security

- Environment variables are stored in `.env`.
- `.env` is excluded through `.gitignore`.
- Supabase handles user authentication and JWT verification.
- Protected routes require a valid Bearer token.

## Author

Charvi Jain

GitHub: https://github.com/charvie-web
