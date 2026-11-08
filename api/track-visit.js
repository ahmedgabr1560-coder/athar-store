module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = process.env.REPO_OWNER || 'ahmedgabr1560-coder';
    const REPO_NAME = process.env.REPO_NAME || 'athar-store';
    const FILE_PATH = 'data/visits.json';

    if (!GITHUB_TOKEN) {
      return res.status(200).json({ success: true, localOnly: true });
    }

    const getUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const headers = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'ATHAR-Store'
    };

    let data = { total: 0, today: 0, todayDate: '', history: [] };
    let sha = null;
    const getRes = await fetch(getUrl, { headers });
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
      try {
        data = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf8'));
      } catch {}
    }

    const today = new Date().toISOString().slice(0, 10);
    if (data.todayDate !== today) {
      if (data.todayDate && data.today > 0) {
        data.history = data.history || [];
        data.history.unshift({ date: data.todayDate, count: data.today });
        if (data.history.length > 30) data.history = data.history.slice(0, 30);
      }
      data.today = 0;
      data.todayDate = today;
    }
    data.total = (data.total || 0) + 1;
    data.today = (data.today || 0) + 1;

    const content = Buffer.from(JSON.stringify(data, null, 2), 'utf8').toString('base64');
    const putRes = await fetch(getUrl, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Visit ${today} (#${data.total})`,
        content,
        branch: 'main',
        ...(sha ? { sha } : {})
      })
    });

    if (!putRes.ok) {
      return res.status(200).json({ success: false });
    }
    return res.status(200).json({ success: true, total: data.total, today: data.today });
  } catch (err) {
    return res.status(200).json({ success: false });
  }
};
