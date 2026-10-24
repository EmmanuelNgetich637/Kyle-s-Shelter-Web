BEGIN;

CREATE TABLE IF NOT EXISTS quotations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    reference VARCHAR(40) NOT NULL UNIQUE,

    enquiry_id BIGINT
        REFERENCES enquiries(id)
        ON DELETE SET NULL,

    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(254),
    customer_phone VARCHAR(30) NOT NULL,
    customer_location VARCHAR(200),

    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (
            status IN (
                'draft',
                'sent',
                'accepted',
                'rejected',
                'expired'
            )
        ),

    currency CHAR(3) NOT NULL DEFAULT 'CAD',

    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0
        CHECK (subtotal >= 0),

    additional_charges NUMERIC(14, 2) NOT NULL DEFAULT 0
        CHECK (additional_charges >= 0),

    total NUMERIC(14, 2) NOT NULL DEFAULT 0
        CHECK (total >= 0),

    valid_until DATE,
    notes TEXT,

    created_by BIGINT
        REFERENCES admin_users(id)
        ON DELETE SET NULL,

    sent_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (total = subtotal + additional_charges)
);

CREATE TABLE IF NOT EXISTS quotation_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    quotation_id BIGINT NOT NULL
        REFERENCES quotations(id)
        ON DELETE CASCADE,

    shelter_id BIGINT
        REFERENCES shelters(id)
        ON DELETE SET NULL,

    item_name VARCHAR(180) NOT NULL,
    description TEXT,

    quantity INTEGER NOT NULL DEFAULT 1
        CHECK (quantity > 0),

    unit_price NUMERIC(14, 2) NOT NULL
        CHECK (unit_price >= 0),

    line_total NUMERIC(14, 2) NOT NULL
        CHECK (line_total >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (line_total = quantity * unit_price)
);

CREATE INDEX IF NOT EXISTS idx_quotations_enquiry_id
    ON quotations(enquiry_id);

CREATE INDEX IF NOT EXISTS idx_quotations_status
    ON quotations(status);

CREATE INDEX IF NOT EXISTS idx_quotations_created_at
    ON quotations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id
    ON quotation_items(quotation_id);

COMMIT;
