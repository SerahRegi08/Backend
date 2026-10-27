const express = require('express');
const { read, write } = require('../store');

const router = express.Router();

const STARTER_CLASSES = [
  { id: 'class-10a', name: 'Class 10A', icon: '📘', classAverage: 68, studentsList: [{ id: 'a1', name: 'Aarav Mehta', score: 84, specialCare: false, numericalSkills: 'secure' }, { id: 'a2', name: 'Diya Shah', score: 72, specialCare: false, numericalSkills: 'secure' }, { id: 'a3', name: 'Kabir Singh', score: 45, specialCare: true, numericalSkills: 'needs-support' }, { id: 'a4', name: 'Meera Joshi', score: 58, specialCare: false, numericalSkills: 'needs-support' }, { id: 'a5', name: 'Rohan Das', score: 81, specialCare: false, numericalSkills: 'secure' }] },
  { id: 'class-10b', name: 'Class 10B', icon: '📗', classAverage: 0, studentsList: [] },
  { id: 'class-9a', name: 'Class 9A', icon: '📕', classAverage: 0, studentsList: [] },
  { id: 'class-9b', name: 'Class 9B', icon: '📙', classAverage: 0, studentsList: [] },
];

// Whole-list sync. Frontend owns ids; backend is the durable copy.
// LocalStorage stays as offline fallback, so empty/missing backend never wipes data.
router.get('/', (req, res) => {
  const classes = read('classes.json', []);
  if (!Array.isArray(classes) || classes.length === 0) {
    return res.json(STARTER_CLASSES);
  }
  return res.json(classes);
});

router.put('/', (req, res) => {
  if (!Array.isArray(req.body)) return res.status(400).json({ error: 'Expected an array' });
  write('classes.json', req.body);
  return res.json({ ok: true });
});

module.exports = router;

