import { Link } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { IconSearch } from "../components/Icons";

export function NotFoundPage() {
  return (
    <EmptyState
      icon={<IconSearch size={22} />}
      title="Страница не найдена"
      hint="Проверьте адрес или вернитесь на главную."
      action={<Link to="/" className="btn-secondary">На главную</Link>}
    />
  );
}
