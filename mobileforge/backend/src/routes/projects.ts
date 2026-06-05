import { Router, Request, Response } from 'express';
import { getFirestore, verifyIdToken } from '../services/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

async function getUserId(req: Request): Promise<string | null> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const decoded = await verifyIdToken(token);
  return decoded?.uid ?? null;
}

// GET /api/projects
router.get('/', async (req: Request, res: Response) => {
  const uid = await getUserId(req);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const db = getFirestore();
    const snap = await db
      .collection('projects')
      .where('userId', '==', uid)
      .orderBy('updatedAt', 'desc')
      .limit(50)
      .get();

    const projects = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.json(projects);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// POST /api/projects
router.post('/', async (req: Request, res: Response) => {
  const uid = await getUserId(req);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });

  const { name, description = '' } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    const db = getFirestore();
    const projectId = uuidv4();
    const now = new Date().toISOString();

    const project = {
      userId: uid,
      name,
      description,
      createdAt: now,
      updatedAt: now,
      features: [],
    };

    await db.collection('projects').doc(projectId).set(project);
    return res.status(201).json({ id: projectId, ...project });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create project' });
  }
});

// GET /api/projects/:id
router.get('/:id', async (req: Request, res: Response) => {
  const uid = await getUserId(req);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const db = getFirestore();
    const doc = await db.collection('projects').doc(req.params.id).get();

    if (!doc.exists) return res.status(404).json({ error: 'Project not found' });
    const data = doc.data()!;
    if (data.userId !== uid) return res.status(403).json({ error: 'Forbidden' });

    return res.json({ id: doc.id, ...data });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// PUT /api/projects/:id
router.put('/:id', async (req: Request, res: Response) => {
  const uid = await getUserId(req);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const db = getFirestore();
    const ref = db.collection('projects').doc(req.params.id);
    const doc = await ref.get();

    if (!doc.exists) return res.status(404).json({ error: 'Project not found' });
    if (doc.data()!.userId !== uid) return res.status(403).json({ error: 'Forbidden' });

    const { name, description } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;

    await ref.update(updates);
    return res.json({ id: req.params.id, ...doc.data(), ...updates });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const uid = await getUserId(req);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const db = getFirestore();
    const ref = db.collection('projects').doc(req.params.id);
    const doc = await ref.get();

    if (!doc.exists) return res.status(404).json({ error: 'Project not found' });
    if (doc.data()!.userId !== uid) return res.status(403).json({ error: 'Forbidden' });

    await ref.delete();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete project' });
  }
});

// GET /api/projects/:id/messages
router.get('/:id/messages', async (req: Request, res: Response) => {
  const uid = await getUserId(req);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const db = getFirestore();
    const project = await db.collection('projects').doc(req.params.id).get();
    if (!project.exists || project.data()!.userId !== uid) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const snap = await db
      .collection('conversations')
      .doc(req.params.id)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .get();

    const messages = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.json(messages);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

export default router;
