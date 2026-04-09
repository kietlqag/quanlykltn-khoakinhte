
  # Student Project Registration System

  This is a code bundle for Student Project Registration System. The original project is available at https://www.figma.com/design/iePiLifkSpMCmHp7vSYDw8/Student-Project-Registration-System.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Deploy on Vercel

  1. Import this repo into Vercel.
  2. In **Project Settings > Environment Variables**, add these variables for Production (and Preview if needed):
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
  3. Redeploy after adding env vars.

  Notes:
  - This project uses Vite, so client env vars must start with `VITE_`.
  - `vercel.json` already includes SPA rewrites so React Router routes work when refreshing direct URLs.

  ## Import Data.xlsx to Firestore

  1. Create a Firebase service account key (JSON) from Firebase Console.
  2. Save key file to `secrets/serviceAccountKey.json`.
  3. Place workbook in project root as `Data.xlsx`.
  4. Run import script (imports all sheets to Firestore collections):
     - `npm run import:sheet -- --xlsx "C:\truc_project\Data.xlsx"`
  4. Optional:
     - Add `--dry-run` to preview parsed rows without writing.
     - Add `--key-file "C:\path\to\serviceAccountKey.json"` to use a custom key path.
     - Import from local workbook (default `Data.xlsx`): `npm run import:sheet`
     - Import a specific tab only: `npm run import:sheet -- --sheet-name "DATA"`
     - Import multiple tabs: `npm run import:sheet -- --sheet-name "DATA,QUOTA,DOT"`
     - List all tab names: `npm run import:sheet -- --xlsx "C:\truc_project\Data.xlsx" --list-sheets --dry-run`
     - Prefix target collections (for staging/prod split): `--collection-prefix "stg_"`
  