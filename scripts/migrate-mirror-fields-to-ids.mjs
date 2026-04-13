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

function mapType(rawValue) {
  const raw = String(rawValue || '').trim().toUpperCase();
  return raw.includes('KLTN') ? 'KLTN' : 'BCTT';
}

function slugify(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
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

  const emailToUserId = new Map();
  const slugEmailToUserId = new Map();
  const userIds = new Set();
  for (const d of usersSnap.docs) {
    userIds.add(d.id);
    const email = String(d.data().email || '').trim().toLowerCase();
    if (email) {
      emailToUserId.set(email, d.id);
      slugEmailToUserId.set(slugify(email), d.id);
    }
  }

  const resolveUserId = (rawValue) => {
    const raw = String(rawValue || '').trim();
    if (!raw) return '';
    const lower = raw.toLowerCase();
    if (emailToUserId.has(lower)) return emailToUserId.get(lower);
    if (slugEmailToUserId.has(lower)) return slugEmailToUserId.get(lower);
    if (userIds.has(raw)) return raw;
    return raw;
  };

  const migrateCollection = async (collectionName, mapper) => {
    const snap = await db.collection(collectionName).get();
    let updateCount = 0;

    for (const d of snap.docs) {
      const updates = mapper(d.data());
      if (!updates) continue;
      updateCount += 1;
      if (args.apply) {
        await d.ref.set(
          {
            ...updates,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }
    }
    return { total: snap.size, updated: updateCount };
  };

  const tendetaiResult = await migrateCollection('tendetai', (data) => {
    const studentId = resolveUserId(data.studentId ?? data.emailSV ?? data.emailsv);
    const type = mapType(data.type ?? data.loaiDeTai ?? data.loaidetai);
    if (!studentId) return null;

    const currentStudentId = String(data.studentId || '').trim();
    const currentType = String(data.type || '').trim().toUpperCase();
    const legacyStudent = String(data.emailSV ?? data.emailsv ?? '').trim();
    const legacyType = String(data.loaidetai ?? '').trim().toUpperCase();

    const changed =
      currentStudentId !== studentId ||
      currentType !== type ||
      legacyStudent !== studentId ||
      legacyType !== type;

    if (!changed) return null;
    return {
      studentId,
      type,
      // Keep legacy keys synchronized for transition safety.
      emailSV: studentId,
      loaidetai: type,
    };
  });

  const trangThaiResult = await migrateCollection('trangthaidetai', (data) => {
    const studentId = resolveUserId(data.studentId ?? data.emailSV ?? data.emailsv);
    const advisorId = resolveUserId(data.advisorId ?? data.emailGV ?? data.emailgv);
    const type = mapType(data.type ?? data.loaiDeTai ?? data.loaidetai);
    if (!studentId) return null;

    const currentStudentId = String(data.studentId || '').trim();
    const currentAdvisorId = String(data.advisorId || '').trim();
    const currentType = String(data.type || '').trim().toUpperCase();
    const legacyStudent = String(data.emailSV ?? data.emailsv ?? '').trim();
    const legacyAdvisor = String(data.emailGV ?? data.emailgv ?? '').trim();
    const legacyType = String(data.loaidetai ?? '').trim().toUpperCase();

    const changed =
      currentStudentId !== studentId ||
      currentAdvisorId !== advisorId ||
      currentType !== type ||
      legacyStudent !== studentId ||
      legacyAdvisor !== advisorId ||
      legacyType !== type;

    if (!changed) return null;
    return {
      studentId,
      advisorId,
      type,
      // Keep legacy keys synchronized for transition safety.
      emailSV: studentId,
      emailGV: advisorId,
      loaidetai: type,
    };
  });

  console.log(
    JSON.stringify(
      {
        mode: args.apply ? 'apply' : 'dry-run',
        tendetai: tendetaiResult,
        trangthaidetai: trangThaiResult,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
