// Per-student memory: every scanned paper is recorded under
// "<classId>|||<normalized student name>" so each of the 150+ students
// keeps a separate history that survives backend restarts.
const fs = require('fs');
const path = require('path');
const os = require('os');

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NOW_REGION);
const SEEDS_FILE = path.join(__dirname, 'seeds', 'students.json');
const LOCAL_DATA_FILE = path.join(__dirname, '..', 'data', 'students.json');
let DATA_DIR = isServerless ? path.join(os.tmpdir(), 'cognify-data') : path.join(__dirname, '..', 'data');
let DATA_FILE = path.join(DATA_DIR, 'students.json');
const KEEP_LAST = 20;

function normalizeName(name) {
  return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function keyFor(classId, name, subject = '') {
  return `${classId}|||${normalizeName(name)}|||${normalizeName(subject)}`;
}

function legacyKeyFor(classId, name) {
  return `${classId}|||${normalizeName(name)}`;
}

function loadAll() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    }
    if (fs.existsSync(LOCAL_DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(LOCAL_DATA_FILE, 'utf8') || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    }
    if (fs.existsSync(SEEDS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(SEEDS_FILE, 'utf8') || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    }
    return {};
  } catch {
    return {};
  }
}

function saveAll(data) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    if (err.code === 'EROFS' || err.code === 'EACCES') {
      try {
        DATA_DIR = path.join(os.tmpdir(), 'cognify-data');
        DATA_FILE = path.join(DATA_DIR, 'students.json');
        fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
      } catch (innerErr) {
        console.error('History save error (tmp fallback):', innerErr);
      }
    } else {
      console.error('History save error:', err);
    }
  }
}

function getHistory(classId, name, subject = '') {
  const all = loadAll();
  const list = all[keyFor(classId, name, subject)];
  if (Array.isArray(list) && list.length > 0) return list;
  // Backwards compatibility: scans recorded before subject support.
  if (!normalizeName(subject)) {
    const legacy = all[legacyKeyFor(classId, name)];
    if (Array.isArray(legacy)) return legacy;
  }
  return [];
}

function addRecord(classId, name, entry, subject = '') {
  const all = loadAll();
  const key = keyFor(classId, name, subject);
  const list = all[key] || [];
  list.push({ date: new Date().toISOString(), ...entry });
  all[key] = list.slice(-KEEP_LAST);
  saveAll(all);
  return all[key];
}

module.exports = { getHistory, addRecord, normalizeName };
