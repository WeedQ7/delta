import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { socialApi, type ApiNotification } from "../lib/api";
import { useAuth } from "../stores/auth";
import { Spinner, ErrorBox, toast } from "../components/ui";
import { EmptyState } from "../components/EmptyState";
import { IconBell } from "../components/Icons";

const LABELS: Record<string, string> = {
  FOLLOW: "подписился(-ась) на вас",
  LIKE_POST: "оценил(а) вашу публикацию",
  COMMENT: "прокомментировал(а) вашу публикацию",
};

export function NotificationsPage() {
  const status = useAuth((s) => s.status);
  const [items, setItems] = useState<ApiNotification[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    socialApi.notifications().then(setItems).catch((e) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  if (status !== "authenticated") {
    return <EmptyState title="Уведомления доступны после входа" action={<Link to="/login" className="btn-primary">Войти</Link>} />;
  }
  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (items === null) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="section-title flex items-center gap-2 text-2xl">
          <IconBell size={22} className="text-accent" /> Уведомления
        </h1>
        {items.some((i) => !i.read) && (
          <button
            className="btn-ghost text-sm"
            onClick={async () => {
              await socialApi.markRead();
              setItems(items.map((i) => ({ ...i, read: true })));
              toast("Отмечено прочитанным");
            }}
          >
            Прочитать все
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState icon={<IconBell size={22} />} title="Уведомлений нет" hint="Здесь появятся подписки, лайки и комментарии к вашим публикациям." />
      ) : (
        <ul className="card divide-y divide-line">
          {items.map((n) => (
            <li key={n.id} className={`flex items-center gap-3 px-4 py-3 text-sm ${n.read ? "text-muted" : ""}`}>
              <span className={`h-2 w-2 shrink-0 rounded-pill ${n.read ? "bg-transparent" : "bg-accent"}`} />
              <span className="min-w-0 flex-1 truncate">
                <Link to={`/u/${n.actor?.username ?? ""}`} className="font-semibold text-fg hover:text-accent">
                  @{n.actor?.username ?? "кто-то"}
                </Link>{" "}
                {LABELS[n.type] ?? n.type}
              </span>
              <span className="shrink-0 text-xs text-faint">{new Date(n.createdAt).toLocaleDateString("ru-RU")}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
