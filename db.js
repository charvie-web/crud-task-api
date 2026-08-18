const Database = require("better-sqlite3");

const db = new Database("tasks.db");

// Create the tasks table if it doesn't exist
db.prepare(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        done BOOLEAN NOT NULL DEFAULT 0
    )
`).run();

// Insert example tasks only if the table is empty
const count = db.prepare("SELECT COUNT(*) AS count FROM tasks").get();

if (count.count === 0) {
    const insert = db.prepare(`
        INSERT INTO tasks (title, done)
        VALUES (?, ?)
    `);

    insert.run("Learn SQLite", 0);
    insert.run("Connect CRUD API to database", 0);
    insert.run("Test database persistence", 0);
}

module.exports = db;