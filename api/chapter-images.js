export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const topic = req.query?.topic || req.body?.topic;
  if (!topic) {
    res.status(400).json({ error: 'topic query param required' });
    return;
  }

  try {
    const searchRes = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(topic + ' diagram education')}&gsrlimit=8&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=800&format=json&origin=*`
    );
    const data = await searchRes.json();
    const pages = data.query?.pages || {};
    const images = Object.values(pages)
      .map((p) => ({
        url: p.imageinfo?.[0]?.thumburl || p.imageinfo?.[0]?.url,
        caption: p.title?.replace('File:', '').replace(/_/g, ' ') || topic,
        license: p.imageinfo?.[0]?.extmetadata?.LicenseShortName?.value || 'Wikimedia Commons',
      }))
      .filter((img) => img.url && !img.url.includes('1px'))
      .slice(0, 6);

    res.status(200).json({ images });
  } catch (error) {
    console.error('Chapter images error:', error.message);
    res.status(200).json({ images: [] });
  }
}
