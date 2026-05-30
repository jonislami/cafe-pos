const crypto  = require('crypto')
const fs      = require('fs')
const path    = require('path')
const { app } = require('electron')

const SECRET      = 'CAFEPOS-SECRET-2024-XK91'
const LICENSE_FILE = () => path.join(app.getPath('userData'), 'license.json')

// ── Generate key (used in keygen.js) ──────────────────────────────
function generateKey(customerName, expiryDate) {
  const data = customerName + '|' + expiryDate
  const sig  = crypto
    .createHmac('sha256', SECRET)
    .update(data)
    .digest('hex')
    .slice(0, 16)
    .toUpperCase()

  // Encode customer + expiry as hex
  const encoded = Buffer.from(data).toString('hex').toUpperCase()

  // Final key = encoded + sig, split into groups of 5
  const raw = (encoded + sig).replace(/[^A-F0-9]/g, '')
  const key = raw.match(/.{1,5}/g).join('-')

  return key
}

// ── Validate key ───────────────────────────────────────────────────
function validateKey(keyStr) {
  try {
    // Clean the key
    const clean = keyStr.replace(/[-\s]/g, '').toUpperCase()

    // Last 16 chars are the signature
    const sig     = clean.slice(-16)
    const encoded = clean.slice(0, -16)

    // Decode the data
    const data = Buffer.from(encoded, 'hex').toString('utf8')

    // Must have format: "Customer Name|YYYY-MM-DD"
    if (!data.includes('|')) {
      return { valid: false, reason: 'Invalid key format' }
    }

    const parts        = data.split('|')
    const customerName = parts[0]
    const expiryDate   = parts[1]

    // Verify signature
    const expectedSig = crypto
      .createHmac('sha256', SECRET)
      .update(data)
      .digest('hex')
      .slice(0, 16)
      .toUpperCase()

    if (sig !== expectedSig) {
      return { valid: false, reason: 'Invalid license key' }
    }

    // Check expiry
    const expiry = new Date(expiryDate)
    expiry.setHours(23, 59, 59, 999)
    const today  = new Date()

    if (today > expiry) {
      return {
        valid:    false,
        expired:  true,
        reason:   'License expired on ' + expiryDate,
        customer: customerName,
        expiry:   expiryDate
      }
    }

    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))

    return {
      valid:    true,
      customer: customerName,
      expiry:   expiryDate,
      daysLeft
    }

  } catch(e) {
    return { valid: false, reason: 'Invalid key' }
  }
}

// ── Save license ───────────────────────────────────────────────────
function saveLicense(keyStr) {
  const result = validateKey(keyStr)
  if (!result.valid && !result.expired) return result

  fs.writeFileSync(LICENSE_FILE(), JSON.stringify({
    key:       keyStr,
    customer:  result.customer,
    expiry:    result.expiry,
    activated: new Date().toISOString()
  }, null, 2))

  return result
}

// ── Check saved license ────────────────────────────────────────────
function checkLicense() {
  try {
    if (!fs.existsSync(LICENSE_FILE())) {
      return { valid: false, reason: 'No license found' }
    }
    const saved = JSON.parse(fs.readFileSync(LICENSE_FILE(), 'utf8'))
    return validateKey(saved.key)
  } catch(e) {
    return { valid: false, reason: 'License file corrupted' }
  }
}

// ── Get license info ───────────────────────────────────────────────
function getLicenseInfo() {
  try {
    if (!fs.existsSync(LICENSE_FILE())) return null
    return JSON.parse(fs.readFileSync(LICENSE_FILE(), 'utf8'))
  } catch(e) { return null }
}

module.exports = { generateKey, validateKey, saveLicense, checkLicense, getLicenseInfo }