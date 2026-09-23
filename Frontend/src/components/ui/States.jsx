import { AlertCircle, FilePlus2 } from "lucide-react";
import { Link } from "react-router";

export function LoadingState({ label = "Loading…" }) { return <div className="state state-loading" role="status"><span className="spinner" />{label}</div>; }
export function ErrorState({ message, onRetry }) { return <div className="state state-error" role="alert"><AlertCircle size={22}/><div><strong>Something went wrong.</strong><p>{message}</p>{onRetry && <button className="button button-secondary" onClick={onRetry}>Try again</button>}</div></div>; }
export function EmptyState({ title = "Nothing here yet", message, action = true }) { return <div className="state state-empty"><FilePlus2 size={28}/><strong>{title}</strong><p>{message}</p>{action && <Link className="button button-primary" to="/new-interview">Start an interview</Link>}</div>; }
