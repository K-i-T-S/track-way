import { CapabilityIcon, type CapabilityIconName } from "./CapabilityIcon";

interface FeatureCardProps {
  number: string;
  title: string;
  description: string;
  icon?: CapabilityIconName;
}

export function FeatureCard({
  number,
  title,
  description,
  icon,
}: FeatureCardProps): React.ReactElement {
  return (
    <div className="group flex items-center gap-6 border-b border-white/10 py-8 first:border-t">
      <span className="text-2xl font-bold text-accent">{number}</span>
      {icon && (
        <CapabilityIcon
          name={icon}
          className="h-8 w-8 shrink-0 text-accent transition-transform duration-300 motion-safe:group-hover:scale-110"
        />
      )}
      <div className="flex-1">
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        <p className="mt-2 text-muted">{description}</p>
      </div>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-5 w-5 shrink-0 text-muted transition-transform duration-300 motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:translate-x-1"
      >
        <path d="M7 17 17 7" />
        <path d="M7 7h10v10" />
      </svg>
    </div>
  );
}
