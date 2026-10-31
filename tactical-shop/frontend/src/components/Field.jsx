/* One labelled form field with its error message.
   Pass as="textarea" for a multi-line box. */
export default function Field({
  label,
  name,
  idPrefix = "f",
  value,
  onChange,
  onBlur,
  error,
  hint,
  as: Tag = "input",
  wide = false,
  ...rest
}) {
  const id = `${idPrefix}-${name}`;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <label className={`field ${wide ? "field--wide" : ""} ${error ? "has-error" : ""}`} htmlFor={id}>
      {label}
      <Tag
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {hint && !error && <span className="field__hint" id={`${id}-hint`}>{hint}</span>}
      {error && <span className="field__error" id={`${id}-error`} role="alert">{error}</span>}
    </label>
  );
}
