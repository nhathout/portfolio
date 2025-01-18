const fs = require('fs');
const path = require('path');
const Engine = require('tingodb')();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Make sure /data/db directory exists:
const dbDir = path.join('/data', 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Now create the TingoDB instance pointing to /data/db
const db = new Engine.Db(dbDir, {});
const leaderboardCollection = db.collection('leaderboard');

// Middleware
app.use(express.json());
app.use(cors());

// Serve your static site from /docs
app.use(express.static(path.join(__dirname, 'docs')));

// ==========================
//   GET /api/leaderboard
// ==========================
app.get('/api/leaderboard', (req, res) => {
  // Retrieve all entries, sorted by score desc
  leaderboardCollection.find({}).sort({ score: -1 }).toArray((err, docs) => {
    if (err) {
      console.error('Failed to fetch leaderboard from TingoDB:', err);
      // Return empty array on error
      return res.json([]);
    }
    // Return the docs as JSON
    res.json(docs);
  });
});

// ==========================
//   POST /api/leaderboard
//   Body: { initials, score }
// ==========================
app.post('/api/leaderboard', (req, res) => {
  const { initials, score } = req.body;
  if (!initials || score == null) {
    return res.status(400).json({ error: 'Missing initials or score' });
  }

  // Insert new record
  leaderboardCollection.insert({ initials, score: parseInt(score, 10) || 0 }, (err) => {
    if (err) {
      console.error('Failed to insert score into TingoDB:', err);
      return res.status(500).json({ error: 'Failed to save score' });
    }

    // Now fetch updated top 20 to return
    leaderboardCollection.find({}).sort({ score: -1 }).limit(20).toArray((findErr, docs) => {
      if (findErr) {
        console.error('Failed to retrieve updated leaderboard:', findErr);
        return res.status(500).json({ error: 'Failed to retrieve updated leaderboard' });
      }
      res.json({ message: 'Score saved', leaderboard: docs });
    });
  });
});

// ==========================
//   POST /api/leaderboard/reset
//   Body: { passkey }
//   For example passkey: '8008'
// ==========================
app.post('/api/leaderboard/reset', (req, res) => {
  const { passkey } = req.body;
  if (passkey !== '8008') {
    return res.status(403).json({ error: 'Incorrect passkey' });
  }

  // Remove all documents from the collection
  leaderboardCollection.remove({}, { multi: true }, (err) => {
    if (err) {
      console.error('Failed to reset leaderboard:', err);
      return res.status(500).json({ error: 'Failed to reset leaderboard' });
    }
    return res.json({ message: 'Leaderboard reset' });
  });
});

// Listen on some port
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});