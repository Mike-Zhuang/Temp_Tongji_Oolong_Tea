interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

export function SectionTitle({ eyebrow, title, description }: SectionTitleProps) {
  return (
    <div className="space-y-2">
      {eyebrow ? <p className="text-xs font-medium text-orange-600">{eyebrow}</p> : null}
      <h2 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">{title}</h2>
      {description ? <p className="max-w-3xl text-sm leading-7 text-stone-600 sm:text-base">{description}</p> : null}
    </div>
  );
}
