import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import AuthLayout from "../../components/auth/AuthLayout";
import TextField from "../../components/auth/TextField";

const emptyForm = {
  firstName: "",
  lastName: "",
  dob: "",
  contact: "",
  username: "",
  password: "",
  confirmPassword: "",
};

// Returns { field: message } for every field that needs fixing
function validate(form) {
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = "Please enter your first name.";
  if (!form.lastName.trim()) errors.lastName = "Please enter your last name.";
  if (!form.dob) errors.dob = "Please enter your date of birth.";
  else if (form.dob > new Date().toISOString().slice(0, 10)) errors.dob = "The date of birth cannot be in the future.";
  if (form.contact.replace(/\D/g, "").length < 7) errors.contact = "Please enter a phone number with at least 7 digits.";
  if (form.username.trim().length < 3) errors.username = "Use at least 3 characters.";
  if (form.password.length < 6) errors.password = "Use at least 6 characters.";
  if (form.confirmPassword !== form.password) errors.confirmPassword = "The passwords do not match.";
  return errors;
}

export default function Register() {
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((errs) => ({ ...errs, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const found = validate(formData);
    setErrors(found);
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      e.currentTarget.elements[firstInvalid]?.focus();
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword: _confirm, ...data } = formData;
      const result = await register({
        ...data,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        username: data.username.trim(),
        contact: data.contact.trim(),
      });
      if (result.success) {
        navigate("/dashboard");
      } else {
        setServerError(result.error);
      }
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const field = (name) => ({ name, value: formData[name], onChange: handleChange, error: errors[name] });
  const today = new Date().toISOString().slice(0, 10);

  return (
    <AuthLayout
      image="/images/site/center-executive.jpg"
      imageAlt="A doctor measuring a patient's blood pressure"
      title="Care that starts with you."
      intro="Create your patient account to book visits, follow your appointments and read your visit summaries."
    >
      <h2 className="font-serif text-5xl leading-tight text-ink">Create your account</h2>
      <p className="mt-3 text-[16px] text-muted">It takes a minute. Your information stays confidential.</p>

      {serverError && (
        <p role="alert" className="mt-8 border-l-2 border-alert bg-alert/5 px-4 py-3 text-[15px] text-alert">
          {serverError}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-8 grid gap-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField label="First name" autoComplete="given-name" placeholder="e.g. Lina" {...field("firstName")} />
          <TextField label="Last name" autoComplete="family-name" placeholder="e.g. Haddad" {...field("lastName")} />
          <TextField label="Date of birth" type="date" max={today} autoComplete="bday" {...field("dob")} />
          <TextField label="Phone number" type="tel" autoComplete="tel" placeholder="+961 70 123 456" {...field("contact")} />
        </div>

        <div className="grid gap-6">
          <TextField
            label="Username"
            autoComplete="username"
            placeholder="e.g. lina.haddad"
            hint="At least 3 characters. You will use it to sign in."
            {...field("username")}
          />
          <div className="grid gap-6 sm:grid-cols-2">
            <TextField
              label="Password"
              type="password"
              autoComplete="new-password"
              placeholder="6+ characters"
              {...field("password")}
            />
            <TextField
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              placeholder="Type it again"
              {...field("confirmPassword")}
            />
          </div>
        </div>

        <div className="grid gap-6">
          <button
            type="submit"
            disabled={loading}
            className="h-12 bg-forest text-[15px] tracking-wide text-ivory transition-colors hover:bg-forest-soft disabled:opacity-70"
          >
            {loading ? "Creating your account…" : "Create account"}
          </button>
          <p className="text-[15px] text-muted">
            Already have an account?{" "}
            <Link to="/login" className="border-b border-champagne text-forest hover:text-champagne">
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
