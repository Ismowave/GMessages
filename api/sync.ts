export default function handler(
  req: {
    method?: string;
    body?: {
      clientId?: string;
      changes?: Array<{ id?: string; type?: string }>;
    };
  },
  res: {
    status: (code: number) => { json: (data: unknown) => void };
    setHeader: (name: string, value: string) => void;
  },
) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    res.status(200).json({
      ok: true,
      serverTime: Date.now(),
      status: 'online',
    });
    return;
  }

  if (req.method === 'POST') {
    const changes = Array.isArray(req.body?.changes) ? req.body.changes : [];
    res.status(200).json({
      ok: true,
      syncedCount: changes.length,
      syncedIds: changes.map((c) => c.id).filter(Boolean),
      serverTime: Date.now(),
    });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
