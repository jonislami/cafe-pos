const path = require('path')
const fs = require('fs')
const { app } = require('electron')

let db
let SQL

async function initialize() {
  const initSqlJs = require('sql.js')
  SQL = await initSqlJs()

  const dbPath = path.join(app.getPath('userData'), 'cafepos.db')

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath)
    db = new SQL.Database(fileBuffer)
  } else {
    db = new SQL.Database()
  }

  createTables()
  runMigrations()
  seedData()
  saveDatabase(dbPath)
}

function runMigrations() {
  // 1. Add product_icon to order_items if it doesn't exist
  try {
    const columns = query('PRAGMA table_info(order_items)')
    if (!columns.find(c => c.name === 'product_icon')) {
      db.run('ALTER TABLE order_items ADD COLUMN product_icon TEXT DEFAULT "☕"')
    }
  } catch (e) {
    console.error('Migration (order_items) failed:', e)
  }

  // 2. Add status to orders if it doesn't exist
  try {
    const columns = query('PRAGMA table_info(orders)')
    if (!columns.find(c => c.name === 'status')) {
      db.run('ALTER TABLE orders ADD COLUMN status TEXT DEFAULT "open"')
    }
  } catch (e) {
    console.error('Migration (orders) failed:', e)
  }
}

function saveDatabase(dbPath) {
  if (!dbPath) {
    dbPath = path.join(app.getPath('userData'), 'cafepos.db')
  }
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(dbPath, buffer)
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      card_uid   TEXT UNIQUE,
      role       TEXT NOT NULL,
      status     TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      name     TEXT NOT NULL,
      category TEXT NOT NULL,
      price    REAL NOT NULL,
      stock    INTEGER DEFAULT 0,
      icon     TEXT DEFAULT '☕',
      active   INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS tables (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      name   TEXT NOT NULL,
      status TEXT DEFAULT 'free',
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS orders (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id    INTEGER,
      employee_id INTEGER,
      total       REAL NOT NULL,
      status      TEXT DEFAULT 'open',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id     INTEGER,
      product_name TEXT NOT NULL,
      product_icon TEXT DEFAULT '☕',
      quantity     INTEGER NOT NULL,
      price        REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
  `)
}

function seedData() {
  const result = db.exec('SELECT COUNT(*) as c FROM employees')
  const count = result[0].values[0][0]
  if (count > 0) return  // Already seeded

  db.run(`
    INSERT INTO employees (name, card_uid, role) VALUES
      ('Marco Romano', 'A1B2C3D4', 'admin'),
      ('Sofia Greco',  'E5F6G7H8', 'waiter'),
      ('Luca Bianchi', 'I9J0K1L2', 'waiter');

    INSERT INTO products (name, category, price, stock, icon) VALUES
      ('Espresso',   'coffee', 1.50, 999, '☕'),
      ('Cappuccino', 'coffee', 2.20, 999, '🫗'),
      ('Americano',  'coffee', 2.00, 999, '☕'),
      ('Flat White', 'coffee', 2.50, 999, '🥛'),
      ('Latte',      'coffee', 2.50, 999, '🫙'),
      ('Water',      'drinks', 1.00,  50, '💧'),
      ('Orange Juice','drinks',2.50,  30, '🍊'),
      ('Coke',       'drinks', 2.00,  40, '🥤'),
      ('Croissant',  'food',   1.80,  20, '🥐'),
      ('Toast',      'food',   2.50,  15, '🍞'),
      ('Panini',     'food',   4.50,  12, '🥖'),
      ('Lager',      'alcohol',3.50,  60, '🍺'),
      ('Wine',       'alcohol',5.00,  30, '🍷'),
      ('Tiramisu',   'desserts',3.50,  8, '🍰'),
      ('Cannoli',    'desserts',2.80, 10, '🍩');

    INSERT INTO tables (name) VALUES
      ('T1'),('T2'),('T3'),('T4'),('T5'),
      ('T6'),('T7'),('T8'),('Bar'),('Terrace');

    INSERT INTO settings (key, value) VALUES
      ('cafe_name', 'Caffè Centro'),
      ('address',   'Via Roma 12, Milano'),
      ('vat_number','12345678901'),
      ('footer',    'Grazie! Thank you!');
  `)

  saveDatabase()
}

// Run a write query (INSERT, UPDATE, DELETE, CREATE)
function run(sql, params = []) {
  db.run(sql, params)
  saveDatabase()
  return { changes: db.getRowsModified() }
}

// Get all rows
function query(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows
}

// Get single row
function get(sql, params = []) {
  const rows = query(sql, params)
  return rows[0] || null
}

module.exports = { initialize, run, query, get, saveDatabase }