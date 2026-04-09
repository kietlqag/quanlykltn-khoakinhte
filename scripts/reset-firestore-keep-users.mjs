import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const KEEP_COLLECTIONS = new Set(['users']);

function getServiceAccount() {
  const envJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (envJson) return JSON.parse(envJson);

  const keyPath = path.resolve(repoRoot, 'secrets', 'serviceAccountKey.json');
  if (!fs.existsSync(keyPath)) {
    throw new Error(`Missing service account key at ${keyPath}`);
  }
  return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
}

async function deleteCollection(db, collectionName) {
  let totalDeleted = 0;
  while (true) {
    const snap = await db.collection(collectionName).limit(400).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    totalDeleted += snap.size;
  }
  return totalDeleted;
}

async function main() {
  const serviceAccount = getServiceAccount();
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  }

  const db = getFirestore();
  const collections = await db.listCollections();
  const targets = collections
    .map((c) => c.id)
    .filter((name) => !KEEP_COLLECTIONS.has(name));

  if (targets.length === 0) {
    console.log('No collections to reset.');
    return;
  }

  console.log(`Keeping collections: ${Array.from(KEEP_COLLECTIONS).join(', ')}`);
  console.log(`Resetting collections: ${targets.join(', ')}`);

  for (const name of targets) {
    const deleted = await deleteCollection(db, name);
    console.log(`Deleted ${deleted} docs from "${name}"`);
  }

  console.log('Firestore reset completed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
