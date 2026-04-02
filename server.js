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
const MAX_LEADERBOARD_NAME_LENGTH = 4;

// Middleware
app.use(express.json());
app.use(cors());

// Serve your static site from /docs
app.use(express.static(path.join(__dirname, 'docs')));

function sanitizeLeaderboardName(value) {
  return String(value ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, MAX_LEADERBOARD_NAME_LENGTH);
}

function normalizeLeaderboardEntry(entry) {
  return {
    initials: sanitizeLeaderboardName(entry?.initials),
    score: parseInt(entry?.score, 10) || 0
  };
}

function isValidLeaderboardName(value) {
  return Boolean(sanitizeLeaderboardName(value));
}

function getLeaderboardEntries(callback) {
  leaderboardCollection.find({}).sort({ score: -1 }).toArray((err, docs) => {
    if (err) {
      return callback(err);
    }

    const leaderboard = docs
      .map(normalizeLeaderboardEntry)
      .filter(entry => entry.initials)
      .sort((left, right) => right.score - left.score || left.initials.localeCompare(right.initials));

    callback(null, leaderboard);
  });
}

function purgeInvalidLeaderboardEntries(callback = () => {}) {
  leaderboardCollection.find({}).toArray((err, docs) => {
    if (err) {
      callback(err);
      return;
    }

    const invalidDocs = docs.filter(doc => !isValidLeaderboardName(doc.initials));
    if (!invalidDocs.length) {
      callback(null, 0);
      return;
    }

    let removed = 0;
    const removeNext = index => {
      if (index >= invalidDocs.length) {
        callback(null, removed);
        return;
      }

      leaderboardCollection.remove({ _id: invalidDocs[index]._id }, {}, removeErr => {
        if (removeErr) {
          callback(removeErr);
          return;
        }

        removed += 1;
        removeNext(index + 1);
      });
    };

    removeNext(0);
  });
}

// ==========================
//   GET /api/leaderboard
// ==========================
app.get('/api/leaderboard', (req, res) => {
  getLeaderboardEntries((err, docs) => {
    if (err) {
      console.error('Failed to fetch leaderboard from TingoDB:', err);
      return res.json([]);
    }

    res.json(docs);
  });
});

// ==========================
//   POST /api/leaderboard
//   Body: { initials, score }
// ==========================
app.post('/api/leaderboard', (req, res) => {
  const initials = sanitizeLeaderboardName(req.body?.initials);
  const score = parseInt(req.body?.score, 10) || 0;

  if (!initials || req.body?.score == null) {
    return res.status(400).json({ error: 'Missing initials or score' });
  }

  leaderboardCollection.insert({ initials, score }, err => {
    if (err) {
      console.error('Failed to insert score into TingoDB:', err);
      return res.status(500).json({ error: 'Failed to save score' });
    }

    getLeaderboardEntries((findErr, docs) => {
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
  purgeInvalidLeaderboardEntries((err, removedCount) => {
    if (err) {
      console.error('Failed to purge invalid leaderboard entries:', err);
      return;
    }
    if (removedCount) {
      console.log(`Removed ${removedCount} invalid leaderboard entries`);
    }
  });
});
