CREATE TABLE IF NOT EXISTS shelters (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(180) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    starting_price NUMERIC(12, 2) NOT NULL
        CHECK (starting_price >= 0),
    width_m NUMERIC(8, 2),
    length_m NUMERIC(8, 2),
    height_m NUMERIC(8, 2),
    image_url TEXT,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shelters_published
    ON shelters (is_published);
