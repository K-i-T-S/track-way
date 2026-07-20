interface FeatureCardProps {
  number: string;
  title: string;
  description: string;
}

export function FeatureCard({ number, title, description }: FeatureCardProps) {
  return (
    <div className="border border-white/10 p-6">
      <span className="text-accent font-bold">{number}</span>
      <h3 className="mt-2 text-xl font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-muted">{description}</p>
    </div>
  );
}
