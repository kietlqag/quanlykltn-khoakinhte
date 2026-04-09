import path from 'node:path';
import process from 'node:process';
import XLSX from 'xlsx';

const DYNAMIC_WORKFLOW_SHEETS = new Set([
  'TRANGTHAIDETAI',
  'DIEM',
  'TENDETAI',
  'BIENBAN',
  'DIEMHOIDONG',
]);

function isRowEmpty(row) {
  return row.every((cell) => String(cell ?? '').trim() === '');
}

function cleanSheetRows(rows) {
  if (!rows || rows.length === 0) return [];
  const header = rows[0].map((h) => String(h ?? '').trim());
  const dataRows = rows
    .slice(1)
    .map((row) => row.map((cell) => String(cell ?? '').trim()))
    .filter((row) => !isRowEmpty(row));
  return [header, ...dataRows];
}

function dedupeByKeys(rows, keyIndexes) {
  if (rows.length <= 1) return rows;
  const [header, ...dataRows] = rows;
  const seen = new Set();
  const filtered = [];
  for (const row of dataRows) {
    const key = keyIndexes.map((idx) => row[idx] || '').join('||');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    filtered.push(row);
  }
  return [header, ...filtered];
}

function main() {
  const inputPath = process.argv[2] || 'Data.xlsx';
  const outputPath = process.argv[3] || 'Data.clean.xlsx';
  const mode = (process.argv[4] || 'clean').toLowerCase(); // clean | test
  const isTestMode = mode === 'test';

  const workbook = XLSX.readFile(path.resolve(process.cwd(), inputPath));
  const outWb = XLSX.utils.book_new();

  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    let cleaned = cleanSheetRows(rows);

    if (isTestMode && DYNAMIC_WORKFLOW_SHEETS.has(sheetName)) {
      const headerOnly = cleaned.length > 0 ? [cleaned[0]] : [];
      const outWs = XLSX.utils.aoa_to_sheet(headerOnly);
      XLSX.utils.book_append_sheet(outWb, outWs, sheetName);
      continue;
    }

    // Light dedupe on frequently duplicated sheets
    if (sheetName === 'DOT') {
      // Ma Dot, Loaidetai, Major
      cleaned = dedupeByKeys(cleaned, [0, 4, 5]);
    } else if (sheetName === 'DATA') {
      // Email unique
      cleaned = dedupeByKeys(cleaned, [0]);
    } else if (sheetName === 'QUOTA') {
      // Email GV + Major + HeDaoTao
      cleaned = dedupeByKeys(cleaned, [0, 2, 3]);
    }

    const outWs = XLSX.utils.aoa_to_sheet(cleaned);
    XLSX.utils.book_append_sheet(outWb, outWs, sheetName);
  }

  XLSX.writeFile(outWb, path.resolve(process.cwd(), outputPath));
  console.log(`Created workbook: ${outputPath} (mode=${mode})`);
}

main();
