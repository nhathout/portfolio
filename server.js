const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Adjust if you keep the folder name as docs
app.use(express.static(path.join(__dirname, 'docs')));

const LEADERBOARD_FILE = path.join(__dirname, 'leaderboard.json');

const cors = require('cors');
app.use(cors());

// GET /api/leaderboard -> Return current leaderboard
app.get('/api/leaderboard', (req, res) => {
  fs.readFile(LEADERBOARD_FILE, 'utf8', (err, data) => {
    if (err) {
      // If file not found or error, respond with empty array
      return res.json([]);
    }
    try {
      const leaderboard = JSON.parse(data);
      res.json(leaderboard);
    } catch (e) {
      res.json([]);
    }
  });
});

// POST /api/leaderboard -> Add new entry { initials, score }
app.post('/api/leaderboard', (req, res) => {
  const { initials, score } = req.body;
  if (!initials || score == null) {
    return res.status(400).json({ error: 'Missing initials or score' });
  }

  fs.readFile(LEADERBOARD_FILE, 'utf8', (err, data) => {
    let leaderboard = [];
    if (!err && data) {
      try {
        leaderboard = JSON.parse(data);
      } catch (e) {
        leaderboard = [];
      }
    }
    // Add new entry
    leaderboard.push({ initials, score: parseInt(score, 10) || 0 });
    // Sort descending
    leaderboard.sort((a, b) => b.score - a.score);
    // Keep top 20
    leaderboard = leaderboard.slice(0, 20);

    fs.writeFile(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2), (err2) => {
      if (err2) {
        return res.status(500).json({ error: 'Failed to write file' });
      }
      res.json({ message: 'Score saved', leaderboard });
    });
  });
});

// POST /api/leaderboard/reset -> body: { passkey }
app.post('/api/leaderboard/reset', (req, res) => {
  const { passkey } = req.body;
  // your passkey is "8008"
  if (passkey === '8008') {
    // Overwrite file with empty array
    fs.writeFile(LEADERBOARD_FILE, JSON.stringify([], null, 2), (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to reset leaderboard' });
      }
      return res.json({ message: 'Leaderboard reset' });
    });
  } else {
    return res.status(403).json({ error: 'Incorrect passkey' });
  }
});

// Listen on some port
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
})