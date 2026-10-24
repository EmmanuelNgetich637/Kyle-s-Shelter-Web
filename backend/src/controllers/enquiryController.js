import { pool } from "../config/db.js";
import { createEnquiry } from "../services/enquiryService.js";

function optionalText(value, maxLength) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed.length > maxLength) {
    return undefined;
  }

  return trimmed;
}

function optionalDimension(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0 || number > 100000) {
    return undefined;
  }

  return number;
}

export async function submitEnquiry(req, res, next) {
  try {
    const body = req.body ?? {};

    const customerName = optionalText(body.customerName, 150);
    const email = optionalText(body.email, 254)?.toLowerCase();
    const phone = optionalText(body.phone, 30);

    if (!customerName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and phone number are required.",
      });
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (!/^[+()\d\s.-]{7,30}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid phone number.",
      });
    }

    const intendedUse = optionalText(body.intendedUse, 150);
    const projectLocation = optionalText(body.projectLocation, 200);
    const message = optionalText(body.message, 3000);

    const preferredWidth = optionalDimension(body.preferredWidth);
    const preferredLength = optionalDimension(body.preferredLength);
    const preferredHeight = optionalDimension(body.preferredHeight);

    const optionalValues = [
      [body.intendedUse, intendedUse],
      [body.projectLocation, projectLocation],
      [body.message, message],
      [body.preferredWidth, preferredWidth],
      [body.preferredLength, preferredLength],
      [body.preferredHeight, preferredHeight],
    ];

    if (optionalValues.some(([original, parsed]) =>
      original !== undefined &&
      original !== null &&
      original !== "" &&
      parsed === undefined
    )) {
      return res.status(400).json({
        success: false,
        message:
          "One or more optional fields are invalid. Check the text lengths and dimensions.",
      });
    }

    let shelterId = null;

    if (body.shelterId !== undefined && body.shelterId !== null) {
      const rawId = String(body.shelterId);

      if (!/^\d+$/.test(rawId) || BigInt(rawId) <= 0n) {
        return res.status(400).json({
          success: false,
          message: "The selected shelter is invalid.",
        });
      }

      const shelterResult = await pool.query(
        `SELECT id FROM shelters WHERE id = $1 AND is_published = TRUE`,
        [rawId]
      );

      if (shelterResult.rowCount === 0) {
        return res.status(400).json({
          success: false,
          message: "The selected shelter is unavailable.",
        });
      }

      shelterId = shelterResult.rows[0].id;
    }

    const enquiry = await createEnquiry({
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
    });

    return res.status(201).json({
      success: true,
      message: "Your enquiry has been submitted successfully.",
      data: {
        id: enquiry.id,
        customerName: enquiry.customer_name,
        status: enquiry.status,
        createdAt: enquiry.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
}
