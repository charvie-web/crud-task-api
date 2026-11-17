
require("dotenv").config();

const express = require("express");
const swaggerUi = require("swagger-ui-express");
const { createClient } = require("@supabase/supabase-js");
const db = require("./db");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

// Swagger documentation
const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "FlyRank Auth API",
    version: "2.0.0",
    description: "Secure API using Supabase Authentication and JWT"
  },
servers: [
  { url: "/" }
],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },
  paths: {
    "/auth/signup": {
      post: {
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "201": { description: "User created" },
          "400": { description: "Missing input" }
        }
      }
    },
    "/auth/login": {
      post: {
        summary: "Log in and receive JWT tokens",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string" },
                  password: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Login successful" },
          "400": { description: "Missing input" },
          "401": { description: "Invalid credentials" }
        }
      }
    },
    "/auth/logout": {
      post: {
        summary: "Log out",
        security: [{ BearerAuth: [] }],
        responses: {
          "204": { description: "Logout successful" },
          "401": { description: "Unauthorized" }
        }
      }
    },
    "/public/info": {
      get: {
        summary: "Public information",
        responses: {
          "200": { description: "Public information returned" }
        }
      }
    },
    "/protected/profile": {
      get: {
        summary: "Get authenticated user profile",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "User profile" },
          "401": { description: "Invalid or missing token" }
        }
      }
    },
    "/protected/dashboard": {
      get: {
        summary: "Protected dashboard",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "Dashboard accessed" },
          "401": { description: "Unauthorized" }
        }
      }
    }
  }
};

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Basic routes
app.get("/", (req, res) => {
  res.json({ message: "Hello from my FlyRank Auth API!" });
});

app.get("/api", (req, res) => {
  res.json({
    name: "FlyRank Auth API",
    version: "2.0",
    endpoints: [
      "/auth/signup",
      "/auth/login",
      "/auth/logout",
      "/public/info",
      "/protected/profile",
      "/protected/dashboard"
    ]
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// STAGE 1: SIGNUP
app.post("/auth/signup", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({
      message: "User registered successfully",
      user: data.user
    });
  } catch (error) {
    return res.status(500).json({ error: "Signup failed" });
  }
});

// STAGE 1: LOGIN
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      return res.status(401).json({
        error: "Invalid login credentials"
      });
    }

    return res.status(200).json({
      message: "Login successful",
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      token_type: data.session.token_type,
      user: data.user
    });
  } catch (error) {
    return res.status(500).json({ error: "Login failed" });
  }
});

// PUBLIC ROUTE
app.get("/public/info", (req, res) => {
  res.status(200).json({
    message: "Welcome stranger! This info is public."
  });
});

// STAGE 3 & 4: REUSABLE AUTH MIDDLEWARE
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !/^Bearer\s+\S+$/i.test(authHeader)) {
      return res.status(401).json({
        error: "Access token required"
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, "");

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        error: "Invalid or expired token"
      });
    }

    req.user = data.user;
    req.accessToken = token;

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired token"
    });
  }
}

// STAGE 3: PROTECTED PROFILE
app.get("/protected/profile", authenticateToken, (req, res) => {
  res.status(200).json({
    message: "Authenticated profile",
    user: {
      id: req.user.id,
      email: req.user.email,
      created_at: req.user.created_at
    }
  });
});

// EXTRA PROTECTED ROUTE
app.get("/protected/dashboard", authenticateToken, (req, res) => {
  res.status(200).json({
    message: "Welcome to your protected dashboard!",
    user_id: req.user.id
  });
});

// STAGE 4: LOGOUT
app.post("/auth/logout", authenticateToken, async (req, res) => {
  try {
    const response = await fetch(
      `${SUPABASE_URL.replace(/\/$/, "")}/auth/v1/logout`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${req.accessToken}`
        }
      }
    );

    if (!response.ok) {
      return res.status(401).json({
        error: "Logout failed"
      });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({
      error: "Logout failed"
    });
  }
});

// EXISTING CRUD API — PRESERVED
app.get("/tasks", (req, res) => {
  const tasks = db.prepare("SELECT * FROM tasks").all();
  res.json(tasks);
});

app.post("/tasks", (req, res) => {
  const { title } = req.body || {};

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }

  const result = db
    .prepare("INSERT INTO tasks (title, done) VALUES (?, ?)")
    .run(title.trim(), 0);

  const newTask = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json(newTask);
});

app.get("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);

  const task = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(id);

  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  res.json(task);
});

app.put("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const { title, done } = req.body || {};

  const existingTask = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(id);

  if (!existingTask) {
    return res.status(404).json({ error: "Task not found" });
  }

  if (title !== undefined && (!title || !title.trim())) {
    return res.status(400).json({ error: "Title cannot be empty" });
  }

  const updatedTitle =
    title !== undefined ? title.trim() : existingTask.title;

  const updatedDone =
    done !== undefined ? (done ? 1 : 0) : existingTask.done;

  db.prepare(`
    UPDATE tasks
    SET title = ?, done = ?
    WHERE id = ?
  `).run(updatedTitle, updatedDone, id);

  const updatedTask = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(id);

  res.json(updatedTask);
});

app.delete("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);

  const existingTask = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(id);

  if (!existingTask) {
    return res.status(404).json({ error: "Task not found" });
  }

  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);

  res.status(204).send();
});

// START SERVER
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log("Supabase client initialized");
});
