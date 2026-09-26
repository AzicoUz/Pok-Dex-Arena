export default function SectionTitle({ eyebrow, title, highlight, description }) {
  return (
    <div className="page-title">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title} <span>{highlight}</span></h2>
      {description && <p>{description}</p>}
    </div>
  );
}
