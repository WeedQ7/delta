import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../stores/auth";
import { Logo } from "../components/AppLayout";

/** Login with email or username. Errors come from the server (real messages). */
export function LoginPage() {
  const { login, status, error, busy } = useAuth();
  const navigate = useNavigate();
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");

  if (status === "authenticated") return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginValue.trim() || !password) return;
    const ok = await login(loginValue.trim(), password);
    if (ok) navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-5 p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo />
          <h1 className="text-xl font-extrabold">С возвращением</h1>
          <p className="text-sm text-muted">Войдите, чтобы продолжить слушать и общаться.</p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Email или имя пользователя</span>
          <input
            className="input"
            value={loginValue}
            onChange={(e) => setLoginValue(e.target.value)}
            autoComplete="username"
            autoFocus
            required
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Пароль</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && (
          <p className="rounded-card bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={busy || !loginValue.trim() || !password}>
          {busy ? "Вход…" : "Войти"}
        </button>

        <p className="text-center text-sm text-muted">
          Нет аккаунта?{" "}
          <Link to="/register" className="font-semibold text-accent hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </form>
    </div>
  );
}
