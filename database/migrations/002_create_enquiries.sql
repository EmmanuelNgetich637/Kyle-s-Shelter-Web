CREATE TABLE IF NOT EXISTS enquiries (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    shelter_id BIGINT REFERENCES shelters(id) ON DELETE SET NULL,

    customer_name VARCHAR(150) NOT NULL,
    email VARCHAR(254) NOT NULL,
    phone VARCHAR(30) NOT NULL,

    intended_use VARCHAR(150),
    preferred_width_m NUMERIC(8, 2),
    preferred_length_m NUMERIC(8, 2),
    preferred_height_m NUMERIC(8, 2),
    project_location VARCHAR(200),
    message TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'contacted', 'quoted', 'closed')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (preferred_width_m IS NULL OR preferred_width_m > 0),
    CHECK (preferred_length_m IS NULL OR preferred_length_m > 0),
    CHECK (preferred_height_m IS NULL OR preferred_height_m > 0)
);

CREATE INDEX IF NOT EXISTS idx_enquiries_status
    ON enquiries(status);

CREATE INDEX IF NOT EXISTS idx_enquiries_created_at
    ON enquiries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_enquiries_shelter_id
    ON enquiries(shelter_id);
