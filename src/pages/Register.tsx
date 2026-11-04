import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../stores/auth";
import { Logo } from "../components/AppLayout";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

/** Registration: email + unique username + password. Data goes to the real backend. */
export function RegisterPage() {
  const { register, status, error, busy } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  if (status === "authenticated") return <Navigate to="/" replace />;

  const usernameOk = USERNAME_RE.test(username);
  const passwordsMatch = password === confirm && password.length >= 8;
  const canSubmit = email.includes("@") && usernameOk && passwordsMatch;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const ok = await register({ email: email.trim(), username: username.trim(), password, displayName: displayName.trim() || undefined });
    if (ok) navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo />
          <h1 className="text-xl font-extrabold">Создать аккаунт DELTA</h1>
          <p className="text-sm text-muted">Бесплатно. Музыка, плейлисты и общение.</p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Email</span>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Имя пользователя (уникальное)</span>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="например, nova_wave"
            autoComplete="username"
            required
          />
          {username && !usernameOk && (
            <span className="text-xs text-danger">3–20 символов: латиница, цифры, «_»</span>
          )}
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Отображаемое имя (необязательно)</span>
          <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Пароль (мин. 8 символов)</span>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Повторите пароль</span>
          <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
          {confirm && !passwordsMatch && <span className="text-xs text-danger">Пароли не совпадают или пароль короче 8 символов</span>}
        </label>

        {error && (
          <p className="rounded-card bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={busy || !canSubmit}>
          {busy ? "Регистрация…" : "Зарегистрироваться"}
        </button>

        <p className="text-center text-sm text-muted">
          Уже есть аккаунт?{" "}
          <Link to="/login" className="font-semibold text-accent hover:underline">
            Войти
          </Link>
        </p>
      </form>
    </div>
  );
}
