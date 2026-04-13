import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function parseArgs(argv) {
  return {
    apply: argv.includes('--apply'),
    keyFile: (() => {
      const idx = argv.indexOf('--key-file');
      return idx >= 0 && argv[idx + 1] ? argv[idx + 1] : '';
    })(),
  };
}

function getServiceAccountFromEnvOrFile(keyFilePathArg) {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) return JSON.parse(json);

  const keyFilePath = keyFilePathArg
    ? path.resolve(process.cwd(), keyFilePathArg)
    : path.resolve(repoRoot, 'secrets', 'serviceAccountKey.json');

  if (!fs.existsSync(keyFilePath)) {
    throw new Error(
      `Missing Firebase key. Provide FIREBASE_SERVICE_ACCOUNT_JSON or create file: ${keyFilePath}`,
    );
  }
  return JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
}

function remapKeyedObject(record, idMap) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return record;
  const entries = Object.entries(record);
  let changed = false;
  const mapped = {};
  for (const [k, v] of entries) {
    const nk = idMap.get(k) || k;
    if (nk !== k) changed = true;
    mapped[nk] = v;
  }
  return changed ? mapped : record;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const serviceAccount = getServiceAccountFromEnvOrFile(args.keyFile);
  if (!serviceAccount.project_id) {
    throw new Error('Service account key is invalid: missing project_id.');
  }
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  }

  const db = getFirestore();

  const usersSnap = await db.collection('users').get();
  const idMap = new Map();
  const msSet = new Set();
  const missingMs = [];
  const duplicateMs = [];
  let moveCount = 0;

  for (const doc of usersSnap.docs) {
    const data = doc.data();
    const ms = String(data.ms ?? data.MS ?? '').trim();
    if (!ms) {
      missingMs.push(doc.id);
      continue;
    }
    if (msSet.has(ms)) {
      duplicateMs.push(ms);
      continue;
    }
    msSet.add(ms);
    idMap.set(doc.id, ms);
    if (doc.id !== ms) moveCount += 1;
  }

  if (missingMs.length > 0) {
    throw new Error(`Found ${missingMs.length} users without ms: ${missingMs.slice(0, 20).join(', ')}`);
  }
  if (duplicateMs.length > 0) {
    throw new Error(`Found duplicate ms values: ${duplicateMs.slice(0, 20).join(', ')}`);
  }

  const regSnap = await db.collection('thesis_registrations').get();
  let regUpdateCount = 0;
  for (const d of regSnap.docs) {
    const data = d.data();
    const next = {};
    let changed = false;

    for (const field of ['studentId', 'advisorId', 'reviewerId']) {
      const oldVal = String(data[field] || '').trim();
      if (!oldVal) continue;
      const mapped = idMap.get(oldVal);
      if (mapped && mapped !== oldVal) {
        next[field] = mapped;
        changed = true;
      }
    }

    const cmScores = remapKeyedObject(data.councilMemberScores, idMap);
    if (cmScores !== data.councilMemberScores) {
      next.councilMemberScores = cmScores;
      changed = true;
    }

    const cmCriteria = remapKeyedObject(data.councilMemberCriteriaScores, idMap);
    if (cmCriteria !== data.councilMemberCriteriaScores) {
      next.councilMemberCriteriaScores = cmCriteria;
      changed = true;
    }

    const cmComments = remapKeyedObject(data.councilMemberComments, idMap);
    if (cmComments !== data.councilMemberComments) {
      next.councilMemberComments = cmComments;
      changed = true;
    }

    if (changed) {
      regUpdateCount += 1;
      if (args.apply) {
        await d.ref.set(
          {
            ...next,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }
    }
  }

  const councilsSnap = await db.collection('councils').get();
  let councilUpdateCount = 0;
  for (const d of councilsSnap.docs) {
    const data = d.data();
    const next = {};
    let changed = false;

    for (const field of ['chairmanId', 'secretaryId']) {
      const oldVal = String(data[field] || '').trim();
      if (!oldVal) continue;
      const mapped = idMap.get(oldVal);
      if (mapped && mapped !== oldVal) {
        next[field] = mapped;
        changed = true;
      }
    }

    if (Array.isArray(data.members)) {
      const members = data.members.map((v) => {
        const oldVal = String(v || '').trim();
        return idMap.get(oldVal) || oldVal;
      });
      const same = members.length === data.members.length && members.every((v, i) => v === data.members[i]);
      if (!same) {
        next.members = members;
        changed = true;
      }
    }

    if (changed) {
      councilUpdateCount += 1;
      if (args.apply) {
        await d.ref.set(
          {
            ...next,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }
    }
  }

  let userUpsertCount = 0;
  let userDeleteCount = 0;
  for (const d of usersSnap.docs) {
    const data = d.data();
    const ms = idMap.get(d.id);
    if (!ms) continue;

    if (args.apply) {
      await db.collection('users').doc(ms).set(
        {
          ...data,
          ms,
          migratedFromUserId: d.id !== ms ? d.id : FieldValue.delete(),
          migratedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }
    userUpsertCount += 1;

    if (d.id !== ms) {
      if (args.apply) {
        await d.ref.delete();
      }
      userDeleteCount += 1;
    }
  }

  const summary = {
    mode: args.apply ? 'apply' : 'dry-run',
    usersTotal: usersSnap.size,
    usersNeedMove: moveCount,
    usersUpsert: userUpsertCount,
    usersDeleteOldId: userDeleteCount,
    thesisRegistrationsUpdate: regUpdateCount,
    councilsUpdate: councilUpdateCount,
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

