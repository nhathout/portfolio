const fs = require('fs');
const path = require('path');
const Engine = require('tingodb')();
const express = require('express');
const cors = require('cors');

const crypto = require('crypto');

const app = express();
// Render sits behind a proxy; trust it so req.ip is the visitor's address
app.set('trust proxy', 1);
app.use(express.json());
app.use(cors());

// Make sure the database directory exists (/data/db on Render; DB_DIR for local testing):
const dbDir = process.env.DB_DIR || path.join('/data', 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Now create the TingoDB instance pointing to the database directory
const db = new Engine.Db(dbDir, {});
const leaderboardCollection = db.collection('leaderboard');
const interestCollection = db.collection('bros2_interest');
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

// ==========================
//   BROS2 early-access waitlist
// ==========================
const INTEREST_ROLES = ['student', 'educator', 'maker', 'engineer'];
const INTEREST_RATE_WINDOW_MS = 10 * 60 * 1000;
const INTEREST_RATE_LIMIT = 5;
const interestAttempts = new Map();

function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase();
}

function isValidEmail(email) {
  return email.length > 3 && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (interestAttempts.get(ip) || []).filter(time => now - time < INTEREST_RATE_WINDOW_MS);
  recent.push(now);
  interestAttempts.set(ip, recent);
  // keep the map from growing forever
  if (interestAttempts.size > 5000) {
    for (const [key, times] of interestAttempts) {
      if (!times.some(time => now - time < INTEREST_RATE_WINDOW_MS)) {
        interestAttempts.delete(key);
      }
    }
  }
  return recent.length > INTEREST_RATE_LIMIT;
}

function countInterest(callback) {
  interestCollection.count({}, callback);
}

function keysMatch(provided, expected) {
  const a = Buffer.from(String(provided));
  const b = Buffer.from(String(expected));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ==========================
//   GET /api/bros2/interest
//   Public tally only, never the entries
// ==========================
app.get('/api/bros2/interest', (req, res) => {
  countInterest((err, count) => {
    if (err) {
      console.error('Failed to count BROS2 interest:', err);
      return res.status(500).json({ error: 'Failed to count' });
    }
    res.json({ count });
  });
});

// ==========================
//   POST /api/bros2/interest
//   Body: { email, role? }
// ==========================
app.post('/api/bros2/interest', (req, res) => {
  if (isRateLimited(req.ip)) {
    return res.status(429).json({ error: 'Too many requests, try again later' });
  }

  const email = normalizeEmail(req.body?.email);
  const role = INTEREST_ROLES.includes(req.body?.role) ? req.body.role : '';

  // honeypot: real visitors never fill the hidden "website" field
  if (req.body?.website) {
    return countInterest((err, count) => res.json({ ok: true, alreadyJoined: false, count: err ? 0 : count }));
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  interestCollection.findOne({ email }, (findErr, existing) => {
    if (findErr) {
      console.error('Failed to look up BROS2 interest:', findErr);
      return res.status(500).json({ error: 'Failed to save' });
    }

    const respond = alreadyJoined => countInterest((countErr, count) => {
      if (countErr) {
        console.error('Failed to count BROS2 interest:', countErr);
        return res.status(500).json({ error: 'Failed to count' });
      }
      res.json({ ok: true, alreadyJoined, count });
    });

    if (existing) {
      return respond(true);
    }

    interestCollection.insert({ email, role, createdAt: new Date().toISOString() }, insertErr => {
      if (insertErr) {
        console.error('Failed to save BROS2 interest:', insertErr);
        return res.status(500).json({ error: 'Failed to save' });
      }
      respond(false);
    });
  });
});

// ==========================
//   GET /api/bros2/interest/export
//   Header: x-admin-key: <INTEREST_ADMIN_KEY>
//   Disabled unless INTEREST_ADMIN_KEY is set
// ==========================
app.get('/api/bros2/interest/export', (req, res) => {
  const adminKey = process.env.INTEREST_ADMIN_KEY;
  if (!adminKey) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (!keysMatch(req.get('x-admin-key') || '', adminKey)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  interestCollection.find({}).toArray((err, docs) => {
    if (err) {
      console.error('Failed to export BROS2 interest:', err);
      return res.status(500).json({ error: 'Failed to export' });
    }
    const entries = docs
      .map(doc => ({ email: doc.email, role: doc.role || '', createdAt: doc.createdAt }))
      .sort((left, right) => String(left.createdAt).localeCompare(String(right.createdAt)));
    res.json({ count: entries.length, entries });
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
