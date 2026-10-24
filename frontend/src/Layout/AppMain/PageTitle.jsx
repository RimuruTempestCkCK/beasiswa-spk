export default function PageTitle({
  heading,
  subheading,
  eyebrow = 'SPK Beasiswa',
  actions = null,
}) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="page-title">{heading}</h1>
        {subheading && <p className="page-sub">{subheading}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}
