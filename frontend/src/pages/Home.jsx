import { useEffect, useState } from "react";
import { ArrowDown, ArrowRight, Ruler, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { getShelters } from "../services/api";

function formatPrice(price) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(Number(price));
}

function ShelterCard({ shelter }) {
  const dimensions = [
    shelter.width_m && `${Number(shelter.width_m)}m wide`,
    shelter.length_m && `${Number(shelter.length_m)}m long`,
    shelter.height_m && `${Number(shelter.height_m)}m high`,
  ].filter(Boolean);

  return (
    <article className="shelter-card">
      <Link
        to={`/shelters/${encodeURIComponent(shelter.slug)}`}
        className="shelter-card-main"
        aria-label={`View details for ${shelter.name}`}
      >
        <div className="shelter-image">
          {shelter.image_url ? (
            <img src={shelter.image_url} alt={shelter.name} />
          ) : (
            <div className="image-placeholder">
              <span>STRUCTURE / {String(shelter.id).padStart(2, "0")}</span>
              <div className="placeholder-lines" />
              <p>Product photography coming soon</p>
            </div>
          )}
          <span className="product-tag">SHELTER COLLECTION</span>
        </div>

        <div className="shelter-content">
          <p className="eyebrow">ENGINEERED FOR PURPOSE</p>
          <h3>{shelter.name}</h3>
          <p className="shelter-description">{shelter.description}</p>

          {dimensions.length > 0 && (
            <div className="dimensions">
              <Ruler size={16} />
              <span>{dimensions.join(" · ")}</span>
            </div>
          )}
        </div>
      </Link>

      <div className="card-footer shelter-card-footer">
        <div>
          <span className="price-label">Starting from</span>
          <strong>{formatPrice(shelter.starting_price)}</strong>
        </div>
        <Link
          className="round-link"
          to={`/shelters/${encodeURIComponent(shelter.slug)}`}
          aria-label={`View ${shelter.name} details`}
        >
          <ArrowRight size={20} />
        </Link>
      </div>
    </article>
  );
}

export default function Home() {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getShelters()
      .then((data) => {
        if (active) setShelters(data);
      })
      .catch(() => {
        if (active) {
          setError(
            "We couldn't load the shelter catalogue. Please check that the backend is running and try again."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main>
      <section className="hero">
        <nav className="navigation">
          <a className="brand" href="#">
            <span className="brand-mark">K</span>
            <span>KYLE'S<span className="brand-subtitle">SHELTER SYSTEMS</span></span>
          </a>
          <div className="nav-links">
            <a href="#collection">Collection</a>
            <a href="#about">Our approach</a>
            <a className="nav-cta" href="#collection">
              Explore shelters <ArrowRight size={16} />
            </a>
          </div>
        </nav>

        <div className="hero-content">
          <p className="eyebrow hero-eyebrow">
            PRACTICAL DESIGN. BUILT WITH PURPOSE.
          </p>
          <h1>
            Space for
            <br />
            <span>what matters.</span>
          </h1>
          <p className="hero-copy">
            Discover shelter solutions designed around your space, your needs,
            and the way you work.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#collection">
              Explore the collection <ArrowRight size={18} />
            </a>
            <a className="text-button" href="#about">
              Our approach <ArrowDown size={16} />
            </a>
          </div>
        </div>

        <div className="hero-bottom">
          <span>THOUGHTFUL STRUCTURES</span>
          <span>DESIGNED AROUND YOUR NEEDS</span>
          <span>01 / SHELTER COLLECTION</span>
        </div>
      </section>

      <section className="collection section-shell" id="collection">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FIND YOUR SOLUTION</p>
            <h2>Explore the collection<span>.</span></h2>
          </div>
          <p className="section-intro">
            Start with a model that fits your needs. We can help you explore
            the specifications and discuss a solution for your project.
          </p>
        </div>

        {loading && (
          <p className="status-message">Loading the shelter collection…</p>
        )}

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Try again</button>
          </div>
        )}

        {!loading && !error && shelters.length === 0 && (
          <div className="status-message">
            <h3>The collection is being prepared.</h3>
            <p>Please check back soon for available shelter models.</p>
          </div>
        )}

        {!loading && !error && shelters.length > 0 && (
          <>
            <p className="results-count">
              {String(shelters.length).padStart(2, "0")} MODELS
            </p>
            <div className="shelter-grid">
              {shelters.map((shelter) => (
                <ShelterCard key={shelter.id} shelter={shelter} />
              ))}
            </div>
            {shelters.some((shelter) =>
              shelter.description.includes("Demonstration record only")
            ) && (
              <p className="sample-notice">
                Preview catalogue: the displayed models, specifications, and
                prices include sample data and must be verified before launch.
              </p>
            )}
          </>
        )}
      </section>

      <section className="approach" id="about">
        <div className="approach-inner">
          <div>
            <p className="eyebrow">A BETTER WAY TO GET STARTED</p>
            <h2>
              The right shelter
              <br />
              starts with <span>your needs.</span>
            </h2>
          </div>
          <div className="approach-copy">
            <ShieldCheck size={30} strokeWidth={1.5} />
            <p>
              Every project starts with understanding what you need. Explore
              available models, compare dimensions, and get in touch to discuss
              the next steps.
            </p>
            <a href="#collection" className="text-button">
              Find your model <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      <footer className="footer">
        <a className="brand footer-brand" href="#">
          <span className="brand-mark">K</span>
          <span>KYLE'S<span className="brand-subtitle">SHELTER SYSTEMS</span></span>
        </a>
        <span>DESIGNED AROUND YOUR NEEDS.</span>
        <span>© {new Date().getFullYear()} Kyle's Shelter Systems</span>
      </footer>
    </main>
  );
}
