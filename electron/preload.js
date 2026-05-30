const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Raw database
  query: (sql, params) => ipcRenderer.invoke('db:query', sql, params),
  run:   (sql, params) => ipcRenderer.invoke('db:run',   sql, params),
  get:   (sql, params) => ipcRenderer.invoke('db:get',   sql, params),

  // Auth
  rfidLogin: (uid) => ipcRenderer.invoke('auth:rfid', uid),
  pinLogin: (pin) => ipcRenderer.invoke('auth:pin', pin),

  // Products
  getProducts:    ()  => ipcRenderer.invoke('products:all'),
  addProduct:     (p) => ipcRenderer.invoke('products:add',    p),
  updateProduct:  (p) => ipcRenderer.invoke('products:update', p),
  deleteProduct:  (id)=> ipcRenderer.invoke('products:delete', id),

  // Employees
  getEmployees:   ()  => ipcRenderer.invoke('employees:all'),
  addEmployee:    (e) => ipcRenderer.invoke('employees:add',    e),
  updateEmployee: (e) => ipcRenderer.invoke('employees:update', e),
  deleteEmployee: (id)=> ipcRenderer.invoke('employees:delete', id),

  // Tables
  getTables:    ()     => ipcRenderer.invoke('tables:all'),
  addTable:     (name) => ipcRenderer.invoke('tables:add',    name),
  deleteTable:  (id)   => ipcRenderer.invoke('tables:delete', id),

  // Orders
  addOrder:     (o) => ipcRenderer.invoke('orders:add',   o),
  getTodayOrders: () => ipcRenderer.invoke('orders:today'),
  getOrderStats:  () => ipcRenderer.invoke('orders:stats'),
  getActiveOrders: () => ipcRenderer.invoke('orders:get-active'),
  syncTableOrder:  (data) => ipcRenderer.invoke('orders:sync-table', data),
})