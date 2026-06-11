# Media Module

Central asset store. One upload → one `media` row + webp variants (thumb/medium/large). Storage is abstracted behind a swappable driver.

## Responsibilities

- Validated multipart upload (mime whitelist + 5MB + dimension cap + sharp magic-byte check).
- Process with **sharp**: auto-orient, strip EXIF, emit webp variants.
- Store via `StorageDriver` (S3 prod / local dev), persist metadata + variants.
- `assertReady(id)` for consumers; guarded delete (storage + DB).

## Key files

- `storage/storage.interface.ts` — `StorageDriver` + `STORAGE_DRIVER` token.
- `storage/{s3,local}.driver.ts` — drivers; chosen in `media.module.ts` by `storage.driver` config.
- `services/image-processor.service.ts` — sharp pipeline (THUMB 150 / MEDIUM 600 / LARGE 1200, all webp q82).
- `services/media.service.ts` — upload orchestration, `assertReady`, delete.
- `entities/{media,media-variant}.entity.ts` — `variants` is eager + cascade.

## Conventions / gotchas

- **Local dev:** files written under `storage.localDir` (default `uploads/`), served at `/uploads/...` (see `main.ts` `useStaticAssets`). Set `STORAGE_DRIVER=s3` + S3 env for prod.
- Upload creates a `PROCESSING` row first (need id for storage keys), then processes → `READY`; on failure → `FAILED` + storage cleanup.
- Multer uses **memory storage** (default) → `file.buffer` available to sharp.
- **`product_media` gallery is NOT here** — created in the Product module (m10) since it FKs `products`. Consumer columns (`avatarMediaId`/`logoMediaId`/`imageMediaId`) get their FK to `media` added in each consumer's own migration (media table already exists by then).
- Delete relies on FK: SET-NULL consumers null out; RESTRICT (product_media) → 409.

## Endpoints

- `POST /media` (`media.manage`, multipart `file` + `altText`), `GET /media/:id` (public), `PATCH/DELETE /media/:id` (`media.manage`).

## Dependencies

- Depends on: storage (S3/local), sharp, Auth (guards).
- Depended on by: Product (gallery + image), Brand (logo), Category (image), SKU (image), User (avatar).
