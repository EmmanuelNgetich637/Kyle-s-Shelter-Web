import { pool } from "../config/db.js";

export async function createEnquiry(data) {
  const {
    shelterId,
    customerName,
    email,
    phone,
    intendedUse,
    preferredWidth,
    preferredLength,
    preferredHeight,
    projectLocation,
    message,
  } = data;

  const result = await pool.query(
    `
      INSERT INTO enquiries (
        shelter_id,
        customer_name,
        email,
        phone,
        intended_use,
        preferred_width_m,
        preferred_length_m,
        preferred_height_m,
        project_location,
        message
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, customer_name, status, created_at
    `,
    [
      shelterId,
      customerName,
      email,
      phone,
      intendedUse || null,
      preferredWidth ?? null,
      preferredLength ?? null,
      preferredHeight ?? null,
      projectLocation || null,
      message || null,
    ]
  );

  return result.rows[0];
}
