module.exports = {
  appId:   'com.yourname.cafepos',
  productName: 'CaféPOS',
  copyright: 'Copyright © 2026',
  
  directories: {
    output: 'release',
    buildResources: 'assets',
  },

  files: [
    'dist/renderer/**',
    'electron/**',
    '!electron/database/*.sql',
    'node_modules/better-sqlite3/**',
    'node_modules/electron-pos-printer/**',
  ],

  win: {
    target: [{ target: 'nsis', arch: ['x64', 'ia32'] }],
    icon: 'assets/icon.ico',   // must be .ico for Windows
  },

  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    installerIcon: 'assets/icon.ico',
    uninstallerIcon: 'assets/icon.ico',
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'CaféPOS',
  },

  extraResources: [
    { from: 'assets/', to: 'assets/', filter: ['**/*'] }
  ],

  // Rebuild native modules (better-sqlite3) for Electron's Node version
  afterPack: async (context) => {
    const { execSync } = require('child_process')
    execSync('npm run postinstall', { stdio: 'inherit' })
  },
}