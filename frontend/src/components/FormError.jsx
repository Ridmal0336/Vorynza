export default function FormError({ message, errors }) {
  if (!message && (!errors || Object.keys(errors).length === 0)) {
    return null;
  }

  return (
    <div className="form-alert" role="alert">
      {message && <p className="form-alert__message">{message}</p>}
      {errors && Object.keys(errors).length > 0 && (
        <ul className="form-alert__list">
          {Object.entries(errors).map(([field, err]) => (
            <li key={field}>
              <strong>{field}</strong>: {err}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function FieldError({ error }) {
  if (!error) return null;
  return <p className="field-error">{error}</p>;
}
