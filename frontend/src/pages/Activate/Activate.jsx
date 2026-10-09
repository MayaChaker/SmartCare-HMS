import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { authAPI } from "../../utils/api";
import AuthLayout from "../../components/auth/AuthLayout";
import TextField from "../../components/auth/TextField";
import { BusyLabel } from "../../components/Loader";

const emptyForm = { code: "", username: "", password: "", confirmPassword: "" };

function validate(form) {
  const errors = {};
  if (form.code.replace(/[^a-z0-9]/gi, "").length !== 8) errors.code = "The code has 8 letters and numbers, for example K7QM-4ZRP.";
  if (form.username.trim().length < 3) errors.username = "Use at least 3 characters.";
  if (form.password.length < 6) errors.password = "Use at least 6 characters.";
  if (form.confirmPassword !== form.password) errors.confirmPassword = "The passwords do not match.";
  return errors;
}

// For patients whose file was opened at the front desk: they choose their own login with the code they were given
export default function Activate() {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((errs) => ({ ...errs, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const found = validate(form);
    setErrors(found);
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      e.currentTarget.elements[firstInvalid]?.focus();
      return;
    }

    setLoading(true);
    try {
      const username = form.username.trim();
      await authAPI.activate({ code: form.code, username, password: form.password });
      const signedIn = await login({ username, password: form.password });
      // Straight to the profile, where the patient adds their health information
      navigate(signedIn.success ? "/dashboard#profile" : "/login");
    } catch (error) {
      setServerError(error.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const field = (name) => ({ name, value: form[name], onChange: handleChange, error: errors[name] });

  return (
    <AuthLayout
      image="/images/site/center-executive.jpg"
      imageAlt="A doctor measuring a patient's blood pressure"
      title="Your file is ready."
      intro="Reception opened your patient file. Choose how you sign in, then add your health information so your doctors have it before every visit."
    >
      <h2 className="font-serif text-5xl leading-tight text-ink">Activate your account</h2>
      <p className="mt-3 text-[16px] text-muted">Use the code reception gave you. It works once.</p>

      {serverError && (
        <p role="alert" className="mt-8 border-l-2 border-alert bg-alert/5 px-4 py-3 text-[15px] text-alert">
          {serverError}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-8 grid gap-6">
        <TextField label="Code from reception" autoComplete="one-time-code" placeholder="K7QM-4ZRP" style={{ textTransform: "uppercase" }} {...field("code")} />
        <TextField label="Username" autoComplete="username" placeholder="e.g. lina.haddad" hint="At least 3 characters. You will use it to sign in." {...field("username")} />
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField label="Password" type="password" autoComplete="new-password" placeholder="6+ characters" {...field("password")} />
          <TextField label="Confirm password" type="password" autoComplete="new-password" placeholder="Type it again" {...field("confirmPassword")} />
        </div>
        <button type="submit" disabled={loading} aria-busy={loading} className="flex h-12 items-center justify-center bg-forest text-[15px] tracking-wide text-ivory transition-colors hover:bg-forest-soft disabled:opacity-70 aria-busy:cursor-wait aria-busy:opacity-100">
          <BusyLabel busy={loading} busyText="Activating…" text="Activate account" />
        </button>
        <p className="text-[15px] text-muted">
          No code?{" "}
          <Link to="/register" className="border-b border-champagne text-forest hover:text-champagne">
            Create an account
          </Link>{" "}
          or{" "}
          <Link to="/login" className="border-b border-champagne text-forest hover:text-champagne">
            sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
