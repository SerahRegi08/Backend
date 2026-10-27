// Tiny JSON-file store for lists that outgrow browser storage.
// Supports both local development (backend/data/) and Vercel serverless (/tmp).
const fs = require('fs');
const path = require('path');
const os = require('os');

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NOW_REGION);
const SEEDS_DIR = path.join(__dirname, 'seeds');
const LOCAL_DATA_DIR = path.join(__dirname, '..', 'data');
let DATA_DIR = isServerless ? path.join(os.tmpdir(), 'cognify-data') : LOCAL_DATA_DIR;

function read(name, fallback) {
  try {
    // 1. Check active writable storage
    const writableFile = path.join(DATA_DIR, name);
    if (fs.existsSync(writableFile)) {
      return JSON.parse(fs.readFileSync(writableFile, 'utf8'));
    }
    // 2. Check local data directory
    const localFile = path.join(LOCAL_DATA_DIR, name);
    if (fs.existsSync(localFile)) {
      return JSON.parse(fs.readFileSync(localFile, 'utf8'));
    }
    // 3. Check bundled seeds directory (tracked in git for Vercel deployments)
    const seedFile = path.join(SEEDS_DIR, name);
    if (fs.existsSync(seedFile)) {
      return JSON.parse(fs.readFileSync(seedFile, 'utf8'));
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function write(name, data) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(path.join(DATA_DIR, name), JSON.stringify(data, null, 2));
  } catch (err) {
    // If local write failed due to read-only filesystem, switch to tmpdir and retry
    if (err.code === 'EROFS' || err.code === 'EACCES') {
      try {
        DATA_DIR = path.join(os.tmpdir(), 'cognify-data');
        fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(path.join(DATA_DIR, name), JSON.stringify(data, null, 2));
      } catch (innerErr) {
        console.error('Storage write error (tmp fallback):', innerErr);
      }
    } else {
      console.error('Storage write error:', err);
    }
  }
}

module.exports = { read, write };
