// server.js
// Main entry point - routes requests to /backend and serves static frontend

const express = require('express');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');

const fs = require('fs');
const apiRouter = require('./backend/routes/api');

function getPythonExecutable() {
  if (process.env.PYTHON) return process.env.PYTHON;
  const venvPythonWin = path.join(__dirname, '.venv', 'Scripts', 'python.exe');
  if (fs.existsSync(venvPythonWin)) return venvPythonWin;
  const venvPythonPosix = path.join(__dirname, '.venv', 'bin', 'python');
  if (fs.existsSync(venvPythonPosix)) return venvPythonPosix;
  return 'python';
}

function startMlService() {
  const python = getPythonExecutable();
  const script = path.join(__dirname, 'ml', 'infer.py');
  console.log(`[ML] Spawning inference service using: ${python}`);
  const child = spawn(python, [script], {
    cwd: path.join(__dirname, 'ml'),
    stdio: 'inherit',
    windowsHide: true
  });
  child.on('error', (err) => {
    console.warn('[ML] Could not start inference service:', err.message);
  });
  child.on('exit', (code, signal) => {
    if (code && code !== 0) {
      console.warn(`[ML] Inference service exited (code=${code}, signal=${signal})`);
    }
  });
  const stop = () => {
    if (!child.killed) child.kill();
  };
  process.on('exit', stop);
  process.on('SIGINT', () => {
    stop();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    stop();
    process.exit(0);
  });
  return child;
}

if (process.env.SKIP_ML_SERVER !== '1') {
  startMlService();
}

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const allowedOrigins = (process.env.CORS_ORIGINS || `http://127.0.0.1:${PORT},http://localhost:${PORT}`)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mount backend API routes directly and under /api
app.use('/api', apiRouter);
app.use('/', apiRouter);

app.use((err, _req, res, _next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request exceeds the 50 MB limit.' });
  }
  console.error('[Request Error]', err);
  return res.status(err.status || 500).json({ error: 'Request could not be processed.' });
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'frontend')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`[PhishGuard Engine] Server running on http://${HOST}:${PORT}`);
});
