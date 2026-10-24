import {
  listQuotations,
  getQuotationById,
  createQuotation,
  updateQuotationStatus,
} from "../services/quotationService.js";

function sendError(res, error) {
  console.error("Quotation error:", error);

  const message = error.message || "An unexpected error occurred.";

  if (
    message.includes("required") ||
    message.includes("must be") ||
    message.includes("does not exist") ||
    message.includes("Add at least") ||
    message.includes("Currency")
  ) {
    return res.status(400).json({ error: message });
  }

  // Temporary diagnostic response for local development only.
  return res.status(500).json({
    error: "Unable to process quotation request.",
    detail: message,
    code: error.code || null,
  });
}

export async function listAdminQuotations(req, res) {
  try {
    const quotations = await listQuotations({
      status: req.query.status,
      search: req.query.search,
    });

    return res.json({ quotations });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function getAdminQuotation(req, res) {
  try {
    const quotation = await getQuotationById(req.params.id);

    if (!quotation) {
      return res.status(404).json({ error: "Quotation not found." });
    }

    return res.json({ quotation });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function createAdminQuotation(req, res) {
  try {
    const quotation = await createQuotation(req.body, req.admin?.id);

    return res.status(201).json({
      message: "Quotation created successfully.",
      quotation,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function changeAdminQuotationStatus(req, res) {
  try {
    const quotation = await updateQuotationStatus(
      req.params.id,
      req.body.status
    );

    if (!quotation) {
      return res.status(404).json({ error: "Quotation not found." });
    }

    return res.json({
      message: "Quotation status updated successfully.",
      quotation,
    });
  } catch (error) {
    return sendError(res, error);
  }
}
