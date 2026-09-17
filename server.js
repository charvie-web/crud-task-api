const express = require("express");
const swaggerUi = require("swagger-ui-express");
const db = require("./db");

const app = express();

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Task API",
    version: "1.0.0",
    description: "A simple CRUD API for managing tasks"
  },
  servers: [
    {
      url: "http://localhost:3000"
    }
  ],
  paths: {
    "/tasks": {
      get: {
        summary: "Get all tasks",
        responses: {
          "200": {
            description: "List of tasks"
          }
        }
      },
      post: {
        summary: "Create a task",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title"],
                properties: {
                  title: {
                    type: "string"
                  }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Task created"
          },
          "400": {
            description: "Invalid input"
          }
        }
      }
    },
    "/tasks/{id}": {
      get: {
        summary: "Get one task",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer"
            }
          }
        ],
        responses: {
          "200": {
            description: "Task found"
          },
          "404": {
            description: "Task not found"
          }
        }
      },
      put: {
        summary: "Update a task",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer"
            }
          }
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: {
                    type: "string"
                  },
                  done: {
                    type: "boolean"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Task updated"
          },
          "400": {
            description: "Invalid input"
          },
          "404": {
            description: "Task not found"
          }
        }
      },
      delete: {
        summary: "Delete a task",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer"
            }
          }
        ],
        responses: {
          "204": {
            description: "Task deleted"
          },
          "404": {
            description: "Task not found"
          }
        }
      }
    }
  }
};

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json());


app.get("/", (req, res) => {
  res.json({ message: "Hello from my CRUD API!" });
});

app.get("/api", (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: ["/tasks"]
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/tasks", (req, res) => {
  const tasks = db.prepare("SELECT * FROM tasks").all();

  res.json(tasks);
});

app.post("/tasks", (req, res) => {
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({
      error: "Title is required"
    });
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
    return res.status(404).json({
      error: "Task not found"
    });
  }

  res.json(task);
});

app.put("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const { title, done } = req.body;

  const existingTask = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(id);

  if (!existingTask) {
    return res.status(404).json({
      error: "Task not found"
    });
  }

  if (title !== undefined && (!title || !title.trim())) {
    return res.status(400).json({
      error: "Title cannot be empty"
    });
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
    return res.status(404).json({
      error: "Task not found"
    });
  }

  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);

  res.status(204).send();
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});