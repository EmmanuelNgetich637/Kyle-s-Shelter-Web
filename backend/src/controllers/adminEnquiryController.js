import { pool } from "../config/db.js";

const VALID_STATUSES = ["new", "contacted", "quoted", "closed"];

export async function listEnquiries(req, res, next) {
  try {
    const status = req.query.status;
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim().slice(0, 150)
        : "";

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status filter.",
        validStatuses: VALID_STATUSES,
      });
    }

    const values = [];
    const conditions = [];

    if (status) {
      values.push(status);
      conditions.push(`e.status = $${values.length}`);
    }

    if (search) {
      values.push(`%${search.replace(/[\\%_]/g, "\\$&")}%`);
      conditions.push(
        `(e.customer_name ILIKE $${values.length} ESCAPE '\\' OR
          e.email ILIKE $${values.length} ESCAPE '\\' OR
          e.phone ILIKE $${values.length} ESCAPE '\\' OR
          COALESCE(e.project_location, '') ILIKE $${values.length} ESCAPE '\\')`
      );
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const result = await pool.query(
      `SELECT
         e.id,
         e.shelter_id,
         s.name AS shelter_name,
         e.customer_name,
         e.email,
         e.phone,
         e.intended_use,
         e.preferred_width_m,
         e.preferred_length_m,
         e.preferred_height_m,
         e.project_location,
         e.message,
         e.status,
         e.created_at,
         e.updated_at
       FROM enquiries e
       LEFT JOIN shelters s ON s.id = e.shelter_id
       ${whereClause}
       ORDER BY e.created_at DESC, e.id DESC
       LIMIT 200`,
      values
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rowCount,
      limit: 200,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateEnquiryStatus(req, res, next) {
  try {
    const id = req.params.id;
    const status = req.body?.status;

    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid enquiry ID.",
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status.",
        validStatuses: VALID_STATUSES,
      });
    }

    const result = await pool.query(
      `UPDATE enquiries
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, customer_name, status, updated_at`,
      [status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Enquiry status updated.",
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}
