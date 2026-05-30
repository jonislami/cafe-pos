const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const db = require('./database/db')

const isDev = process.env.NODE_ENV === 'development'

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#0f1117',
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  await db.initialize()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── Database IPC handlers ──────────────────────────────

ipcMain.handle('db:query', (_, sql, params) => db.query(sql, params))
ipcMain.handle('db:run',   (_, sql, params) => db.run(sql, params))
ipcMain.handle('db:get',   (_, sql, params) => db.get(sql, params))

// ── Auth ───────────────────────────────────────────────

ipcMain.handle('auth:rfid', (_, uid) => {
  return db.get(
    'SELECT * FROM employees WHERE card_uid = ? AND status = "active"',
    [uid]
  )
})

// ── Products ───────────────────────────────────────────

ipcMain.handle('products:all', () => {
  return db.query('SELECT * FROM products WHERE active = 1 ORDER BY category, name')
})

ipcMain.handle('products:add', (_, p) => {
  return db.run(
    'INSERT INTO products (name, category, price, stock, icon) VALUES (?, ?, ?, ?, ?)',
    [p.name, p.category, p.price, p.stock, p.icon]
  )
})

ipcMain.handle('products:update', (_, p) => {
  return db.run(
    'UPDATE products SET name=?, category=?, price=?, stock=?, icon=? WHERE id=?',
    [p.name, p.category, p.price, p.stock, p.icon, p.id]
  )
})

ipcMain.handle('products:delete', (_, id) => {
  return db.run('UPDATE products SET active = 0 WHERE id = ?', [id])
})

// ── Employees ──────────────────────────────────────────

ipcMain.handle('employees:all', () => {
  return db.query('SELECT * FROM employees ORDER BY name')
})

ipcMain.handle('employees:add', (_, e) => {
  return db.run(
    'INSERT INTO employees (name, role, card_uid, status) VALUES (?, ?, ?, ?)',
    [e.name, e.role, e.card_uid || null, e.status || 'active']
  )
})

ipcMain.handle('employees:update', (_, e) => {
  return db.run(
    'UPDATE employees SET name=?, role=?, card_uid=?, status=? WHERE id=?',
    [e.name, e.role, e.card_uid || null, e.status, e.id]
  )
})

ipcMain.handle('employees:delete', (_, id) => {
  return db.run('UPDATE employees SET status = "inactive" WHERE id = ?', [id])
})

// ── Tables ─────────────────────────────────────────────

ipcMain.handle('tables:all', () => {
  return db.query('SELECT * FROM tables WHERE active = 1 ORDER BY id')
})

ipcMain.handle('tables:add', (_, name) => {
  return db.run('INSERT INTO tables (name) VALUES (?)', [name])
})

ipcMain.handle('tables:delete', (_, id) => {
  return db.run('UPDATE tables SET active = 0 WHERE id = ?', [id])
})

// ── Orders ─────────────────────────────────────────────

ipcMain.handle('orders:add', (_, o) => {
  const result = db.run(
    'INSERT INTO orders (table_id, employee_id, total) VALUES (?, ?, ?)',
    [o.table_id, o.employee_id, o.total]
  )
  const orderId = db.get('SELECT last_insert_rowid() as id').id
  for (const item of o.items) {
    db.run(
      'INSERT INTO order_items (order_id, product_name, quantity, price) VALUES (?, ?, ?, ?)',
      [orderId, item.name, item.qty, item.price]
    )
  }
  return { orderId }
})

ipcMain.handle('orders:today', () => {
  return db.query(`
    SELECT o.*, e.name as waiter_name, t.name as table_name
    FROM orders o
    LEFT JOIN employees e ON o.employee_id = e.id
    LEFT JOIN tables t ON o.table_id = t.id
    WHERE date(o.created_at) = date('now')
    ORDER BY o.created_at DESC
  `)
})

ipcMain.handle('orders:stats', () => {
  return db.get(`
    SELECT
      COUNT(*) as total_orders,
      COALESCE(SUM(total), 0) as total_revenue,
      COALESCE(AVG(total), 0) as avg_order
    FROM orders
    WHERE date(created_at) = date('now')
  `)
})