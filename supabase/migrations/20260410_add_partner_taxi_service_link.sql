ALTER TABLE partners
ADD COLUMN IF NOT EXISTS taxi_service_id UUID REFERENCES taxi_services(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_partners_taxi_service_id
ON partners(taxi_service_id);

UPDATE partners AS p
SET taxi_service_id = ts.id
FROM taxi_services AS ts
WHERE p.taxi_service_id IS NULL
  AND ts.city_slug = p.city_slug
  AND ts.name = p.name;
