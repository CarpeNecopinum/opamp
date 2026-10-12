-- Up Migration
ALTER TABLE "surveys" ADD COLUMN "token" uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE;

-- Down Migration
ALTER TABLE "surveys" DROP COLUMN "token";
