import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  LogOut,
  RefreshCw,
  Search,
  LayoutDashboard,
  ArrowUpRight,
  Inbox,
  Package,
} from "lucide-react";
import {
  getAdminEnquiries,
  hasAdminToken,
  logoutAdmin,
  updateEnquiryStatus,
} from "../services/adminApi";
import "./admin.css";

const STATUSES = ["new", "contacted", "quoted", "closed"];

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDimensions(enquiry) {
  const {
    preferred_width_m: width,
    preferred_length_m: length,
    preferred_height_m: height,
  } = enquiry;

  if (!width && !length && !height) return "Not specified";

  const dimensions = [];

  if (width) dimensions.push(`W ${width} m`);
  if (length) dimensions.push(`L ${length} m`);
  if (height) dimensions.push(`H ${height} m`);

  return dimensions.join(" × ");
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatingIds, setUpdatingIds] = useState([]);

  if (!hasAdminToken()) {
    return <Navigate to="/admin/login" replace />;
  }

  const loadEnquiries = useCallback(async ({ quiet = false } = {}) => {
    if (quiet) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const result = await getAdminEnquiries();
      setEnquiries(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err.message || "Unable to load enquiries.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEnquiries();
  }, [loadEnquiries]);

  const counts = useMemo(() => {
    const totals = {
      all: enquiries.length,
      new: 0,
      contacted: 0,
      quoted: 0,
      closed: 0,
    };

    enquiries.forEach((enquiry) => {
      if (Object.prototype.hasOwnProperty.call(totals, enquiry.status)) {
        totals[enquiry.status] += 1;
      }
    });

    return totals;
  }, [enquiries]);

  const filteredEnquiries = useMemo(() => {
    const term = search.trim().toLowerCase();

    return enquiries.filter((enquiry) => {
      const matchesStatus =
        !statusFilter || enquiry.status === statusFilter;

      const searchableText = [
        enquiry.customer_name,
        enquiry.email,
        enquiry.phone,
        enquiry.project_location,
        enquiry.shelter_name,
        enquiry.intended_use,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!term || searchableText.includes(term));
    });
  }, [enquiries, search, statusFilter]);

  async function handleStatusChange(id, status) {
    setUpdatingIds((current) => [...current, id]);
    setError("");

    try {
      const result = await updateEnquiryStatus(id, status);

      setEnquiries((current) =>
        current.map((enquiry) =>
          String(enquiry.id) === String(id)
            ? {
                ...enquiry,
                status: result.data.status,
                updated_at: result.data.updated_at,
              }
            : enquiry,
        ),
      );
    } catch (err) {
      setError(err.message || "Unable to update enquiry status.");
    } finally {
      setUpdatingIds((current) =>
        current.filter(
          (currentId) => String(currentId) !== String(id),
        ),
      );
    }
  }

  function handleLogout() {
    logoutAdmin();
    navigate("/admin/login", { replace: true });
  }

  return (
    <main className="admin-dashboard-page">
      <div className="admin-dashboard-container">
        <header className="admin-dashboard-header">
          <div>
            <p className="admin-eyebrow">SHELTER SALES PLATFORM</p>
            <h1>Enquiries dashboard</h1>
            <p>
              Manage customer enquiries and follow up on potential sales.
            </p>
          </div>

          <div className="admin-dashboard-actions">
            <Link
              to="/admin/shelters"
              className="admin-secondary-button"
            >
              <Package size={16} />
              Manage shelters
            </Link>

            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => loadEnquiries({ quiet: true })}
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
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </header>

        <section
          className="admin-stats-grid"
          aria-label="Enquiry summary"
        >
          <article className="admin-stat-card">
            <span>Total enquiries</span>
            <strong>{loading ? "—" : counts.all}</strong>
          </article>

          <article className="admin-stat-card">
            <span>New enquiries</span>
            <strong>{loading ? "—" : counts.new}</strong>
          </article>

          <article className="admin-stat-card">
            <span>Contacted</span>
            <strong>{loading ? "—" : counts.contacted}</strong>
          </article>

          <article className="admin-stat-card">
            <span>Quoted / closed</span>
            <strong>
              {loading ? "—" : counts.quoted + counts.closed}
            </strong>
          </article>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h2>Customer enquiries</h2>
              <p>
                {loading
                  ? "Loading records..."
                  : `${filteredEnquiries.length} of ${enquiries.length} enquiries shown`}
              </p>
            </div>

            <div className="admin-filters">
              <label className="admin-search-field">
                <Search size={16} />
                <input
                  type="search"
                  placeholder="Search customers..."
                  aria-label="Search customer enquiries"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>

              <select
                aria-label="Filter by enquiry status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
              >
                <option value="">All statuses</option>
                {STATUSES.map((status) => (
                  <option value={status} key={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div
              className="admin-alert admin-dashboard-alert"
              role="alert"
            >
              {error}
            </div>
          )}

          {loading ? (
            <div className="admin-page-message">
              Loading enquiries...
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Shelter / use</th>
                    <th>Requirements</th>
                    <th>Location</th>
                    <th>Received</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEnquiries.map((enquiry) => (
                    <tr key={enquiry.id}>
                      <td>
                        <strong>{enquiry.customer_name}</strong>

                        <a
                          className="admin-contact-link"
                          href={`mailto:${enquiry.email}`}
                        >
                          {enquiry.email}
                        </a>

                        <a
                          className="admin-contact-link"
                          href={`tel:${enquiry.phone}`}
                        >
                          {enquiry.phone}
                        </a>

                        {enquiry.message && (
                          <details className="admin-message-details">
                            <summary>View message</summary>
                            <p>{enquiry.message}</p>
                          </details>
                        )}
                      </td>

                      <td>
                        <strong>
                          {enquiry.shelter_name || "General enquiry"}
                        </strong>
                        <span className="admin-muted">
                          {enquiry.intended_use || "Use not specified"}
                        </span>
                      </td>

                      <td>
                        <span>{formatDimensions(enquiry)}</span>
                      </td>

                      <td>{enquiry.project_location || "—"}</td>

                      <td>
                        <span>{formatDate(enquiry.created_at)}</span>
                      </td>

                      <td>
                        <span
                          className={`admin-status admin-status-${enquiry.status}`}
                        >
                          {enquiry.status}
                        </span>

                        <select
                          className="admin-status-select"
                          aria-label={`Update status for ${enquiry.customer_name}`}
                          value={enquiry.status}
                          disabled={updatingIds.some(
                            (id) =>
                              String(id) === String(enquiry.id),
                          )}
                          onChange={(event) =>
                            handleStatusChange(
                              enquiry.id,
                              event.target.value,
                            )
                          }
                        >
                          {STATUSES.map((status) => (
                            <option value={status} key={status}>
                              {status.charAt(0).toUpperCase() +
                                status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}

                  {filteredEnquiries.length === 0 && (
                    <tr>
                      <td colSpan="6" className="admin-table-empty">
                        <Inbox size={28} />
                        <p>No matching enquiries found.</p>

                        {search || statusFilter ? (
                          <button
                            type="button"
                            className="admin-secondary-button"
                            onClick={() => {
                              setSearch("");
                              setStatusFilter("");
                            }}
                          >
                            Clear filters
                          </button>
                        ) : (
                          <p>
                            New customer enquiries will appear here.
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="admin-dashboard-footer">
          <span>
            <LayoutDashboard size={15} />
            Administrator workspace
          </span>

          <Link to="/" className="admin-public-link">
            View public website <ArrowUpRight size={15} />
          </Link>
        </footer>
      </div>
    </main>
  );
}
