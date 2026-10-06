-- Up Migration
CREATE TABLE "notes" (
  "id" bigserial PRIMARY KEY,
  "title" text NOT NULL,
  "body" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "notes_created_at_index" ON "notes" ("created_at");

-- Down Migration
DROP INDEX "notes_created_at_index";
DROP TABLE "notes";
