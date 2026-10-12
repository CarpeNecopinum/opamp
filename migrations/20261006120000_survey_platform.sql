-- Up Migration

-- Remove the bootstrap demo table
DROP TABLE IF EXISTS "notes";

CREATE TYPE "user_role" AS ENUM ('root', 'survey');
CREATE TYPE "question_type" AS ENUM ('agree_rating', 'free_text');

CREATE TABLE "users" (
  "id" bigserial PRIMARY KEY,
  "username" text NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "role" user_role NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "sessions" (
  "token_hash" text PRIMARY KEY,
  "user_id" bigint NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "sessions_user_id_index" ON "sessions" ("user_id");
CREATE INDEX "sessions_expires_at_index" ON "sessions" ("expires_at");

CREATE TABLE "surveys" (
  "id" bigserial PRIMARY KEY,
  "title" text NOT NULL,
  "description" text,
  "created_by" bigint NOT NULL REFERENCES "users"("id"),
  "starts_at" timestamptz NOT NULL,
  "ends_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "surveys_window_check" CHECK ("ends_at" > "starts_at")
);

CREATE INDEX "surveys_created_by_index" ON "surveys" ("created_by");
CREATE INDEX "surveys_ends_at_index" ON "surveys" ("ends_at");

CREATE TABLE "questions" (
  "id" bigserial PRIMARY KEY,
  "survey_id" bigint NOT NULL REFERENCES "surveys"("id") ON DELETE CASCADE,
  "type" question_type NOT NULL,
  "prompt" text NOT NULL,
  "position" integer NOT NULL,
  "required" boolean NOT NULL DEFAULT true
);

CREATE INDEX "questions_survey_id_index" ON "questions" ("survey_id");

CREATE TABLE "responses" (
  "id" bigserial PRIMARY KEY,
  "survey_id" bigint NOT NULL REFERENCES "surveys"("id") ON DELETE CASCADE,
  "submitted_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "responses_survey_id_index" ON "responses" ("survey_id");

CREATE TABLE "answers" (
  "id" bigserial PRIMARY KEY,
  "response_id" bigint NOT NULL REFERENCES "responses"("id") ON DELETE CASCADE,
  "question_id" bigint NOT NULL REFERENCES "questions"("id") ON DELETE CASCADE,
  "rating_value" smallint,
  "text_value" text,
  CONSTRAINT "answers_rating_value_check" CHECK ("rating_value" IS NULL OR "rating_value" BETWEEN 1 AND 10),
  CONSTRAINT "answers_exactly_one_value_check" CHECK (
    ("rating_value" IS NULL AND "text_value" IS NOT NULL)
    OR ("text_value" IS NULL AND "rating_value" IS NOT NULL)
  )
);

CREATE INDEX "answers_response_id_index" ON "answers" ("response_id");
CREATE INDEX "answers_question_id_index" ON "answers" ("question_id");

-- Down Migration
DROP TABLE "answers";
DROP TABLE "responses";
DROP TABLE "questions";
DROP TABLE "surveys";
DROP TABLE "sessions";
DROP TABLE "users";
DROP TYPE "question_type";
DROP TYPE "user_role";
CREATE TABLE "notes" (
  "id" bigserial PRIMARY KEY,
  "title" text NOT NULL,
  "body" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "notes_created_at_index" ON "notes" ("created_at");
