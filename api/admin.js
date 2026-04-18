const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? false : { rejectUnauthorized: false },
});

const ADMIN_KEY = process.env.ADMIN_KEY || 'dk_admin_ducktails_2026';

module.exports = async (req, res) => {
  if (req.query.key !== ADMIN_KEY) {
    return res.status(401).send('Unauthorized. Add ?key=YOUR_ADMIN_KEY');
  }

  try {
    const result = await pool.query('SELECT id, email, created_at FROM waitlist ORDER BY created_at DESC');
    const count = result.rows.length;
    const rows = result.rows.map(r =>
      `<tr><td>${r.id}</td><td>${r.email}</td><td>${new Date(r.created_at).toLocaleString()}</td></tr>`
    ).join('');

    res.send(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Ducktails Admin</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'SF Mono',Menlo,monospace;background:#0d0d0c;color:#f8f5ed;padding:32px}
        h1{font-size:20px;margin-bottom:4px;color:#ff5a1f}
        .count{font-size:14px;color:#8a8679;margin-bottom:24px}
        table{width:100%;border-collapse:collapse;font-size:13px}
        th{text-align:left;padding:10px 12px;border-bottom:2px solid #2e2c27;color:#ff5a1f;text-transform:uppercase;font-size:10px;letter-spacing:0.1em}
        td{padding:10px 12px;border-bottom:1px solid #1c1b18}
        tr:hover td{background:#1c1b18}
        .empty{color:#8a8679;padding:40px;text-align:center}
      </style></head><body>
      <h1>Ducktails Waitlist</h1>
      <p class="count">${count} signup${count !== 1 ? 's' : ''}</p>
      <table><thead><tr><th>#</th><th>Email</th><th>Signed up</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="3" class="empty">No signups yet</td></tr>'}</tbody></table>
    </body></html>`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};
