# Firebase schema + full workflow

## 1) Collection mapping from `Data.xlsx`

- `DATA` -> `data` (raw users) + synced into `users` for login
- `DOT` -> `dot`
- `DANH_MUC_NGANH` -> `danh_muc_nganh`
- `TRANGTHAIDETAI` -> `trangthaidetai`
- `BB GVHD_BCTT` -> `bb_gvhd_bctt`
- `BB GVPB_BCTT` -> `bb_gvpb_bctt`
- `BB GVHD_KLTN` -> `bb_gvhd_kltn`
- `BB GVPB_KLTN` -> `bb_gvpb_kltn`
- `DIEM` -> `diem`
- `DIEMHOIDONG` -> `diemhoidong`
- `TENDETAI` -> `tendetai`
- `BIENBAN` -> `bienban`
- `QUOTA` -> `quota`
- `MAJOR` -> `major`
- `Detaigoiy` -> `detaigoiy`

All docs are imported with metadata:
- `stt`
- `sheetName`
- `source = "xlsx"`
- `importedAt`

## 2) Current login dependency

The app login is reading from `users` collection with fields:
- `email`
- `name`
- `role` (`SV`, `GV`, `TBM`)
- `faculty`
- `major`
- `password`
- `heDaoTao`

Importer auto-syncs users from `data` -> `users`.

## 3) End-to-end workflow implementation (business)

### Student (SV)

1. Login by email/password.
2. Read profile + role from `users`.
3. Register BCTT:
   - Create record in `tendetai` with `loaidetai=BCTT`.
   - Check `quota` of selected GV and decrement `available`, increment `usedSlot`.
   - Insert/Update `trangthaidetai` as `pending`.
4. Track progress from `trangthaidetai`.
5. Upload BCTT files:
   - `linkbai` and `linkxacnhan` in `tendetai`.
6. If BCTT completed (`trangthaidetai` pass), allow KLTN registration.
7. Register KLTN:
   - Create/Update `tendetai` with `loaidetai=KLTN`.
   - Keep advisor default from BCTT if available.
8. Upload KLTN file at deadline.
9. After defense, upload revised KLTN.
10. Track final score + minutes + approval status:
   - `diem`, `diemhoidong`, `bienban`, `trangthaidetai`.

### Lecturer (GV)

1. Read assigned students from:
   - `trangthaidetai` (EmailSV/EmailGV mapping)
   - `tendetai` (title/file links)
2. Bulk approve/reject guidance:
   - Update `trangthaidetai.trangthaiduyet`.
3. At submission time:
   - View student file (`tendetai.linkbai`)
   - Upload Turnitin link (store in `trangthaidetai` or dedicated field)
   - Enter score in `diem`.
4. Reviewer role:
   - Input comments/questions and scores (`diem`, notes in `trangthaidetai`).
5. Council role:
   - Score in `diemhoidong`.
6. Chairman:
   - Approve revision only after GVHD approval (`GVHD_OK` then `CTHD_OK`).
7. Secretary:
   - Compile `bienban` from scores + comments + student info.

### TBM

1. Approve lecturer quota per period (`quota.approved`).
2. Assign reviewer and council via `trangthaidetai` mapping fields.
3. Manage council schedule/date/location.
4. Statistics page:
   - Aggregate scores from `diem`, `diemhoidong`.
   - Show revision approval statuses (`GVHD_OK`, `CTHD_OK`).

## 4) Commands to import

### List sheets

```bash
npm run import:sheet -- --xlsx "C:\truc_project\Data.xlsx" --list-sheets --dry-run
```

### Import all sheets

```bash
npm run import:sheet -- --xlsx "C:\truc_project\Data.xlsx"
```

### Import selected sheets

```bash
npm run import:sheet -- --xlsx "C:\truc_project\Data.xlsx" --sheet-name "DATA,QUOTA,DOT,TENDETAI,TRANGTHAIDETAI"
```

### Namespace collections by prefix

```bash
npm run import:sheet -- --xlsx "C:\truc_project\Data.xlsx" --collection-prefix "prod_"
```

## 5) Gaps to finish for production

- Move auth to Firebase Auth (do not keep plaintext password in Firestore).
- Replace mock localStorage business actions by Firestore read/write.
- Store uploaded files in Firebase Storage and save file URLs into Firestore.
- Add Cloud Functions for:
  - quota decrement atomically
  - role-based workflow transitions
  - final score aggregation
- Tighten Firestore rules with custom claims and document-level ownership checks.
