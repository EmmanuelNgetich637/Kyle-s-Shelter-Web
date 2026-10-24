import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Ruler,
  ShieldCheck,
} from "lucide-react";
import { getShelterBySlug } from "../services/api";
import EnquiryForm from "../components/EnquiryForm";

function formatPrice(price) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(Number(price));
}

export default function ShelterDetails() {
  const { slug } = useParams();
  const [shelter, setShelter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");
    setShelter(null);

    getShelterBySlug(slug)
      .then((data) => {
        if (active) setShelter(data);
      })
      .catch((err) => {
        if (active) {
          setError(
            err.status === 404
              ? "This shelter could not be found or is no longer available."
              : "We couldn't load this shelter. Please try again."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="detail-state">
        <p className="eyebrow">SHELTER COLLECTION</p>
        <h1>Loading shelter details…</h1>
      </main>
    );
  }

  if (error || !shelter) {
    return (
      <main className="detail-state">
        <p className="eyebrow">SHELTER COLLECTION</p>
        <h1>Shelter unavailable.</h1>
        <p>{error || "We couldn't find that shelter."}</p>
        <Link className="primary-button" to="/">
          <ArrowLeft size={17} /> Back to collection
        </Link>
      </main>
    );
  }

  const dimensions = [
    { label: "Width", value: shelter.width_m, unit: "m" },
    { label: "Length", value: shelter.length_m, unit: "m" },
    { label: "Height", value: shelter.height_m, unit: "m" },
  ].filter((item) => item.value !== null && item.value !== undefined);

  const isSample = shelter.description.includes(
    "Demonstration record only"
  );

  return (
    <main className="detail-page">
      <div className="detail-topbar">
        <Link to="/" className="back-link">
          <ArrowLeft size={17} /> Back to collection
        </Link>

        <Link to="/" className="brand detail-brand">
          <span className="brand-mark">K</span>
          <span>
            KYLE'S
            <span className="brand-subtitle">SHELTER SYSTEMS</span>
          </span>
        </Link>
      </div>

      <section className="detail-layout">
        <div className="detail-visual">
          {shelter.image_url ? (
            <img src={shelter.image_url} alt={shelter.name} />
          ) : (
            <div className="detail-placeholder">
              <span className="detail-placeholder-label">
                SHELTER / {String(shelter.id).padStart(2, "0")}
              </span>
              <div className="detail-placeholder-shape" />
              <p>Product photography coming soon</p>
            </div>
          )}
          <span className="detail-image-caption">
            KYLE'S SHELTER SYSTEMS — PRODUCT COLLECTION
          </span>
        </div>

        <div className="detail-information">
          <p className="eyebrow">SHELTER COLLECTION / MODEL DETAILS</p>
          <h1>{shelter.name}</h1>

          <p className="detail-description">{shelter.description}</p>

          <div className="detail-price-block">
            <span className="price-label">Starting price</span>
            <strong>{formatPrice(shelter.starting_price)}</strong>
            <span className="detail-price-note">
              Final pricing should be confirmed for your project.
            </span>
          </div>

          {dimensions.length > 0 && (
            <div className="specification-block">
              <h2>
                <Ruler size={19} /> Dimensions
              </h2>

              <div className="specification-grid">
                {dimensions.map((dimension) => (
                  <div className="specification-item" key={dimension.label}>
                    <span>{dimension.label}</span>
                    <strong>
                      {Number(dimension.value)} {dimension.unit}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="detail-assurance">
            <ShieldCheck size={21} />
            <p>
              Need different dimensions or more information? Contact us to
              discuss your project requirements.
            </p>
          </div>

          <EnquiryForm shelter={shelter} />

          {isSample && (
            <p className="detail-sample-notice">
              Sample data only: this model, its dimensions, and its price
              have not yet been verified against the actual catalogue.
            </p>
          )}

          <div className="detail-benefits">
            <div>
              <CheckCircle2 size={16} />
              <span>Discuss your requirements</span>
            </div>
            <div>
              <CheckCircle2 size={16} />
              <span>Request project-specific pricing</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="detail-footer">
        <Link to="/" className="back-link">
          <ArrowLeft size={16} /> Explore other shelters
        </Link>
        <span>© {new Date().getFullYear()} Kyle's Shelter Systems</span>
      </footer>
    </main>
  );
}
