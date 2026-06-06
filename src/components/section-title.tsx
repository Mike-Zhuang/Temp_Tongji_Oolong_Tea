interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: string;
  level?: 1 | 2;
}

export function SectionTitle({ eyebrow, title, description, level = 2 }: SectionTitleProps) {
  const Heading = level === 1 ? "h1" : "h2";
  const headingClass =
    level === 1
      ? "text-balance text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl"
      : "text-balance text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl";

  return (
    <div className="space-y-2">
      {eyebrow ? <p className="text-sm text-text-muted">{eyebrow}</p> : null}
      <Heading className={headingClass}>{title}</Heading>
      {description ? (
        <p className="text-pretty max-w-3xl text-sm leading-7 text-text-muted sm:text-base">{description}</p>
      ) : null}
    </div>
  );
}
