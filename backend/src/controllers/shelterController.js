import {
  getPublishedShelters,
  getPublishedShelterBySlug,
} from "../services/shelterService.js";

export async function listShelters(req, res, next) {
  try {
    const shelters = await getPublishedShelters();

    res.json({
      success: true,
      count: shelters.length,
      data: shelters,
    });
  } catch (error) {
    next(error);
  }
}

export async function getShelterBySlug(req, res, next) {
  try {
    const shelter = await getPublishedShelterBySlug(req.params.slug);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: "Shelter not found.",
      });
    }

    res.json({
      success: true,
      data: shelter,
    });
  } catch (error) {
    next(error);
  }
}
