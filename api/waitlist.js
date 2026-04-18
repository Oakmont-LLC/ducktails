const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? false : { rejectUnauthorized: false },
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO waitlist (email) VALUES ($1) ON CONFLICT (email) DO NOTHING RETURNING id',
      [email]
    );

    // Notify if new signup and Resend is configured
    if (result.rows.length > 0 && process.env.RESEND_API_KEY) {
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Ducktails <notifications@ducktails.ai>',
          to: process.env.NOTIFY_EMAIL || 'joey@airfreshmarketing.com',
          subject: `New waitlist signup: ${email}`,
          text: `${email} just joined the Ducktails waitlist.`,
        }),
      }).catch(console.error);
    }

    res.json({ success: true, message: 'Added to waitlist' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
