import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { submitEnquiry } from "../services/api";

const initialValues = {
  customerName: "",
  email: "",
  phone: "",
  intendedUse: "",
  preferredWidth: "",
  preferredLength: "",
  preferredHeight: "",
  projectLocation: "",
  message: "",
};

export default function EnquiryForm({ shelter }) {
  const [values, setValues] = useState(() => ({
    ...initialValues,
    preferredWidth: shelter.width_m ?? "",
    preferredLength: shelter.length_m ?? "",
    preferredHeight: shelter.height_m ?? "",
  }));

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;

    setValues((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(null);

    const dimension = (value) =>
      value.trim() === "" ? null : Number(value);

    const enquiry = {
      shelterId: Number(shelter.id),
      customerName: values.customerName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      intendedUse: values.intendedUse.trim(),
      preferredWidth: dimension(values.preferredWidth),
      preferredLength: dimension(values.preferredLength),
      preferredHeight: dimension(values.preferredHeight),
      projectLocation: values.projectLocation.trim(),
      message: values.message.trim(),
    };

    try {
      const result = await submitEnquiry(enquiry);

      setSuccess({
        id: result.data.id,
        message:
          result.message ||
          "Your enquiry has been submitted successfully.",
      });

      setValues(initialValues);
    } catch (err) {
      setError(
        err.message ||
          "We couldn't submit your enquiry. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <section className="enquiry-success" aria-live="polite">
        <CheckCircle2 size={34} />
        <h2>Thank you for your enquiry.</h2>
        <p>{success.message}</p>
        <p>
          Your reference number is <strong>#{success.id}</strong>.
          Keep it for your records.
        </p>
        <button
          type="button"
          className="enquiry-reset-button"
          onClick={() => setSuccess(null)}
        >
          Submit another enquiry
        </button>
      </section>
    );
  }

  return (
    <section className="enquiry-form-section" id="request-quotation">
      <div className="enquiry-form-heading">
        <p className="eyebrow">LET'S DISCUSS YOUR PROJECT</p>
        <h2>Request a quotation</h2>
        <p>
          Tell us what you need for{" "}
          <strong>{shelter.name}</strong>. Our team can use these details
          to follow up about your requirements.
        </p>
      </div>

      <form className="enquiry-form" onSubmit={handleSubmit}>
        <div className="enquiry-field">
          <label htmlFor="customerName">Full name *</label>
          <input
            id="customerName"
            name="customerName"
            autoComplete="name"
            value={values.customerName}
            onChange={handleChange}
            maxLength={150}
            required
          />
        </div>

        <div className="enquiry-field">
          <label htmlFor="email">Email address *</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={handleChange}
            maxLength={254}
            required
          />
        </div>

        <div className="enquiry-field">
          <label htmlFor="phone">Phone number *</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={handleChange}
            maxLength={30}
            placeholder="+254..."
            required
          />
        </div>

        <div className="enquiry-field">
          <label htmlFor="intendedUse">Intended use</label>
          <input
            id="intendedUse"
            name="intendedUse"
            value={values.intendedUse}
            onChange={handleChange}
            maxLength={150}
            placeholder="e.g. storage, workshop, livestock"
          />
        </div>

        <fieldset className="enquiry-dimensions">
          <legend>Preferred dimensions (metres)</legend>

          <div className="enquiry-dimension-grid">
            {[
              ["preferredWidth", "Width"],
              ["preferredLength", "Length"],
              ["preferredHeight", "Height"],
            ].map(([name, label]) => (
              <div className="enquiry-field" key={name}>
                <label htmlFor={name}>{label}</label>
                <input
                  id={name}
                  name={name}
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={values[name]}
                  onChange={handleChange}
                />
              </div>
            ))}
          </div>
          <p className="enquiry-hint">
            Dimensions are prefilled from this model. You can change them
            or leave them blank if you're unsure.
          </p>
        </fieldset>

        <div className="enquiry-field">
          <label htmlFor="projectLocation">Project location</label>
          <input
            id="projectLocation"
            name="projectLocation"
            value={values.projectLocation}
            onChange={handleChange}
            maxLength={200}
            placeholder="Town or county"
          />
        </div>

        <div className="enquiry-field enquiry-field-full">
          <label htmlFor="message">Additional requirements</label>
          <textarea
            id="message"
            name="message"
            rows={4}
            value={values.message}
            onChange={handleChange}
            placeholder="Tell us about your project, timeline, or special requirements."
          />
        </div>

        {error && (
          <p className="enquiry-error" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="primary-button enquiry-submit-button"
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit enquiry"}
          {!submitting && <Send size={17} />}
        </button>

        <p className="enquiry-privacy-note">
          Your details will be sent to our enquiry system so your request
          can be followed up.
        </p>
      </form>
    </section>
  );
}
