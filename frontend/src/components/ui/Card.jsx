/**
 * Card Component - Base card for UI sections
 */
export default function Card({ children, className = '', style = {} }) {
  return (
    <div 
      className={`card ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
