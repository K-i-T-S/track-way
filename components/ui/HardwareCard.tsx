import Image from "next/image";
import { buildWhatsAppLink } from "@/lib/contact-links";

interface HardwareCardProps {
  name: string;
  description: string;
  images: string[];
  specs: { label: string; value: string }[];
  whatsappNumber: string;
  requestQuoteLabel: string;
}

export function HardwareCard({
  name,
  description,
  images,
  specs,
  whatsappNumber,
  requestQuoteLabel,
}: HardwareCardProps): React.ReactElement {
  const quoteLink = buildWhatsAppLink(
    whatsappNumber,
    `Hi, I'd like a quote for ${name}.`,
  );

  return (
    <div className="border border-white/10 p-6">
      {images[0] && (
        <div className="relative mb-4 h-48 w-full">
          <Image src={images[0]} alt={name} fill className="object-cover" />
        </div>
      )}
      <h3 className="text-xl font-bold text-foreground">{name}</h3>
      <p className="mt-2 text-muted">{description}</p>
      <dl className="mt-4 space-y-1">
        {specs.map((spec) => (
          <div key={spec.label} className="flex justify-between text-sm">
            <dt className="text-muted">{spec.label}</dt>
            <dd className="text-foreground">{spec.value}</dd>
          </div>
        ))}
      </dl>
      <a
        href={quoteLink}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block text-accent font-bold"
      >
        {requestQuoteLabel}
      </a>
    </div>
  );
}
