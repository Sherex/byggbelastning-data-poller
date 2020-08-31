/* The diagram can be found here: https://dbdiagram.io/d/5f4a96be88d052352cb544f3 */
CREATE TABLE IF NOT EXISTS "location" (
  "id"            UUID          PRIMARY KEY,
  "name"          TEXT          UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS "building" (
  "id"            UUID          PRIMARY KEY,
  "name"          TEXT          UNIQUE NOT NULL,
  "location_id"   UUID          NOT NULL REFERENCES "location" ("id")
);

CREATE TABLE IF NOT EXISTS "floor" (
  "id"            UUID          PRIMARY KEY,
  "name"          TEXT          UNIQUE NOT NULL,
  "building_id"   UUID          NOT NULL REFERENCES "building" ("id")
);

CREATE TABLE IF NOT EXISTS "client_count" (
  "time"          TIMESTAMPTZ   NOT NULL,
  "floor_id"      UUID          NOT NULL REFERENCES "floor" ("id"),
  "authCount"     INTEGER       ,
  "assoCount"     INTEGER       ,
  UNIQUE(time, floor_id)
);

CREATE TABLE IF NOT EXISTS "client_coordinate" (
  "time"          TIMESTAMPTZ     NOT NULL,
  "floor_id"      UUID            NOT NULL REFERENCES "floor" ("id"),
  "cid"           TEXT            NOT NULL,
  "x"             NUMERIC(10, 4)  NOT NULL,
  "y"             NUMERIC(10, 4)  NOT NULL,
  UNIQUE (time, floor_id, cid, x, y)
);

CREATE TABLE IF NOT EXISTS "floor_image" (
  "id"            UUID            PRIMARY KEY,
  "floor_id"      UUID            NOT NULL REFERENCES "floor" ("id"),
  "imageBase64"   TEXT            ,
  "imageLength"   NUMERIC(10, 6)  ,
  "imageWidth"    NUMERIC(10, 6)  ,
  "imageOffsetX"  NUMERIC(10, 6)  ,
  "imageOffsetY"  NUMERIC(10, 6)
);

SELECT create_hypertable('client_count', 'time', if_not_exists => TRUE);

SELECT create_hypertable('client_coordinate', 'time', if_not_exists => TRUE);

