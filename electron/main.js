const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const db = require('./database/db')
const license = require('./license')

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

ipcMain.handle('auth:pin', (_, pin) => {
  return db.get(
    'SELECT * FROM employees WHERE pin = ? AND status = "active"',
    [pin]
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
    'INSERT INTO employees (name, role, card_uid, pin, status) VALUES (?, ?, ?, ?, ?)',
    [e.name, e.role, e.card_uid || null, e.pin || null, e.status || 'active']
  )
})

ipcMain.handle('employees:update', (_, e) => {
  return db.run(
    'UPDATE employees SET name=?, role=?, card_uid=?, pin=?, status=? WHERE id=?',
    [e.name, e.role, e.card_uid || null, e.pin || null, e.status, e.id]
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

ipcMain.handle('orders:get-active', () => {
  const rows = db.query("SELECT * FROM orders WHERE status = 'open'")
  const result = {}
  for (const order of rows) {
    const items = db.query(
      'SELECT product_name as name, product_icon as icon, quantity as qty, price FROM order_items WHERE order_id = ?',
      [order.id]
    )
    result[order.table_id] = items
  }
  return result
})

ipcMain.handle('orders:sync-table', (_, { tableId, employeeId, items, total }) => {
  console.log(`Syncing table ${tableId} with ${items.length} items`)
  try {
    // 1. Find existing open order for this table
    let order = db.get("SELECT id FROM orders WHERE table_id = ? AND status = 'open'", [tableId])
    let orderId

    if (order) {
      orderId = order.id
      db.run('UPDATE orders SET total = ?, employee_id = ? WHERE id = ?', [total, employeeId, orderId])
      db.run('DELETE FROM order_items WHERE order_id = ?', [orderId])
    } else {
      db.run(
        'INSERT INTO orders (table_id, employee_id, total, status) VALUES (?, ?, ?, "open")',
        [tableId, employeeId, total]
      )
      const res = db.get('SELECT last_insert_rowid() as id')
      orderId = res.id
    }

    // 2. Insert items
    for (const item of items) {
      db.run(
        'INSERT INTO order_items (order_id, product_name, product_icon, quantity, price) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.name, item.icon || '☕', item.qty, item.price]
      )
    }
    return { orderId }
  } catch (e) {
    console.error('Failed to sync table:', e)
    throw e
  }
})

ipcMain.handle('orders:add', (_, o) => {
  // Check if there's an existing open order for this table
  const existing = db.get("SELECT id FROM orders WHERE table_id = ? AND status = 'open'", [o.table_id])

  if (existing) {
    // Update existing order to completed
    db.run(
      'UPDATE orders SET total = ?, employee_id = ?, status = "completed" WHERE id = ?',
      [o.total, o.employee_id, existing.id]
    )
    // We assume items are already synced or we re-sync them here
    db.run('DELETE FROM order_items WHERE order_id = ?', [existing.id])
    for (const item of o.items) {
      db.run(
        'INSERT INTO order_items (order_id, product_name, product_icon, quantity, price) VALUES (?, ?, ?, ?, ?)',
        [existing.id, item.name, item.icon, item.qty, item.price]
      )
    }
    return { orderId: existing.id }
  } else {
    // Standard insert as completed
    db.run(
      'INSERT INTO orders (table_id, employee_id, total, status) VALUES (?, ?, ?, "completed")',
      [o.table_id, o.employee_id, o.total]
    )
    const orderId = db.get('SELECT last_insert_rowid() as id').id
    for (const item of o.items) {
      db.run(
        'INSERT INTO order_items (order_id, product_name, product_icon, quantity, price) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.name, item.icon, item.qty, item.price]
      )
    }
    return { orderId }
  }
})

ipcMain.handle('orders:today', () => {
  return db.query(`
    SELECT o.*, e.name as waiter_name, t.name as table_name
    FROM orders o
    LEFT JOIN employees e ON o.employee_id = e.id
    LEFT JOIN tables t ON o.table_id = t.id
    WHERE date(o.created_at) = date('now') AND o.status = 'completed'
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
    WHERE date(created_at) = date('now') AND status = 'completed'
  `)
})

// ── License ────────────────────────────────────────────────────────

ipcMain.handle('license:check', () => {
  return license.checkLicense()
})

ipcMain.handle('license:activate', (_, key) => {
  return license.saveLicense(key)
})

ipcMain.handle('license:info', () => {
  return license.getLicenseInfo()
})

// ── Settings ───────────────────────────────────────────

ipcMain.handle('settings:all', () => {
  const rows = db.query('SELECT * FROM settings')
  const settings = {}
  rows.forEach(r => { settings[r.key] = r.value })
  return settings
})

ipcMain.handle('settings:update', (_, s) => {
  for (const [key, value] of Object.entries(s)) {
    db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value])
  }
  return { success: true }
})