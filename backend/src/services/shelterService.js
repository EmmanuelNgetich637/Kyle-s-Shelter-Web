import { pool } from "../config/db.js";

export async function getPublishedShelters() {
  const result = await pool.query(`
    SELECT
      id,
      name,
      slug,
      description,
      starting_price,
      width_m,
      length_m,
      height_m,
      image_url,
      created_at,
      updated_at
    FROM shelters
    WHERE is_published = TRUE
    ORDER BY created_at DESC
  `);

  return result.rows;
}

export async function getPublishedShelterBySlug(slug) {
  const result = await pool.query(
    `
      SELECT
        id,
        name,
        slug,
        description,
        starting_price,
        width_m,
        length_m,
        height_m,
        image_url,
        created_at,
        updated_at
      FROM shelters
      WHERE slug = $1 AND is_published = TRUE
      LIMIT 1
    `,
    [slug]
  );

  return result.rows[0] ?? null;
}

const ADMIN_SHELTER_FIELDS = `
  id, name, slug, description, starting_price,
  width_m, length_m, height_m, image_url, is_published,
  created_at, updated_at
`;

export async function getAllShelters() {
  const result = await pool.query(`
    SELECT ${ADMIN_SHELTER_FIELDS}
    FROM shelters
    ORDER BY created_at DESC, id DESC
  `);

  return result.rows;
}

export async function createShelter(data) {
  const result = await pool.query(
    `INSERT INTO shelters (
       name, slug, description, starting_price,
       width_m, length_m, height_m, image_url, is_published
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING ${ADMIN_SHELTER_FIELDS}`,
    [
      data.name,
      data.slug,
      data.description,
      data.starting_price,
      data.width_m,
      data.length_m,
      data.height_m,
      data.image_url,
      data.is_published,
    ]
  );

  return result.rows[0];
}

export async function updateShelter(id, data) {
  const result = await pool.query(
    `UPDATE shelters
     SET name = $1,
         slug = $2,
         description = $3,
         starting_price = $4,
         width_m = $5,
         length_m = $6,
         height_m = $7,
         image_url = $8,
         is_published = $9,
         updated_at = NOW()
     WHERE id = $10
     RETURNING ${ADMIN_SHELTER_FIELDS}`,
    [
      data.name,
      data.slug,
      data.description,
      data.starting_price,
      data.width_m,
      data.length_m,
      data.height_m,
      data.image_url,
      data.is_published,
      id,
    ]
  );

  return result.rows[0] ?? null;
}
