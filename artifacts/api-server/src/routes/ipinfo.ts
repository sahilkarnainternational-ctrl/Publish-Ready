import { Router } from "express";

const router = Router();

router.get('/ipinfo', async (req, res) => {
  try {
    const r = await fetch('https://ipapi.co/json/');
    if (!r.ok) {
      res.status(502).json({ error: 'upstream_failed' });
      return;
    }
    const json = await r.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(json);
  } catch (err) {
    res.status(502).json({ error: 'network_error' });
  }
});

export default router;
