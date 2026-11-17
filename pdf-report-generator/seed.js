const { DatabaseSync } = require("node:sqlite");

const db = new DatabaseSync("report.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer TEXT NOT NULL,
    product TEXT NOT NULL,
    amount REAL NOT NULL,
    created_at TEXT NOT NULL
  )
`);

db.exec("DELETE FROM orders");

const products = [
  "Laptop", "Keyboard", "Mouse",
  "Monitor", "Headphones", "Webcam"
];

const insert = db.prepare(`
  INSERT INTO orders (customer, product, amount, created_at)
  VALUES (?, ?, ?, ?)
`);

for (let i = 1; i <= 200; i++) {
  const customer = `Customer ${Math.ceil(Math.random() * 50)}`;
  const product = products[Math.floor(Math.random() * products.length)];
  const amount = Number((5 + Math.random() * 195).toFixed(2));

  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 30));

  insert.run(customer, product, amount, date.toISOString());
}

const result = db.prepare("SELECT COUNT(*) AS total FROM orders").get();

console.log(`Successfully seeded ${result.total} orders.`);

db.close();
