import { useEffect, useState } from "react";
import { useAuth } from "../stores/auth";
import { profileApi } from "../lib/api";
import { Avatar, Spinner, toast } from "../components/ui";
import { IconUser } from "../components/Icons";

export function ProfilePage() {
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const status = useAuth((s) => s.status);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.profile?.displayName ?? "");
      setBio(user.profile?.bio ?? "");
      setVisibility(user.profile?.visibility ?? "PUBLIC");
    }
  }, [user]);

  if (status !== "authenticated" || !user) return <Spinner />;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await profileApi.update({ displayName: displayName.trim(), bio: bio.trim(), visibility });
      setUser(updated);
      toast("Профиль сохранён на сервере");
    } catch (err: any) {
      toast(err.message || "Не удалось сохранить", "err");
    } finally {
      setSaving(false);
    }
  };

  const onAvatar = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const r = await profileApi.uploadAvatar(file);
      setUser({ ...user, profile: { ...(user.profile ?? {}), avatarUrl: r.avatarUrl } });
      toast("Аватар обновлён");
    } catch (err: any) {
      toast(err.message || "Ошибка загрузки", "err");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="section-title flex items-center gap-2 text-2xl">
        <IconUser size={22} className="text-accent" /> Профиль
      </h1>

      <div className="card flex items-center gap-4 p-5">
        <Avatar user={user} size={72} />
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold">{user.profile?.displayName || user.username}</p>
          <p className="truncate text-sm text-muted">@{user.username}</p>
          <p className="mt-1 text-xs text-faint">
            На DELTA с {new Date(user.createdAt ?? Date.now()).toLocaleDateString("ru-RU")} ·{" "}
            {user._count?.followers ?? 0} подписчиков · {user._count?.following ?? 0} подписок
          </p>
        </div>
      </div>

      <form onSubmit={save} className="card space-y-4 p-5">
        <h2 className="text-sm font-bold">Редактирование профиля</h2>

        <label className="flex items-center gap-3 text-sm">
          <span className="w-40 shrink-0 text-muted">Аватар (PNG/JPG, до 2 МБ)</span>
          <input
            type="file"
            accept="image/png,image/jpeg"
            className="text-xs text-muted file:mr-3 file:rounded-pill file:border-0 file:bg-elevated file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-fg"
            onChange={(e) => void onAvatar(e.target.files?.[0])}
            disabled={uploading}
          />
          {uploading && <Spinner label="Загрузка…" />}
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Отображаемое имя</span>
          <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Описание профиля</span>
          <textarea className="input min-h-[80px]" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Видимость профиля</span>
          <select className="input" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
            <option value="PUBLIC">Публичный — виден всем</option>
            <option value="PRIVATE">Приватный — только подписчикам</option>
          </select>
        </label>

        <button className="btn-primary" disabled={saving}>
          {saving ? "Сохранение…" : "Сохранить"}
        </button>
      </form>
    </div>
  );
}
