/* A visible error with an optional "Try again" button. */
export default function ErrorNotice({ message, onRetry }) {
  return (
    <div className="notice notice--error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn--small" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
