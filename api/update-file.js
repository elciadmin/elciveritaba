// api/update-file.js
// GitHub Pages sitene yönetim panelinden güvenli commit atmak için minimal API

export default async function handler(req, res) {
  // --- CORS: panelin çalıştığı domain ---
  res.setHeader('Access-Control-Allow-Origin', 'https://elciadmin.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Only POST allowed' });
  }

  try {
    // İstek gövdesi
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { filePath, contentBase64, commitMessage } = body;
    if (!filePath || !contentBase64) {
      return res.status(400).json({ ok: false, error: 'filePath and contentBase64 are required' });
    }

    const owner = 'elciadmin';
    const repo = 'elciveritaba';
    const branch = 'main';

    // GitHub Token (Vercel env: GH_TOKEN veya ghp_token)
    const token = process.env.GH_TOKEN || process.env.ghp_token;
    if (!token) {
      return res.status(500).json({ ok: false, error: 'Missing GH_TOKEN env on server' });
    }

    // GitHub API yardımcısı
    const gh = async (url, init = {}) => {
      const r = await fetch(`https://api.github.com${url}`, {
        ...init,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          ...(init.headers || {}),
        },
      });
      if (!r.ok) {
        const text = await r.text().catch(() => '');
        throw new Error(`GitHub ${r.status}: ${text}`);
      }
      return r.json();
    };

    // Mevcut dosyanın SHA'sını al (varsa)
    let sha;
    try {
      const info = await gh(`/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${branch}`);
      sha = info.sha;
    } catch { /* dosya yoksa yeni oluşturacağız */ }

    // Güncelle / oluştur
    const payload = {
      message: commitMessage || `Update ${filePath} from admin panel`,
      content: contentBase64, // UTF-8 içeriğin base64 hali
      branch,
      ...(sha ? { sha } : {}),
    };

    const updated = await gh(`/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    return res.status(200).json({
      ok: true,
      path: filePath,
      commit: {
        sha: updated?.commit?.sha,
        message: updated?.commit?.message,
        url: updated?.commit?.html_url,
      },
    });
  } catch (err) {
    const msg = typeof err?.message === 'string' ? err.message : String(err);
    return res.status(500).json({ ok: false, error: msg });
  }
}
