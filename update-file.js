export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Only POST allowed' });
  }

  try {
    const { filePath, contentBase64, commitMessage } = req.body;
    if (!filePath || !contentBase64) {
      return res.status(400).json({ ok: false, error: 'filePath and contentBase64 required' });
    }

    const owner = 'elciadmin';
    const repo = 'elciveritaba';
    const branch = 'main';
    const token = process.env.GH_TOKEN; // Vercel'de Environment Variables'ta eklediğin token

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
        const t = await r.text();
        throw new Error(`GitHub ${r.status}: ${t}`);
      }
      return r.json();
    };

    // 1) Dosyanın mevcut SHA'sını al
    let sha;
    try {
      const info = await gh(`/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${branch}`);
      sha = info.sha;
    } catch (_) {
      // dosya yoksa sha boş kalır
    }

    // 2) Dosyayı güncelle veya oluştur
    const payload = {
      message: commitMessage || `Update ${filePath} from admin panel`,
      content: contentBase64,
      branch,
      ...(sha ? { sha } : {}),
    };

    const updated = await gh(`/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    return res.status(200).json({ ok: true, content: updated.content, commit: updated.commit });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
