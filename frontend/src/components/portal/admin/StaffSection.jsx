import { useState } from "react";
import Modal from "../Modal";
import PageHead from "../PageHead";
import { formatDate } from "../format";
import { ui } from "../ui";
import { clockTime } from "../doctor/chart";
import { ROLE_LABEL } from "./admin";
import TempPassword from "./TempPassword";
import { toLocalDateString } from "../../../utils/schedule";

const lastSeen = (moment, today) => {
  if (!moment) return "Never";
  const ymd = toLocalDateString(new Date(moment));
  return ymd === today ? `Today, ${clockTime(moment)}` : formatDate(ymd, { day: "numeric", month: "short", year: "numeric" });
};

// Reception and administration accounts; doctors are added from the Doctors page with their profile
function NewStaffDialog({ admin, onClose, onDoctors }) {
  const [role, setRole] = useState("receptionist");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  const create = async (e) => {
    e.preventDefault();
    if (username.trim().length < 3) return setError("Choose a username of at least 3 characters.");
    setBusy(true);
    setError("");
    const result = await admin.createUser({ role, username: username.trim() });
    setBusy(false);
    if (result.success) setDone({ username: result.data.user.username, password: result.data.tempPassword });
    else setError(result.message);
  };

  return (
    <Modal title={done ? "Account created" : "Add staff"} onClose={onClose}>
      {done ? (
        <>
          <TempPassword {...done} />
          <div className="mt-8 flex justify-end">
            <button type="button" onClick={onClose} className={ui.primary}>
              Done
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={create} className="grid gap-5">
          <fieldset>
            <legend className="text-[14px] font-medium text-ink">Role</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {["receptionist", "admin"].map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={role === r}
                  onClick={() => setRole(r)}
                  className={`h-11 border text-[14px] ${role === r ? "border-forest bg-forest text-ivory" : "border-ivory-line bg-white text-ink hover:border-forest"}`}
                >
                  {ROLE_LABEL[r]}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[13px] text-muted">
              Adding a doctor?{" "}
              <button type="button" onClick={onDoctors} className="text-forest underline underline-offset-4">
                Use the Doctors page
              </button>
              , so patients see their profile.
            </p>
          </fieldset>
          <div className="grid gap-2">
            <label htmlFor="staff-username" className="text-[14px] font-medium text-ink">
              Username
            </label>
            <input id="staff-username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. joelle.k" autoComplete="off" className={`${ui.input} h-12`} />
          </div>
          {error && (
            <p role="alert" className="text-[15px] text-alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className={ui.outline}>
              Cancel
            </button>
            <button type="submit" disabled={busy} className={ui.primary}>
              {busy ? "Creating…" : "Create account"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function ResetDialog({ user, admin, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState(null);

  const reset = async () => {
    setBusy(true);
    const result = await admin.resetPassword(user.id);
    setBusy(false);
    if (result.success) setPassword(result.data.tempPassword);
    else setError(result.message);
  };

  return (
    <Modal title={password ? "Password reset" : `Reset the password of ${user.name || user.username}?`} onClose={onClose}>
      {password ? (
        <TempPassword username={user.username} password={password} />
      ) : (
        <p className="text-[16px] leading-relaxed text-muted">Their current password stops working. They get a temporary one and choose their own at next sign-in.</p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-[15px] text-alert">
          {error}
        </p>
      )}
      <div className="mt-8 flex justify-end gap-3">
        {password ? (
          <button type="button" onClick={onClose} className={ui.primary}>
            Done
          </button>
        ) : (
          <>
            <button type="button" onClick={onClose} className={ui.outline}>
              Cancel
            </button>
            <button type="button" onClick={reset} disabled={busy} className={ui.primary}>
              {busy ? "Resetting…" : "Reset password"}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}

export default function StaffSection({ admin, now, me, onDoctors }) {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("staff");
  const [adding, setAdding] = useState(false);
  const [resetting, setResetting] = useState(null);
  const today = toLocalDateString(now);

  const query = search.trim().toLowerCase();
  const rows = admin.users
    .filter((u) => (role === "staff" ? u.role !== "patient" : role === "all" || u.role === role))
    .filter((u) => !query || `${u.name || ""} ${u.username}`.toLowerCase().includes(query));

  return (
    <>
      <PageHead
        title="Staff"
        intro="Accounts for doctors, reception and administration. Patients create their own accounts."
        action={
          <button type="button" onClick={() => setAdding(true)} className={ui.primary}>
            Add staff
          </button>
        }
      />
      <div className={`${ui.page} pb-24`}>
        <div className="flex flex-wrap items-end gap-4">
          <div className="grid min-w-[240px] flex-1 gap-2 sm:max-w-sm">
            <label htmlFor="staff-search" className="text-[14px] font-medium text-ink">
              Search
            </label>
            <input id="staff-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or username" className={`${ui.input} h-12`} />
          </div>
          <div className="grid gap-2">
            <label htmlFor="staff-role" className="text-[14px] font-medium text-ink">
              Role
            </label>
            <select id="staff-role" value={role} onChange={(e) => setRole(e.target.value)} className={`${ui.input} h-12 px-3`}>
              <option value="staff">All staff</option>
              <option value="doctor">Doctors</option>
              <option value="receptionist">Reception</option>
              <option value="admin">Administration</option>
              <option value="patient">Patients</option>
            </select>
          </div>
        </div>

        <div className="relative mt-8 overflow-x-auto border border-ivory-line bg-white">
          <table className="w-full min-w-[760px] text-left text-[15px]">
            <thead>
              <tr className="border-b border-ivory-line text-[13px] text-muted">
                {["Name", "Username", "Role", "Since", "Last sign-in"].map((h) => (
                  <th key={h} className="px-5 py-3 font-normal">
                    {h}
                  </th>
                ))}
                <th className="px-5 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-b border-ivory-line last:border-b-0">
                  <td className="px-5 py-4">
                    <span className="block text-ink">{u.name || u.username}</span>
                    {u.detail && <span className="text-[13px] text-muted">{u.detail}</span>}
                  </td>
                  <td className="px-5 py-4 text-muted">{u.username}</td>
                  <td className="px-5 py-4">{ROLE_LABEL[u.role]}</td>
                  <td className="px-5 py-4 tabular-nums">{new Date(u.createdAt).getFullYear()}</td>
                  <td className="px-5 py-4">
                    {u.mustChangePassword ? <span className="text-champagne">Waiting for first sign-in</span> : lastSeen(u.lastLoginAt, today)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {u.id === me ? (
                      <span className="text-[13px] text-muted">You</span>
                    ) : (
                      <button type="button" onClick={() => setResetting(u)} className={`${ui.link} text-[14px]`}>
                        Reset password
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="p-6 text-[15px] text-muted">No account matches.</p>}
        </div>
        <p className="mt-4 text-[14px] text-muted">New accounts and reset passwords get a temporary password; the person chooses their own at first sign-in.</p>
      </div>

      {adding && (
        <NewStaffDialog
          admin={admin}
          onClose={() => setAdding(false)}
          onDoctors={() => {
            setAdding(false);
            onDoctors();
          }}
        />
      )}
      {resetting && <ResetDialog user={resetting} admin={admin} onClose={() => setResetting(null)} />}
    </>
  );
}
