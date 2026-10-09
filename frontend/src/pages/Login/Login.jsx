import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import AuthLayout from "../../components/auth/AuthLayout";
import TextField from "../../components/auth/TextField";

// Public demo accounts; the buttons only appear when VITE_DEMO_PASSWORD is set
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD;
const DEMO_ACCOUNTS = [
  { label: "Patient", detail: "Visits and records", username: "demo.patient" },
  { label: "Doctor", detail: "Dr. Karim Mansour", username: "dr.karim.mansour" },
  { label: "Reception", detail: "Front desk", username: "demo.reception" },
  { label: "Admin", detail: "Hospital overview", username: "demo.admin" },
];

const HOME_BY_ROLE = {
  admin: "/admin",
  doctor: "/doctor",
  receptionist: "/receptionist",
  patient: "/dashboard",
};

export default function Login() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [slowServer, setSlowServer] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // The free backend sleeps when idle; explain the wait if sign-in takes a while
  useEffect(() => {
    if (!loading) {
      setSlowServer(false);
      return undefined;
    }
    const timer = setTimeout(() => setSlowServer(true), 3000);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const signIn = async (rawUsername, rawPassword) => {
    const username = String(rawUsername || "").trim();
    const password = String(rawPassword || "").trim();
    if (!username || !password) {
      setError("Please enter your username and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await login({ username, password });
      if (result.success) {
        navigate(result.data.user.mustChangePassword ? "/change-password" : HOME_BY_ROLE[result.data.user.role] || "/dashboard");
      } else {
        setError(result.error);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    signIn(formData.username, formData.password);
  };

  return (
    <AuthLayout
      image="/images/site/corridor.jpg"
      imageAlt="The light-filled glass corridor of the SmartCare inpatient wing"
      title="Welcome back."
      intro="Your visits, results and prescriptions, in one private place."
    >
      <h2 className="font-serif text-5xl leading-tight text-ink">Sign in</h2>
      <p className="mt-3 text-[16px] text-muted">For patients and SmartCare staff.</p>

      {error && (
        <p role="alert" className="mt-8 border-l-2 border-alert bg-alert/5 px-4 py-3 text-[15px] text-alert">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-8 grid gap-6">
        <TextField
          label="Username"
          name="username"
          autoComplete="username"
          placeholder="e.g. lina.haddad"
          value={formData.username}
          onChange={handleChange}
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={formData.password}
          onChange={handleChange}
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-2 h-12 bg-forest text-[15px] tracking-wide text-ivory transition-colors hover:bg-forest-soft disabled:opacity-70"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
        {slowServer && (
          <p role="status" className="text-[14px] text-muted">
            Waking up the server. This can take up to a minute the first time.
          </p>
        )}
      </form>

      <p className="mt-8 text-[15px] text-muted">
        New patient?{" "}
        <Link to="/register" className="border-b border-champagne text-forest hover:text-champagne">
          Create an account
        </Link>
      </p>

      {DEMO_PASSWORD && (
        <section aria-labelledby="demo-title" className="mt-12 border-t border-ivory-line pt-8">
          <h3 id="demo-title" className="text-[15px] font-medium text-ink">
            Explore the demo
          </h3>
          <p className="mt-1 text-[14px] text-muted">Sign in to a sample account with one click.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.username}
                type="button"
                disabled={loading}
                onClick={() => signIn(account.username, DEMO_PASSWORD)}
                className="border border-ivory-line bg-white px-4 py-3 text-left transition-colors hover:border-forest disabled:opacity-60"
              >
                <span className="block text-[15px] text-ink">{account.label}</span>
                <span className="block text-[13px] text-muted">{account.detail}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </AuthLayout>
  );
}
