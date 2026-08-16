const express = require("express");
const swaggerUi = require("swagger-ui-express");

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

let tasks = [
  { id: 1, title: "Learn JavaScript", done: false },
  { id: 2, title: "Build CRUD API", done: false },
  { id: 3, title: "Upload project to GitHub", done: false }
];

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
  res.json(tasks);
});

app.post("/tasks", (req, res) => {
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({
      error: "Title is required"
    });
  }

  const newTask = {
    id: tasks.length + 1,
    title: title.trim(),
    done: false
  };

  tasks.push(newTask);

  res.status(201).json(newTask);
});

app.get("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find(task => task.id === id);

 if (!task) {
    return res.status(404).json({
      error: "Task not found"
    });
  }

  res.json(task);
});

app.put("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find(task => task.id === id);

  if (!task) {
    return res.status(404).json({
      error: "Task not found"
    });
  }

  const { title, done } = req.body;

  if (title !== undefined) {
    if (!title.trim()) {
      return res.status(400).json({
        error: "Title cannot be empty"
      });
    }

    task.title = title.trim();
  }

  if (done !== undefined) {
    task.done = done;
  }

  res.json(task);
});

app.delete("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = tasks.findIndex(task => task.id === id);

  if (index === -1) {
    return res.status(404).json({
      error: "Task not found"
    });
  }

  tasks.splice(index, 1);

  res.status(204).send();
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});