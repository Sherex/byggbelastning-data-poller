/* The diagram can be found here: https://dbdiagram.io/d/5f4a96be88d052352cb544f3 */
CREATE TABLE "location" (
  "id" UUID PRIMARY KEY,
  "name" TEXT UNIQUE NOT NULL
);

CREATE TABLE "building" (
  "id" UUID PRIMARY KEY,
  "name" TEXT UNIQUE NOT NULL,
  "location_id" UUID NOT NULL
);

CREATE TABLE "floor" (
  "id" UUID PRIMARY KEY,
  "name" TEXT UNIQUE NOT NULL,
  "building_id" UUID NOT NULL
);

CREATE TABLE "client_count" (
  "id" UUID PRIMARY KEY,
  "time" TIMESTAMPTZ NOT NULL,
  "floor_id" UUID NOT NULL,
  "authCount" INTEGER,
  "assoCount" INTEGER,
  UNIQUE(time, floor_id)
);

CREATE TABLE "client_coordinate" (
  "id" UUID PRIMARY KEY,
  "time" TIMESTAMPTZ NOT NULL,
  "floor_id" UUID NOT NULL,
  "cid" TEXT NOT NULL,
  "x" "NUMERIC(10, 4)" NOT NULL,
  "y" "NUMERIC(10, 4)" NOT NULL,
  UNIQUE (time, floor_id, cid, x, y)
);

CREATE TABLE "floor_image" (
  "id" UUID PRIMARY KEY,
  "time" TIMESTAMPTZ NOT NULL,
  "floor_id" UUID NOT NULL,
  "imageBase64" TEXT,
  "imageLength" "NUMERIC(10, 6)",
  "imageWidth" "NUMERIC(10, 6)",
  "imageOffsetX" "NUMERIC(10, 6)",
  "imageOffsetY" "NUMERIC(10, 6)"
);

SELECT create_hypertable('client_count', 'time', if_not_exists => TRUE);

SELECT create_hypertable('client_coordinate', 'time', if_not_exists => TRUE);

ALTER TABLE "building" ADD FOREIGN KEY ("location_id") REFERENCES "location" ("id");

ALTER TABLE "floor" ADD FOREIGN KEY ("building_id") REFERENCES "building" ("id");

ALTER TABLE "client_count" ADD FOREIGN KEY ("floor_id") REFERENCES "floor" ("id");

ALTER TABLE "client_coordinate" ADD FOREIGN KEY ("floor_id") REFERENCES "floor" ("id");

ALTER TABLE "floor_image" ADD FOREIGN KEY ("floor_id") REFERENCES "floor" ("id");
