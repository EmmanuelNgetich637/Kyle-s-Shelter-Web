import {
  getAllShelters,
  createShelter,
  updateShelter,
} from "../services/shelterService.js";

function validateShelter(body) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const imageUrl =
    typeof body.image_url === "string" ? body.image_url.trim() : "";

  if (!name || name.length > 150) {
    return "Name is required and must be at most 150 characters.";
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 180) {
    return "Slug must contain lowercase letters, numbers and single hyphens.";
  }

  if (!description) {
    return "Description is required.";
  }

  if (
    body.starting_price === undefined ||
    body.starting_price === null ||
    body.starting_price === "" ||
    !Number.isFinite(Number(body.starting_price)) ||
    Number(body.starting_price) < 0
  ) {
    return "Starting price must be a valid non-negative number.";
  }

  for (const field of ["width_m", "length_m", "height_m"]) {
    const value = body[field];

    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      (!Number.isFinite(Number(value)) || Number(value) <= 0)
    ) {
      return `${field} must be a positive number when supplied.`;
    }
  }

  if (imageUrl && imageUrl.length > 5000) {
    return "Image URL is too long.";
  }

  if (
    imageUrl &&
    !/^https?:\/\/\S+$/i.test(imageUrl)
  ) {
    return "Image URL must start with http:// or https://.";
  }

  if (
    body.is_published !== undefined &&
    typeof body.is_published !== "boolean"
  ) {
    return "is_published must be true or false.";
  }

  return null;
}

function normalizeShelter(body) {
  const nullableNumber = (value) =>
    value === undefined || value === null || value === ""
      ? null
      : Number(value);

  return {
    name: body.name.trim(),
    slug: body.slug.trim().toLowerCase(),
    description: body.description.trim(),
    starting_price: Number(body.starting_price),
    width_m: nullableNumber(body.width_m),
    length_m: nullableNumber(body.length_m),
    height_m: nullableNumber(body.height_m),
    image_url: body.image_url?.trim() || null,
    is_published: body.is_published === true,
  };
}

function handleDatabaseError(error, res, next) {
  if (error.code === "23505") {
    return res.status(409).json({
      success: false,
      message: "That shelter slug already exists. Choose a unique slug.",
    });
  }

  if (error.code === "23514" || error.code === "22003") {
    return res.status(400).json({
      success: false,
      message: "One or more shelter values are outside the allowed range.",
    });
  }

  return next(error);
}

export async function listAllShelters(req, res, next) {
  try {
    const shelters = await getAllShelters();

    return res.status(200).json({
      success: true,
      count: shelters.length,
      data: shelters,
    });
  } catch (error) {
    return next(error);
  }
}

export async function createShelterRecord(req, res, next) {
  const validationError = validateShelter(req.body ?? {});

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }

  try {
    const shelter = await createShelter(normalizeShelter(req.body));

    return res.status(201).json({
      success: true,
      message: "Shelter created successfully.",
      data: shelter,
    });
  } catch (error) {
    return handleDatabaseError(error, res, next);
  }
}

export async function updateShelterRecord(req, res, next) {
  if (!/^[1-9]\d*$/.test(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid shelter ID.",
    });
  }

  const validationError = validateShelter(req.body ?? {});

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }

  try {
    const shelter = await updateShelter(
      req.params.id,
      normalizeShelter(req.body)
    );

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: "Shelter not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Shelter updated successfully.",
      data: shelter,
    });
  } catch (error) {
    return handleDatabaseError(error, res, next);
  }
}
