BEGIN;

CREATE TEMP TABLE location_change_temp (
  "location_type_id"  INT   NOT NULL,
  "location_type"     TEXT  NOT NULL,
  "location_id"       INT   NOT NULL,
  "location_new"      TEXT  NOT NULL,
  "building_id"       INT   NOT NULL,
  "building_new"      TEXT  NOT NULL,
  "floor_id"          INT   NOT NULL,
  "floor_new"         TEXT  NOT NULL,
  "mse_floor_id"      TEXT  NOT NULL
);

WITH ins (
  "location_type_id",
  "location_type",
  "location_id",
  "location_new",
  "building_id",
  "building_new",
  "floor_id",
  "floor_new",
  "mse_floor_id"
) AS (
  SELECT
    lv.location_type_id,
    lv."location_type",
    lv.location_id,
    ins2."location",
    lv.building_id,
    ins2.building,
    lv.floor_id,
    ins2.floor,
    ins2.mse_floor_id
  FROM (
    VALUES %L -- Replaced with sanitized values using 'pg-format'
  ) AS ins2 ("location_type", "location", "building", "floor", "mse_floor_id")
  RIGHT JOIN location_view lv
    ON ins2.mse_floor_id = lv.mse_floor_id
  WHERE
    lv.location_name != ins2."location" OR
    lv.building_name != ins2."building" OR
    lv.floor_name != ins2."floor"
)
INSERT INTO location_change_temp (
  "location_type_id",
  "location_type",
  "location_id",
  "location_new",
  "building_id",
  "building_new",
  "floor_id",
  "floor_new",
  "mse_floor_id"
)
  SELECT
    ins."location_type_id",
    ins."location_type",
    ins."location_id",
    ins."location_new",
    ins."building_id",
    ins."building_new",
    ins."floor_id",
    ins."floor_new",
    ins."mse_floor_id"
  FROM ins;

UPDATE "location" l SET
  name = lct.location_new
FROM location_change_temp lct
  WHERE
    l.id = lct.location_id AND
    l."name" != lct.location_new;

UPDATE "building" b SET
  name = lct.building_new
FROM location_change_temp lct
  WHERE
    b.id = lct.building_id AND
    b."name" != lct.building_new;

UPDATE "floor" f SET
  name = lct.floor_new
FROM location_change_temp lct
  WHERE
    f.id = lct.floor_id AND
    f."name" != lct.floor_new;

DROP TABLE "location_change_temp";

COMMIT;