import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Eye,
  X,
} from "lucide-react";

import {
  hasAdminToken,
  getAdminQuotations,
  getAdminQuotation,
  createAdminQuotation,
  updateAdminQuotationStatus,
  getAdminShelters,
  logoutAdmin,
} from "../services/adminApi";

import "./admin.css";

const STATUSES = ["draft", "sent", "accepted", "rejected", "expired"];

const EMPTY_CUSTOMER = {
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  customer_location: "",
  currency: "CAD",
  additional_charges: "0",
  valid_until: "",
  notes: "",
};

const EMPTY_ITEM = {
  shelter_id: "",
  item_name: "",
  description: "",
  quantity: "1",
  unit_price: "",
};

function formatMoney(value, currency = "CAD") {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: /^[A-Z]{3}$/.test(currency || "") ? currency : "CAD",
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeZone: "Africa/Nairobi",
  }).format(date);
}

function quotationDateInput(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const part = (type) => parts.find((entry) => entry.type === type)?.value;

  return `${part("year")}-${part("month")}-${part("day")}`;
}

function getErrorMessage(error, fallback) {
  return error?.message || fallback;
}

export default function AdminQuotations() {
  const [quotations, setQuotations] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER);
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const loadData = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const [quotationResult, shelterResult] = await Promise.all([
        getAdminQuotations(),
        getAdminShelters(),
      ]);

      setQuotations(
        Array.isArray(quotationResult.data) ? quotationResult.data : [],
      );
      setShelters(
        Array.isArray(shelterResult.data) ? shelterResult.data : [],
      );
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load quotations."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredQuotations = useMemo(() => {
    const term = search.trim().toLowerCase();

    return quotations.filter((quotation) => {
      const matchesStatus =
        !statusFilter || quotation.status === statusFilter;

      const searchable = [
        quotation.reference,
        quotation.customer_name,
        quotation.customer_email,
        quotation.customer_phone,
        quotation.customer_location,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!term || searchable.includes(term));
    });
  }, [quotations, search, statusFilter]);

  const totals = useMemo(() => {
    const result = { all: quotations.length };

    STATUSES.forEach((status) => {
      result[status] = quotations.filter(
        (quotation) => quotation.status === status,
      ).length;
    });

    return result;
  }, [quotations]);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          Math.max(0, Number(item.quantity) || 0) *
            Math.max(0, Number(item.unit_price) || 0),
        0,
      ),
    [items],
  );

  const additionalCharges = Math.max(
    0,
    Number(customer.additional_charges) || 0,
  );

  const total = subtotal + additionalCharges;

  if (!hasAdminToken()) {
    return <Navigate to="/admin/login" replace />;
  }

  function resetForm() {
    setCustomer({ ...EMPTY_CUSTOMER });
    setItems([{ ...EMPTY_ITEM }]);
    setShowForm(false);
  }

  function updateCustomer(field, value) {
    setCustomer((current) => ({ ...current, [field]: value }));
  }

  function updateItem(index, field, value) {
    setItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        if (field === "shelter_id") {
          const shelter = shelters.find(
            (entry) => String(entry.id) === String(value),
          );

          if (!shelter) {
            return {
              ...item,
              shelter_id: "",
              item_name: "",
              unit_price: "",
            };
          }

          return {
            ...item,
            shelter_id: String(shelter.id),
            item_name: shelter.name,
            unit_price: String(shelter.starting_price ?? ""),
          };
        }

        return { ...item, [field]: value };
      }),
    );
  }

  function addItem() {
    setItems((current) => [...current, { ...EMPTY_ITEM }]);
  }

  function removeItem(index) {
    setItems((current) =>
      current.length === 1
        ? current
        : current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  async function handleCreate(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    const cleanItems = items.map((item) => ({
      ...(item.shelter_id ? { shelter_id: Number(item.shelter_id) } : {}),
      item_name: item.item_name.trim(),
      description: item.description.trim(),
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
    }));

    if (!customer.customer_name.trim() || !customer.customer_phone.trim()) {
      setError("Customer name and phone number are required.");
      return;
    }

    if (
      cleanItems.some(
        (item) =>
          !item.item_name ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          !Number.isFinite(item.unit_price) ||
          item.unit_price < 0,
      )
    ) {
      setError(
        "Every item needs a name, a positive whole-number quantity, and a valid non-negative unit price.",
      );
      return;
    }

    if (!Number.isFinite(additionalCharges) || additionalCharges < 0) {
      setError("Additional charges must be zero or greater.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...customer,
        customer_name: customer.customer_name.trim(),
        customer_email: customer.customer_email.trim() || null,
        customer_phone: customer.customer_phone.trim(),
        customer_location: customer.customer_location.trim() || null,
        additional_charges: additionalCharges,
        valid_until: customer.valid_until || null,
        notes: customer.notes.trim() || null,
        items: cleanItems,
      };

      const result = await createAdminQuotation(payload);
      const created = result.data;

      resetForm();
      setNotice(
        `Quotation ${created?.reference || ""} created successfully.`,
      );
      await loadData(true);

      if (created?.id) {
        await openQuotation(created.id);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Unable to create quotation."));
    } finally {
      setSaving(false);
    }
  }

  async function openQuotation(id) {
    setLoadingDetails(true);
    setSelectedQuotation(null);
    setError("");

    try {
      const result = await getAdminQuotation(id);
      setSelectedQuotation(result.data);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load quotation details."));
    } finally {
      setLoadingDetails(false);
    }
  }

  async function handleStatusChange(id, status) {
    setUpdatingId(id);
    setError("");
    setNotice("");

    try {
      const result = await updateAdminQuotationStatus(id, status);
      const updated = result.data;

      setQuotations((current) =>
        current.map((quotation) =>
          String(quotation.id) === String(id)
            ? { ...quotation, ...updated }
            : quotation,
        ),
      );

      if (
        selectedQuotation &&
        String(selectedQuotation.id) === String(id)
      ) {
        setSelectedQuotation((current) => ({ ...current, ...updated }));
      }

      setNotice(`Quotation status updated to "${status}".`);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update quotation status."));
    } finally {
      setUpdatingId(null);
    }
  }

  function handleLogout() {
    logoutAdmin();
    window.location.assign("/admin/login");
  }

  return (
    <main className="admin-dashboard-page">
      <div className="admin-dashboard-container">
        <header className="admin-dashboard-header">
          <div>
            <p className="admin-eyebrow">SHELTER SALES PLATFORM</p>
            <h1>Quotations</h1>
            <p>Create customer quotations and track their progress.</p>
          </div>

          <div className="admin-dashboard-actions">
            <Link to="/admin" className="admin-secondary-button">
              <ArrowLeft size={16} />
              Enquiries
            </Link>

            <Link to="/admin/shelters" className="admin-secondary-button">
              Manage shelters
            </Link>

            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => loadData(true)}
              disabled={refreshing}
            >
              <RefreshCw
                size={16}
                className={refreshing ? "admin-spinning" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              className="admin-secondary-button"
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>
        </header>

        <section className="admin-stats-grid" aria-label="Quotation summary">
          <article className="admin-stat-card">
            <span>Total quotations</span>
            <strong>{loading ? "—" : totals.all}</strong>
          </article>
          <article className="admin-stat-card">
            <span>Drafts</span>
            <strong>{loading ? "—" : totals.draft}</strong>
          </article>
          <article className="admin-stat-card">
            <span>Sent</span>
            <strong>{loading ? "—" : totals.sent}</strong>
          </article>
          <article className="admin-stat-card">
            <span>Accepted</span>
            <strong>{loading ? "—" : totals.accepted}</strong>
          </article>
        </section>

        {error && (
          <div className="admin-alert" role="alert">
            {error}
          </div>
        )}

        {notice && (
          <div className="admin-quotation-notice" role="status">
            {notice}
          </div>
        )}

        <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h2>Quotation register</h2>
              <p>
                {loading
                  ? "Loading quotations..."
                  : `${filteredQuotations.length} of ${quotations.length} quotations`}
              </p>
            </div>

            <button
              type="button"
              className="admin-primary-button"
              onClick={() => {
                setSelectedQuotation(null);
                setNotice("");
                setError("");
                setShowForm((current) => !current);
              }}
            >
              {showForm ? <X size={16} /> : <Plus size={16} />}
              {showForm ? "Close form" : "New quotation"}
            </button>
          </div>

          <div className="admin-filters admin-quotation-filters">
            <label className="admin-search-field">
              <Search size={16} />
              <input
                type="search"
                placeholder="Search reference or customer..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search quotations"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter quotations by status"
            >
              <option value="">All statuses</option>
              {STATUSES.map((status) => (
                <option value={status} key={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {showForm && (
            <form className="admin-quotation-form" onSubmit={handleCreate}>
              <div className="admin-quotation-form-heading">
                <div>
                  <h2>Create quotation</h2>
                  <p>Enter customer details and the items being quoted.</p>
                </div>
              </div>

              <div className="admin-quotation-fields">
                <label>
                  Customer name *
                  <input
                    required
                    value={customer.customer_name}
                    onChange={(event) =>
                      updateCustomer("customer_name", event.target.value)
                    }
                    maxLength={150}
                  />
                </label>

                <label>
                  Phone number *
                  <input
                    required
                    value={customer.customer_phone}
                    onChange={(event) =>
                      updateCustomer("customer_phone", event.target.value)
                    }
                    maxLength={30}
                  />
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    value={customer.customer_email}
                    onChange={(event) =>
                      updateCustomer("customer_email", event.target.value)
                    }
                    maxLength={254}
                  />
                </label>

                <label>
                  Customer location
                  <input
                    value={customer.customer_location}
                    onChange={(event) =>
                      updateCustomer("customer_location", event.target.value)
                    }
                    maxLength={200}
                  />
                </label>

                <label>
                  Currency
                  <select
                    value={customer.currency}
                    onChange={(event) =>
                      updateCustomer("currency", event.target.value)
                    }
                  >
                    <option value="CAD">CAD — Canadian dollar</option>
                    <option value="USD">USD — US dollar</option>
                    <option value="KES">KES — Kenyan shilling</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — Pound sterling</option>
                  </select>
                </label>

                <label>
                  Valid until
                  <input
                    type="date"
                    min={new Date().toLocaleDateString("en-CA", {
                      timeZone: "Africa/Nairobi",
                    })}
                    value={customer.valid_until}
                    onChange={(event) =>
                      updateCustomer("valid_until", event.target.value)
                    }
                  />
                </label>
              </div>

              <div className="admin-quotation-items-heading">
                <h3>Quotation items</h3>
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={addItem}
                >
                  <Plus size={15} />
                  Add item
                </button>
              </div>

              {items.map((item, index) => (
                <div className="admin-quotation-item" key={index}>
                  <div className="admin-quotation-item-fields">
                    <label>
                      Shelter (optional)
                      <select
                        value={item.shelter_id}
                        onChange={(event) =>
                          updateItem(index, "shelter_id", event.target.value)
                        }
                      >
                        <option value="">Custom item</option>
                        {shelters.map((shelter) => (
                          <option value={shelter.id} key={shelter.id}>
                            {shelter.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Item name *
                      <input
                        required
                        value={item.item_name}
                        onChange={(event) =>
                          updateItem(index, "item_name", event.target.value)
                        }
                        maxLength={180}
                      />
                    </label>

                    <label>
                      Quantity *
                      <input
                        type="number"
                        required
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(index, "quantity", event.target.value)
                        }
                      />
                    </label>

                    <label>
                      Unit price *
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(event) =>
                          updateItem(index, "unit_price", event.target.value)
                        }
                      />
                    </label>

                    <div className="admin-quotation-line-total">
                      <span>Line total</span>
                      <strong>
                        {formatMoney(
                          (Number(item.quantity) || 0) *
                            (Number(item.unit_price) || 0),
                          customer.currency,
                        )}
                      </strong>
                    </div>

                    <label className="admin-quotation-description">
                      Description
                      <input
                        value={item.description}
                        onChange={(event) =>
                          updateItem(index, "description", event.target.value)
                        }
                        maxLength={2000}
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    className="admin-icon-button"
                    title="Remove item"
                    aria-label={`Remove item ${index + 1}`}
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}

              <div className="admin-quotation-summary">
                <div>
                  <span>Subtotal</span>
                  <strong>{formatMoney(subtotal, customer.currency)}</strong>
                </div>

                <label>
                  Additional charges
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={customer.additional_charges}
                    onChange={(event) =>
                      updateCustomer("additional_charges", event.target.value)
                    }
                  />
                </label>

                <div className="admin-quotation-grand-total">
                  <span>Total ({customer.currency})</span>
                  <strong>{formatMoney(total, customer.currency)}</strong>
                </div>
              </div>

              <label className="admin-quotation-notes">
                Notes / terms
                <textarea
                  rows="3"
                  value={customer.notes}
                  onChange={(event) =>
                    updateCustomer("notes", event.target.value)
                  }
                  placeholder="Delivery terms, payment terms, or other notes..."
                />
              </label>

              <div className="admin-quotation-form-actions">
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-primary-button"
                  disabled={saving}
                >
                  <FileText size={16} />
                  {saving ? "Creating..." : "Create quotation"}
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="admin-page-message">Loading quotations...</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Created</th>
                    <th>Valid until</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotations.map((quotation) => (
                    <tr key={quotation.id}>
                      <td>
                        <strong>{quotation.reference}</strong>
                      </td>
                      <td>
                        <strong>{quotation.customer_name}</strong>
                        <span className="admin-muted">
                          {quotation.customer_phone}
                        </span>
                      </td>
                      <td>
                        {formatMoney(quotation.total, quotation.currency)}
                      </td>
                      <td>{formatDate(quotation.created_at)}</td>
                      <td>{formatDate(quotation.valid_until)}</td>
                      <td>
                        <span
                          className={`admin-status admin-status-${quotation.status}`}
                        >
                          {quotation.status}
                        </span>
                        <select
                          className="admin-status-select"
                          aria-label={`Change status for ${quotation.reference}`}
                          value={quotation.status}
                          disabled={updatingId === quotation.id}
                          onChange={(event) =>
                            handleStatusChange(
                              quotation.id,
                              event.target.value,
                            )
                          }
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() +
                                status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-secondary-button admin-view-button"
                          onClick={() => openQuotation(quotation.id)}
                        >
                          <Eye size={15} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredQuotations.length === 0 && (
                    <tr>
                      <td colSpan="7" className="admin-table-empty">
                        <FileText size={28} />
                        <p>No quotations match your filters.</p>
                        <span>
                          Create a quotation to start tracking a customer offer.
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {(loadingDetails || selectedQuotation) && (
          <section className="admin-panel admin-quotation-detail">
            <div className="admin-panel-header">
              <div>
                <h2>
                  {selectedQuotation
                    ? selectedQuotation.reference
                    : "Loading quotation..."}
                </h2>
                <p>Quotation details</p>
              </div>
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setSelectedQuotation(null)}
              >
                <X size={16} />
                Close details
              </button>
            </div>

            {loadingDetails ? (
              <div className="admin-page-message">Loading details...</div>
            ) : selectedQuotation ? (
              <>
                <div className="admin-quotation-detail-grid">
                  <div>
                    <span>Customer</span>
                    <strong>{selectedQuotation.customer_name}</strong>
                  </div>
                  <div>
                    <span>Phone</span>
                    <strong>{selectedQuotation.customer_phone}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>{selectedQuotation.customer_email || "—"}</strong>
                  </div>
                  <div>
                    <span>Location</span>
                    <strong>{selectedQuotation.customer_location || "—"}</strong>
                  </div>
                  <div>
                    <span>Created</span>
                    <strong>{formatDate(selectedQuotation.created_at)}</strong>
                  </div>
                  <div>
                    <span>Valid until</span>
                    <strong>{formatDate(selectedQuotation.valid_until)}</strong>
                  </div>
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Unit price</th>
                        <th>Line total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedQuotation.items || []).map((item) => (
                        <tr key={item.id}>
                          <td>{item.item_name}</td>
                          <td>{item.description || "—"}</td>
                          <td>{item.quantity}</td>
                          <td>
                            {formatMoney(
                              item.unit_price,
                              selectedQuotation.currency,
                            )}
                          </td>
                          <td>
                            {formatMoney(
                              item.line_total,
                              selectedQuotation.currency,
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="admin-quotation-detail-totals">
                  <div>
                    <span>Subtotal</span>
                    <strong>
                      {formatMoney(
                        selectedQuotation.subtotal,
                        selectedQuotation.currency,
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>Additional charges</span>
                    <strong>
                      {formatMoney(
                        selectedQuotation.additional_charges,
                        selectedQuotation.currency,
                      )}
                    </strong>
                  </div>
                  <div className="admin-quotation-grand-total">
                    <span>Total</span>
                    <strong>
                      {formatMoney(
                        selectedQuotation.total,
                        selectedQuotation.currency,
                      )}
                    </strong>
                  </div>
                </div>

                {selectedQuotation.notes && (
                  <div className="admin-quotation-detail-notes">
                    <strong>Notes / terms</strong>
                    <p>{selectedQuotation.notes}</p>
                  </div>
                )}
              </>
            ) : null}
          </section>
        )}

        <footer className="admin-dashboard-footer">
          <span>
            <FileText size={15} />
            Quotation management
          </span>
          <Link to="/" className="admin-public-link">
            View public website
          </Link>
        </footer>
      </div>
    </main>
  );
}
