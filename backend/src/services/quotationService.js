import { randomUUID } from "node:crypto";
import { pool } from "../config/db.js";

const VALID_STATUSES = new Set([
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
]);

function money(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error("Amounts must be valid non-negative numbers.");
  }

  // Keep monetary values at two decimal places.
  return number.toFixed(2);
}

export async function listQuotations({ status, search } = {}) {
  const values = [];
  const conditions = [];

  if (status) {
    if (!VALID_STATUSES.has(status)) {
      throw new Error("Invalid quotation status.");
    }
    values.push(status);
    conditions.push(`q.status = $${values.length}`);
  }

  if (search?.trim()) {
    values.push(`%${search.trim()}%`);
    conditions.push(
      `(q.reference ILIKE $${values.length}
        OR q.customer_name ILIKE $${values.length}
        OR q.customer_email ILIKE $${values.length}
        OR q.customer_phone ILIKE $${values.length})`
    );
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const result = await pool.query(
    `SELECT q.*,
            COUNT(qi.id)::int AS item_count
     FROM quotations q
     LEFT JOIN quotation_items qi ON qi.quotation_id = q.id
     ${whereClause}
     GROUP BY q.id
     ORDER BY q.created_at DESC`,
    values
  );

  return result.rows;
}

export async function getQuotationById(id) {
  const quotationResult = await pool.query(
    `SELECT q.*,
            e.id AS linked_enquiry_id
     FROM quotations q
     LEFT JOIN enquiries e ON e.id = q.enquiry_id
     WHERE q.id = $1`,
    [id]
  );

  if (quotationResult.rowCount === 0) {
    return null;
  }

  const itemsResult = await pool.query(
    `SELECT id, quotation_id, shelter_id, item_name, description,
            quantity, unit_price, line_total, created_at
     FROM quotation_items
     WHERE quotation_id = $1
     ORDER BY id`,
    [id]
  );

  return {
    ...quotationResult.rows[0],
    items: itemsResult.rows,
  };
}

export async function createQuotation(data, adminId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let customerName = data.customer_name?.trim();
    let customerEmail = data.customer_email?.trim() || null;
    let customerPhone = data.customer_phone?.trim();
    let customerLocation = data.customer_location?.trim() || null;

    if (data.enquiry_id) {
      const enquiryResult = await client.query(
        `SELECT customer_name, email, phone, project_location
         FROM enquiries
         WHERE id = $1`,
        [data.enquiry_id]
      );

      if (enquiryResult.rowCount === 0) {
        throw new Error("The selected enquiry does not exist.");
      }

      const enquiry = enquiryResult.rows[0];
      customerName ||= enquiry.customer_name;
      customerEmail ||= enquiry.email;
      customerPhone ||= enquiry.phone;
      customerLocation ||= enquiry.project_location;
    }

    if (!customerName || !customerPhone) {
      throw new Error(
        "Customer name and phone are required, unless provided by a linked enquiry."
      );
    }

    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new Error("Add at least one quotation item.");
    }

    const additionalCharges = money(data.additional_charges ?? 0);
    const currency = (data.currency || "CAD").toUpperCase();

    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new Error("Currency must be a valid three-letter code.");
    }

    // A temporary unique reference is replaced after the generated ID is known.
    const temporaryReference = `P-${randomUUID().slice(0, 12)}`;

    const insertedQuotation = await client.query(
      `INSERT INTO quotations (
         reference, enquiry_id, customer_name, customer_email,
         customer_phone, customer_location, currency,
         subtotal, additional_charges, total, valid_until, notes, created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $8, $9, $10, $11)
       RETURNING id`,
      [
        temporaryReference,
        data.enquiry_id || null,
        customerName,
        customerEmail,
        customerPhone,
        customerLocation,
        currency,
        additionalCharges,
        data.valid_until || null,
        data.notes?.trim() || null,
        adminId || null,
      ]
    );

    const quotationId = insertedQuotation.rows[0].id;
    const year = new Date().getFullYear();
    const reference = `KSS-Q-${year}-${String(quotationId).padStart(5, "0")}`;

    await client.query(
      "UPDATE quotations SET reference = $1 WHERE id = $2",
      [reference, quotationId]
    );

    for (const item of data.items) {
      const quantity = Number(item.quantity ?? 1);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error("Each item quantity must be a positive whole number.");
      }

      let itemName = item.item_name?.trim();
      let unitPrice;

      if (item.shelter_id) {
        const shelterResult = await client.query(
          `SELECT name, starting_price
           FROM shelters
           WHERE id = $1`,
          [item.shelter_id]
        );

        if (shelterResult.rowCount === 0) {
          throw new Error(`Shelter ${item.shelter_id} does not exist.`);
        }

        const shelter = shelterResult.rows[0];
        itemName ||= shelter.name;
        unitPrice = money(item.unit_price ?? shelter.starting_price);
      } else {
        unitPrice = money(item.unit_price);
      }

      if (!itemName) {
        throw new Error("Every quotation item must have a name.");
      }

      await client.query(
        `INSERT INTO quotation_items (
           quotation_id, shelter_id, item_name, description,
           quantity, unit_price, line_total
         )
         VALUES (
           $1, $2, $3, $4, $5, $6,
           ($5::integer * $6::numeric)
         )`,
        [
          quotationId,
          item.shelter_id || null,
          itemName,
          item.description?.trim() || null,
          quantity,
          unitPrice,
        ]
      );
    }

    // PostgreSQL calculates totals using NUMERIC, avoiding JS floating-point sums.
    await client.query(
      `UPDATE quotations q
       SET subtotal = totals.subtotal,
           total = totals.subtotal + q.additional_charges,
           updated_at = NOW()
       FROM (
         SELECT quotation_id, COALESCE(SUM(line_total), 0) AS subtotal
         FROM quotation_items
         WHERE quotation_id = $1
         GROUP BY quotation_id
       ) totals
       WHERE q.id = $1`,
      [quotationId]
    );

    const result = await client.query(
      "SELECT * FROM quotations WHERE id = $1",
      [quotationId]
    );

    await client.query("COMMIT");
    return await getQuotationById(result.rows[0].id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateQuotationStatus(id, status) {
  if (!VALID_STATUSES.has(status)) {
    throw new Error(
      "Status must be draft, sent, accepted, rejected, or expired."
    );
  }

  const result = await pool.query(
    `UPDATE quotations
     SET status = $1,
         sent_at = CASE
           WHEN $1 = 'sent' AND sent_at IS NULL THEN NOW()
           ELSE sent_at
         END,
         accepted_at = CASE
           WHEN $1 = 'accepted' THEN NOW()
           ELSE accepted_at
         END,
         rejected_at = CASE
           WHEN $1 = 'rejected' THEN NOW()
           ELSE rejected_at
         END,
         updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return getQuotationById(id);
}
