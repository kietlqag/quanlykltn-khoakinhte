import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {
    xlsx: '',
    sheetName: '',
    listSheets: false,
    collectionPrefix: '',
    keyFile: '',
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--xlsx' && argv[i + 1]) {
      args.xlsx = argv[i + 1];
      i += 1;
    } else if (arg === '--sheet-name' && argv[i + 1]) {
      args.sheetName = argv[i + 1];
      i += 1;
    } else if (arg === '--list-sheets') {
      args.listSheets = true;
    } else if (arg === '--collection-prefix' && argv[i + 1]) {
      args.collectionPrefix = argv[i + 1];
      i += 1;
    } else if (arg === '--key-file' && argv[i + 1]) {
      args.keyFile = argv[i + 1];
      i += 1;
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    }
  }

  return args;
}

function normalizeHeader(header) {
  return String(header || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
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

function normalizeRole(roleValue) {
  const role = String(roleValue || '').trim().toLowerCase();
  if (role === 'student' || role === 'sv') return 'SV';
  if (role === 'lecturer' || role === 'gv') return 'GV';
  if (role === 'tbm') return 'TBM';
  return String(roleValue || 'SV').toUpperCase();
}

function toNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseWorksheetRows(sheetName, worksheet, collectionPrefix) {
  const table = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  if (table.length === 0) return { rows: [], collectionName: null };
  const headers = table[0].map(normalizeHeader);
  const headerIndexes = Object.fromEntries(headers.map((h, idx) => [h, idx]));
  const collectionName = `${collectionPrefix}${slugify(sheetName)}`;
  const rows = [];
  for (let i = 1; i < table.length; i += 1) {
    const row = table[i];
    const rawRecord = {};
    headers.forEach((header, idx) => {
      if (!header) return;
      rawRecord[header] = String(row[idx] || '').trim();
    });

    // Skip empty rows
    const hasValue = Object.values(rawRecord).some((v) => String(v || '').trim() !== '');
    if (!hasValue) continue;

    let docId = `${slugify(sheetName)}_${i + 1}`;
    let mappedRecord = { ...rawRecord };

    if (sheetName === 'DATA') {
      const email = String(row[headerIndexes.email] || '').trim().toLowerCase();
      if (!email) continue;
      docId = slugify(email);
      const ms = String(row[headerIndexes.ms] || '').trim();
      mappedRecord = {
        email,
        ms,
        name: String(row[headerIndexes.ten] || '').trim(),
        role: normalizeRole(row[headerIndexes.role]),
        faculty: String(row[headerIndexes.khoa] || '').trim(),
        major: String(row[headerIndexes.major] || '').trim(),
        password: String(row[headerIndexes.password] || '').trim(),
        heDaoTao: String(row[headerIndexes.hedaotao] || '').trim() || null,
      };
    } else if (sheetName === 'QUOTA') {
      const email = String(row[headerIndexes.emailgv] || '').trim().toLowerCase();
      if (!email) continue;
      const dot = String(row[headerIndexes.dot] || '').trim();
      docId = slugify(`${email}_${dot || i + 1}`);
      mappedRecord = {
        emailGV: email,
        hoTen: String(row[headerIndexes.hoten] || '').trim(),
        major: String(row[headerIndexes.major] || '').trim(),
        heDaoTao: String(row[headerIndexes.hedaotao] || '').trim(),
        dot,
        maxSlot: toNumber(row[headerIndexes.maxslot]),
        usedSlot: toNumber(row[headerIndexes.usedslot]),
        available: toNumber(row[headerIndexes.available]),
        approved: ['true', '1', 'yes', 'y'].includes(
          String(row[headerIndexes.approved] || '').trim().toLowerCase(),
        ),
      };
    } else if (sheetName === 'DOT') {
      const maDot = String(row[headerIndexes.madot] || '').trim();
      const dotValue = String(row[headerIndexes.dot] || '').trim();
      const tenDot = String(row[headerIndexes.tendot] || '').trim();
      const loai = String(row[headerIndexes.loaidetai] || '').trim();
      const majorValue = String(row[headerIndexes.major] || '').trim();
      const key = maDot || dotValue || tenDot;
      if (!key) continue;
      docId = slugify(`${key}_${loai}_${majorValue}_${i + 1}`);
      const activeRaw = String(row[headerIndexes.active] || '').trim().toLowerCase();
      mappedRecord = {
        maDot: maDot || docId.toUpperCase(),
        tenDot,
        startReg: String(row[headerIndexes.startreg] || '').trim(),
        endReg: String(row[headerIndexes.endreg] || '').trim(),
        loaiDeTai: loai,
        major: majorValue,
        dot: dotValue || tenDot || maDot,
        active: ['true', '1', 'yes', 'y', 'active', 'x'].includes(activeRaw),
        startEx: String(row[headerIndexes.startex] || '').trim(),
        endEx: String(row[headerIndexes.endex] || '').trim(),
      };
    } else if (sheetName === 'TENDETAI') {
      const studentRaw = String(row[headerIndexes.studentid] || row[headerIndexes.emailsv] || '').trim();
      const type = String(row[headerIndexes.type] || row[headerIndexes.loaidetai] || '').trim().toUpperCase().includes('KLTN')
        ? 'KLTN'
        : 'BCTT';
      mappedRecord = {
        ...rawRecord,
        studentId: studentRaw,
        type,
        emailSV: studentRaw,
        loaidetai: type,
      };
    } else if (sheetName === 'TRANGTHAIDETAI') {
      const studentRaw = String(row[headerIndexes.studentid] || row[headerIndexes.emailsv] || '').trim();
      const advisorRaw = String(row[headerIndexes.advisorid] || row[headerIndexes.emailgv] || '').trim();
      const type = String(row[headerIndexes.type] || row[headerIndexes.loaidetai] || '').trim().toUpperCase().includes('KLTN')
        ? 'KLTN'
        : 'BCTT';
      mappedRecord = {
        ...rawRecord,
        studentId: studentRaw,
        advisorId: advisorRaw,
        type,
        emailSV: studentRaw,
        emailGV: advisorRaw,
        loaidetai: type,
      };
    }

    rows.push({
      collectionName,
      sheetName,
      stt: i + 1,
      docId,
      data: mappedRecord,
      importedAt: FieldValue.serverTimestamp(),
      source: 'xlsx',
    });
  }

  return { rows, collectionName };
}

function parseWorkbookRows(workbook, sheetNameArg, listSheets) {
  if (listSheets) {
    console.log('Available sheets:', workbook.SheetNames.join(', '));
  }

  const selectedSheetNames = sheetNameArg
    ? sheetNameArg
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
    : workbook.SheetNames;

  const invalidSheets = selectedSheetNames.filter((name) => !workbook.Sheets[name]);
  if (invalidSheets.length > 0) {
    throw new Error(`Sheet not found: ${invalidSheets.join(', ')}`);
  }

  const allRows = [];
  const perSheetCounts = [];
  for (const sheetName of selectedSheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const { rows } = parseWorksheetRows(sheetName, worksheet, '');
    allRows.push(...rows);
    perSheetCounts.push(`${sheetName}: ${rows.length} docs`);
  }

  console.log('Parsed rows per sheet ->', perSheetCounts.join(' | '));

  return allRows;
}

function readLocalXlsxRows(args) {
  const xlsxPath = args.xlsx
    ? path.resolve(process.cwd(), args.xlsx)
    : path.resolve(repoRoot, 'Data.xlsx');

  if (!fs.existsSync(xlsxPath)) {
    throw new Error(`XLSX file not found: ${xlsxPath}`);
  }

  const workbook = XLSX.readFile(xlsxPath);
  const rows = parseWorkbookRows(workbook, args.sheetName, args.listSheets);
  return { rows, sourceDescription: xlsxPath };
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

function isFirestoreNotFoundError(error) {
  return Number(error?.code) === 5 || String(error?.message || '').includes('NOT_FOUND');
}

async function assertFirestoreReady(db, projectId) {
  try {
    await db.listCollections();
  } catch (error) {
    if (isFirestoreNotFoundError(error)) {
      throw new Error(
        `Firestore NOT_FOUND for project "${projectId}". ` +
          'Check that serviceAccountKey belongs to the correct Firebase project and ' +
          'that Firestore Database is created (Native mode) in Firebase Console.',
      );
    }
    throw error;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = readLocalXlsxRows(args);
  const rows = result.rows.map((row) => ({
    ...row,
    collectionName: `${args.collectionPrefix || ''}${row.collectionName}`,
  }));
  const sourceDescription = result.sourceDescription;

  if (rows.length === 0) {
    throw new Error('No rows parsed from the provided source.');
  }

  if (args.dryRun) {
    console.log(`Parsed ${rows.length} rows from ${sourceDescription}`);
    console.log(rows.slice(0, 3));
    return;
  }

  const serviceAccount = getServiceAccountFromEnvOrFile(args.keyFile);
  const projectId = serviceAccount.project_id;
  if (!projectId) {
    throw new Error('Service account key is invalid: missing project_id.');
  }

  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });
  }

  const db = getFirestore();
  await assertFirestoreReady(db, projectId);
  const batchSize = 400;
  let totalWrites = 0;
  const grouped = rows.reduce((acc, row) => {
    const key = row.collectionName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  const summary = Object.entries(grouped).map(([name, docs]) => `${name}: ${docs.length}`);
  console.log('Target collections ->', summary.join(' | '));

  for (const [collectionName, docs] of Object.entries(grouped)) {
    for (let i = 0; i < docs.length; i += batchSize) {
      const chunk = docs.slice(i, i + batchSize);
      const batch = db.batch();

      for (const row of chunk) {
        const docRef = db.collection(collectionName).doc(row.docId);
        batch.set(
          docRef,
          {
            ...row.data,
            stt: row.stt,
            sheetName: row.sheetName,
            source: row.source,
            importedAt: row.importedAt,
          },
          { merge: true },
        );
        totalWrites += 1;
      }

      try {
        await batch.commit();
      } catch (error) {
        if (isFirestoreNotFoundError(error)) {
          throw new Error(
            `Firestore NOT_FOUND while writing to project "${projectId}". ` +
              'Please verify Firestore is enabled and the service account key matches this project.',
          );
        }
        throw error;
      }
    }
  }

  // Keep compatibility for login flow that reads from users collection
  if (grouped.data && grouped.data.length > 0) {
    const seenMs = new Set();
    let userBatch = db.batch();
    let count = 0;
    for (const row of grouped.data) {
      const role = String(row.data.role || '').toUpperCase();
      if (!row.data.email || !['SV', 'GV', 'TBM', 'STUDENT', 'LECTURER'].includes(role)) continue;
      const ms = String(row.data.ms || '').trim();
      if (!ms) {
        throw new Error(`Missing MS for user email=${row.data.email}`);
      }
      if (seenMs.has(ms)) {
        throw new Error(`Duplicate MS detected in DATA sheet: ${ms}`);
      }
      seenMs.add(ms);
      const userDoc = db.collection('users').doc(ms);
      userBatch.set(
        userDoc,
        {
          email: String(row.data.email).toLowerCase(),
          ms,
          name: row.data.name || '',
          role: normalizeRole(role),
          faculty: row.data.faculty || '',
          major: row.data.major || '',
          password: row.data.password || '',
          heDaoTao: row.data.heDaoTao || null,
          source: 'sync-from-data',
          syncedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      count += 1;
      if (count % batchSize === 0) {
        await userBatch.commit();
        userBatch = db.batch();
      }
    }
    if (count % batchSize !== 0) {
      await userBatch.commit();
    }
    console.log(`Synced ${count} user docs into "users" collection.`);
  }

  await db
    .collection('system_config')
    .doc('workflow')
    .set(
      {
        importedFrom: sourceDescription,
        collections: Object.keys(grouped),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  console.log(`Imported ${totalWrites} documents from workbook.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
