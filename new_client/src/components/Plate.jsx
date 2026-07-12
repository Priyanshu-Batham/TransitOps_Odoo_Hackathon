export default function Plate({ children }) {
  if (!children) return <span className="muted mono">—</span>;
  return <span className="plate">{children}</span>;
}
