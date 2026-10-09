import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { authAPI } from "../../utils/api";
import AuthLayout from "../../components/auth/AuthLayout";
import TextField from "../../components/auth/TextField";
import { BusyLabel } from "../../components/Loader";

const HOME_BY_ROLE = { admin: "/admin", doctor: "/doctor", receptionist: "/receptionist", patient: "/dashboard" };
const emptyForm = { currentPassword: "", newPassword: "", confirmPassword: "" };

function validate(form) {
  const errors = {};
  if (!form.currentPassword) errors.currentPassword = "Enter the password you signed in with.";
  if (form.newPassword.length < 6) errors.newPassword = "Use at least 6 characters.";
  else if (form.newPassword === form.currentPassword) errors.newPassword = "Choose a password different from the current one.";
  if (form.confirmPassword !== form.newPassword) errors.confirmPassword = "The passwords do not match.";
  return errors;
}

// Staff given a temporary password choose their own here before using the system
export default function ChangePassword() {
  const { user, passwordChanged, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

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
      await authAPI.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      passwordChanged();
      navigate(HOME_BY_ROLE[user.role] || "/");
    } catch (error) {
      setServerError(error.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const field = (name) => ({ name, value: form[name], onChange: handleChange, error: errors[name] });

  return (
    <AuthLayout
      image="/images/site/corridor.jpg"
      imageAlt="A bright hospital corridor"
      title="One last step."
      intro="Your account was set up with a temporary password. Choose your own, known only to you."
    >
      <h2 className="font-serif text-5xl leading-tight text-ink">Choose your password</h2>
      <p className="mt-3 text-[16px] text-muted">
        Signed in as <span className="text-ink">{user.username}</span>.
      </p>

      {serverError && (
        <p role="alert" className="mt-8 border-l-2 border-alert bg-alert/5 px-4 py-3 text-[15px] text-alert">
          {serverError}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-8 grid gap-6">
        <TextField label="Temporary password" type="password" autoComplete="current-password" {...field("currentPassword")} />
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField label="New password" type="password" autoComplete="new-password" placeholder="6+ characters" {...field("newPassword")} />
          <TextField label="Confirm new password" type="password" autoComplete="new-password" placeholder="Type it again" {...field("confirmPassword")} />
        </div>
        <button type="submit" disabled={loading} aria-busy={loading} className="flex h-12 items-center justify-center bg-forest text-[15px] tracking-wide text-ivory transition-colors hover:bg-forest-soft disabled:opacity-70 aria-busy:cursor-wait aria-busy:opacity-100">
          <BusyLabel busy={loading} text="Save and continue" />
        </button>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="justify-self-start text-[15px] text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Sign out
        </button>
      </form>
    </AuthLayout>
  );
}
