/**
 * Button Component - Styled buttons
 */
export default function Button({ 
  children, 
  variant = 'primary', 
  onClick, 
  disabled = false,
  type = 'button',
  className = '',
  style = {}
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${className}`}
      style={style}
    >
      {children}
    </button>
  );
}
