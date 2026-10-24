import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Pencil,
  RefreshCw,
  Save,
  X,
} from "lucide-react";

import {
  getAdminShelters,
  createShelter,
  updateShelter,
  logoutAdmin,
} from "../services/adminApi";

import "./admin.css";

const EMPTY_FORM = {
  name: "",
  slug: "",
  description: "",
  starting_price: "",
  width_m: "",
  length_m: "",
  height_m: "",
  image_url: "",
  is_published: false,
};

function shelterToForm(shelter) {
  return {
    name: shelter.name ?? "",
    slug: shelter.slug ?? "",
    description: shelter.description ?? "",
    starting_price: shelter.starting_price ?? "",
    width_m: shelter.width_m ?? "",
    length_m: shelter.length_m ?? "",
    height_m: shelter.height_m ?? "",
    image_url: shelter.image_url ?? "",
    is_published: Boolean(shelter.is_published),
  };
}

function generateSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export default function AdminShelters() {
  const [shelters, setShelters] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadShelters = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getAdminShelters();
      setShelters(result.data ?? []);
    } catch (err) {
      setError(err.message || "Could not load shelters.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShelters();
  }, [loadShelters]);

  function startNewShelter() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setError("");
    setNotice("");
  }

  function startEditing(shelter) {
    setEditingId(shelter.id);
    setForm(shelterToForm(shelter));
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleChange(event) {
    const { name, value, checked, type } = event.target;

    setForm((current) => {
      const next = {
        ...current,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "name" && !editingId) {
        next.slug = generateSlug(value);
      }

      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    const price = Number(form.starting_price);

    if (!form.name.trim() || !form.slug.trim() || !form.description.trim()) {
      setError("Name, slug, and description are required.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setError("Enter a valid, non-negative starting price.");
      return;
    }

    for (const field of ["width_m", "length_m", "height_m"]) {
      if (form[field] !== "" &&
          (!Number.isFinite(Number(form[field])) || Number(form[field]) <= 0)) {
        setError(`${field.replace("_m", "")} must be a positive number.`);
        return;
      }
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      starting_price: price,
      width_m: form.width_m === "" ? null : Number(form.width_m),
      length_m: form.length_m === "" ? null : Number(form.length_m),
      height_m: form.height_m === "" ? null : Number(form.height_m),
      image_url: form.image_url.trim() || null,
      is_published: form.is_published,
    };

    setSaving(true);

    try {
      if (editingId !== null) {
        await updateShelter(editingId, payload);
        setNotice("Shelter updated successfully.");
      } else {
        await createShelter(payload);
        setNotice("Shelter created successfully.");
      }

      setEditingId(null);
      setForm({ ...EMPTY_FORM });
      await loadShelters();
    } catch (err) {
      setError(err.message || "Could not save the shelter.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(shelter) {
    const payload = {
      ...shelterToForm(shelter),
      starting_price: Number(shelter.starting_price),
      width_m: shelter.width_m == null ? null : Number(shelter.width_m),
      length_m: shelter.length_m == null ? null : Number(shelter.length_m),
      height_m: shelter.height_m == null ? null : Number(shelter.height_m),
      is_published: !shelter.is_published,
    };

    setError("");
    setNotice("");

    try {
      await updateShelter(shelter.id, payload);
      setNotice(
        `${shelter.name} is now ${payload.is_published ? "published" : "unpublished"}.`
      );
      await loadShelters();
    } catch (err) {
      setError(err.message || "Could not change publication status.");
    }
  }

  return (
    <main className="admin-page">
      <div className="admin-dashboard-header">
        <div>
          <Link to="/admin" className="admin-public-link">
            <ArrowLeft size={16} /> Back to enquiries
          </Link>
          <p className="admin-eyebrow">KYLE'S SHELTER SYSTEMS</p>
          <h1>Shelter management</h1>
          <p className="admin-muted">
            Create, update, and control which shelters appear on the public website.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="admin-secondary-button"
            onClick={loadShelters}
            disabled={loading}
          >
            <RefreshCw size={16} /> Refresh
          </button>

          <button
            type="button"
            className="admin-secondary-button"
            onClick={() => {
              logoutAdmin();
              window.location.assign("/admin/login");
            }}
          >
            Log out
          </button>
        </div>
      </div>

      {error && <div className="admin-alert admin-alert-error">{error}</div>}
      {notice && <div className="admin-alert admin-alert-success">{notice}</div>}

      <section className="admin-shelter-editor">
        <div className="admin-section-heading">
          <div>
            <p className="admin-eyebrow">
              {editingId !== null ? "EDIT SHELTER" : "NEW LISTING"}
            </p>
            <h2>{editingId !== null ? "Update shelter details" : "Add a shelter"}</h2>
          </div>

          {editingId !== null && (
            <button
              type="button"
              className="admin-secondary-button"
              onClick={startNewShelter}
            >
              <X size={16} /> Cancel editing
            </button>
          )}
        </div>

        <form className="admin-shelter-form" onSubmit={handleSubmit}>
          <label className="admin-form-field">
            <span>Shelter name *</span>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              maxLength={150}
              required
              placeholder="e.g. Industrial Storage Shelter"
            />
          </label>

          <label className="admin-form-field">
            <span>URL slug *</span>
            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              maxLength={180}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              title="Use lowercase letters, numbers, and single hyphens."
              required
              placeholder="industrial-storage-shelter"
            />
            <small>Used in the public page URL.</small>
          </label>

          <label className="admin-form-field admin-form-wide">
            <span>Description *</span>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              required
              placeholder="Describe the shelter, its uses, and key features."
            />
          </label>

          <label className="admin-form-field">
            <span>Starting price (CAD) *</span>
            <input
              name="starting_price"
              type="number"
              min="0"
              step="0.01"
              value={form.starting_price}
              onChange={handleChange}
              required
            />
          </label>

          <label className="admin-form-field">
            <span>Width (metres)</span>
            <input
              name="width_m"
              type="number"
              min="0.01"
              step="0.01"
              value={form.width_m}
              onChange={handleChange}
              placeholder="Optional"
            />
          </label>

          <label className="admin-form-field">
            <span>Length (metres)</span>
            <input
              name="length_m"
              type="number"
              min="0.01"
              step="0.01"
              value={form.length_m}
              onChange={handleChange}
              placeholder="Optional"
            />
          </label>

          <label className="admin-form-field">
            <span>Height (metres)</span>
            <input
              name="height_m"
              type="number"
              min="0.01"
              step="0.01"
              value={form.height_m}
              onChange={handleChange}
              placeholder="Optional"
            />
          </label>

          <label className="admin-form-field admin-form-wide">
            <span>Image URL</span>
            <input
              name="image_url"
              type="url"
              value={form.image_url}
              onChange={handleChange}
              placeholder="https://example.com/shelter-image.jpg"
            />
            <small>Use a direct, publicly accessible image URL.</small>
          </label>

          <label className="admin-publish-option">
            <input
              type="checkbox"
              name="is_published"
              checked={form.is_published}
              onChange={handleChange}
            />
            <span>
              <strong>Publish this shelter</strong>
              <small>
                Published shelters appear on the public website.
              </small>
            </span>
          </label>

          <div className="admin-form-actions admin-form-wide">
            <button
              type="submit"
              className="admin-primary-button"
              disabled={saving}
            >
              <Save size={17} />
              {saving
                ? "Saving..."
                : editingId !== null
                  ? "Save changes"
                  : "Create shelter"}
            </button>

            <button
              type="button"
              className="admin-secondary-button"
              onClick={startNewShelter}
              disabled={saving}
            >
              <Plus size={16} /> Clear form
            </button>
          </div>
        </form>
      </section>

      <section className="admin-shelter-list">
        <div className="admin-section-heading">
          <div>
            <p className="admin-eyebrow">YOUR CATALOGUE</p>
            <h2>All shelters</h2>
          </div>
          <span className="admin-count">{shelters.length} listings</span>
        </div>

        {loading ? (
          <p className="admin-muted">Loading shelters...</p>
        ) : shelters.length === 0 ? (
          <div className="admin-empty-state">
            <h3>No shelters yet</h3>
            <p>Create your first listing using the form above.</p>
          </div>
        ) : (
          <div className="admin-shelter-grid">
            {shelters.map((shelter) => (
              <article className="admin-shelter-card" key={shelter.id}>
                {shelter.image_url ? (
                  <img
                    className="admin-shelter-image"
                    src={shelter.image_url}
                    alt={shelter.name}
                    loading="lazy"
                  />
                ) : (
                  <div className="admin-shelter-image-placeholder">
                    Shelter image not added
                  </div>
                )}

                <div className="admin-shelter-card-content">
                  <div className="admin-shelter-card-title">
                    <h3>{shelter.name}</h3>
                    <span
                      className={`admin-publication-status ${
                        shelter.is_published ? "is-published" : "is-draft"
                      }`}
                    >
                      {shelter.is_published ? "Published" : "Draft"}
                    </span>
                  </div>

                  <p className="admin-shelter-slug">/{shelter.slug}</p>
                  <p className="admin-shelter-price">
                    {formatPrice(shelter.starting_price)}
                  </p>
                  <p className="admin-shelter-description">
                    {shelter.description}
                  </p>

                  <p className="admin-shelter-dimensions">
                    {shelter.width_m ?? "—"} m W ×{" "}
                    {shelter.length_m ?? "—"} m L ×{" "}
                    {shelter.height_m ?? "—"} m H
                  </p>

                  <div className="admin-shelter-card-actions">
                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={() => startEditing(shelter)}
                    >
                      <Pencil size={15} /> Edit
                    </button>

                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={() => togglePublished(shelter)}
                    >
                      {shelter.is_published ? "Unpublish" : "Publish"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
