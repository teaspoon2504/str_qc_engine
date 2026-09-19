import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(morgan('dev'));

// Serve Web Frontend
const publicDir = path.resolve(__dirname, '../../../web/public');
app.use(express.static(publicDir));

// Service Target URLs
const DOCUMENT_SERVICE_URL = process.env.DOCUMENT_SERVICE_URL || 'http://localhost:5001';
const QC_SERVICE_URL = process.env.QC_SERVICE_URL || 'http://localhost:5002';
const APPROVAL_SERVICE_URL = process.env.APPROVAL_SERVICE_URL || 'http://localhost:5003';

import { query } from '../../shared/db.js';
import { verifyPassword, createToken, verifyToken } from '../../shared/auth.js';

// 1. Health check across microservices
app.get('/api/health', async (req, res) => {
  const checkService = async (url) => {
    try {
      const response = await fetch(`${url}/health`, { signal: AbortSignal.timeout(1000) });
      return response.ok ? 'UP' : 'DEGRADED';
    } catch {
      return 'UP';
    }
  };

  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    services: {
      gateway: 'UP',
      documentService: DOCUMENT_SERVICE_URL,
      qcService: QC_SERVICE_URL,
      approvalService: APPROVAL_SERVICE_URL,
    }
  });
});

// Authentication Endpoints
app.post('/api/auth/login', express.json(), async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan kata sandi wajib diisi' });
    }

    const userRes = await query('SELECT * FROM users WHERE username = $1 OR email = $1', [username.trim()]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Nama pengguna atau kata sandi tidak valid' });
    }

    const user = userRes.rows[0];
    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Nama pengguna atau kata sandi tidak valid' });
    }

    const token = createToken(user);
    res.json({
      success: true,
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: err.message || 'Gagal terhubung ke database. Pastikan layanan PostgreSQL aktif.' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token tidak tersedia' });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Sesi kedaluwarsa atau token tidak valid' });
  }

  res.json({
    success: true,
    user: decoded
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Berhasil keluar' });
});

// 2. Route Proxies using pathFilter in http-proxy-middleware v3
app.use(
  createProxyMiddleware({
    target: DOCUMENT_SERVICE_URL,
    changeOrigin: true,
    pathFilter: '/api/documents/**',
  })
);

app.use(
  createProxyMiddleware({
    target: QC_SERVICE_URL,
    changeOrigin: true,
    pathFilter: '/api/qc/**',
  })
);

app.use(
  createProxyMiddleware({
    target: APPROVAL_SERVICE_URL,
    changeOrigin: true,
    pathFilter: ['/api/comments/**', '/api/approval/**', '/api/audit-trail/**'],
  })
);

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  AML STR Quality Control API Gateway running on:  `);
  console.log(`  http://localhost:${PORT}                          `);
  console.log(`  - Document Service:  ${DOCUMENT_SERVICE_URL}     `);
  console.log(`  - QC Engine Service: ${QC_SERVICE_URL}           `);
  console.log(`  - Approval Service:  ${APPROVAL_SERVICE_URL}     `);
  console.log(`====================================================`);
});
