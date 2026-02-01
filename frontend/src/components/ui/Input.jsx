/**
 * Input Component - Styled input fields
 */
export default function Input({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  disabled = false,
  className = '',
  error = null
}) {
  return (
    <div className={`input-group ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`input ${error ? 'input-error' : ''}`}
      />
      {error && <span className="input-error-message">{error}</span>}
    </div>
  );
}
