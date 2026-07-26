"use client";

import { useCallback, useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { getLocalized } from "@/lib/i18n-utils";
import { buildWhatsAppLink } from "@/lib/contact-links";
import type { Locale } from "@/i18n/routing";
import type { HardwareProduct } from "@/sanity/types";

const BRAND_TONES = [
  { accent: "#00E5D4", glow: "rgba(0,229,212,0.25)" },
  { accent: "#FB923C", glow: "rgba(251,146,60,0.25)" },
] as const;

interface HardwareProductShowcaseProps {
  products: HardwareProduct[];
  locale: Locale;
  whatsappNumber: string;
  requestQuoteLabel: string;
}

function SpecRow({
  label,
  value,
  index,
}: {
  label: string;
  value: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.8 + index * 0.08 }}
      className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.05]"
    >
      <dt className="text-xs font-medium uppercase tracking-wider text-muted/70">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
    </motion.div>
  );
}

function ProductShowcase({
  product,
  index,
  locale,
  whatsappNumber,
  requestQuoteLabel,
  isLast,
}: {
  product: HardwareProduct;
  index: number;
  locale: Locale;
  whatsappNumber: string;
  requestQuoteLabel: string;
  isLast: boolean;
}) {
  const imageRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const tone = BRAND_TONES[index % BRAND_TONES.length]!;
  const isReversed = index % 2 === 1;

  const name = getLocalized(product.name, locale);
  const description = getLocalized(product.description, locale);
  const image = product.images[0];
  const quoteLink = buildWhatsAppLink(
    whatsappNumber,
    `Hi, I'd like a quote for ${name}.`,
  );

  const handleImageMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const el = imageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({ x: (py - 0.5) * -12, y: (px - 0.5) * 12 });
  }, []);

  const handleImageLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  return (
    <section className="relative px-6 py-12 lg:px-10">
      <div
        className={`mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
          isReversed ? "lg:[direction:rtl]" : ""
        }`}
      >
        {/* ── image side ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className={`relative ${isReversed ? "lg:[direction:ltr]" : ""}`}
          style={{ perspective: "1000px" }}
        >
          <div
            ref={imageRef}
            onMouseMove={handleImageMove}
            onMouseLeave={handleImageLeave}
            className="group relative mx-auto aspect-[3/2] w-full max-w-lg cursor-default overflow-hidden rounded-3xl"
            style={{
              transformStyle: "preserve-3d",
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transition: "transform 0.2s ease-out",
            }}
          >
            <div className="absolute inset-0 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-sm" />

            {image && (
              <div
                className="absolute inset-0 flex items-center justify-center p-8"
                style={{ transform: "translateZ(40px)" }}
              >
                <Image
                  src={image}
                  alt={name}
                  fill
                  className="object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
                  sizes="(min-width: 1024px) 32rem, 90vw"
                />
              </div>
            )}

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{
                background: `radial-gradient(300px circle at ${50 + tilt.y * 2}% ${50 + tilt.x * 2}%, rgba(255,255,255,0.06), transparent 60%)`,
              }}
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{
                background: `radial-gradient(circle at 50% 60%, ${tone.glow}, transparent 70%)`,
              }}
            />

            <div
              aria-hidden="true"
              className="absolute -bottom-px left-1/4 h-px w-1/2 rounded-full"
              style={{
                background: tone.accent,
                boxShadow: `0 0 20px ${tone.accent}60`,
              }}
            />
          </div>

          <div
            aria-hidden="true"
            className="mx-auto mt-4 h-4 w-3/4 rounded-full blur-xl"
            style={{ background: `${tone.accent}20` }}
          />
        </motion.div>

        {/* ── content side ── */}
        <div className={isReversed ? "lg:[direction:ltr]" : ""}>
          <motion.h2
            initial={{ opacity: 0, x: isReversed ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl"
          >
            {name}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-4 leading-relaxed text-muted"
          >
            {description}
          </motion.p>

          <dl className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {product.specs.map((spec, i) => (
              <SpecRow
                key={getLocalized(spec.label, locale)}
                label={getLocalized(spec.label, locale)}
                value={getLocalized(spec.value, locale)}
                index={i}
              />
            ))}
          </dl>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="mt-8"
          >
            <a
              href={quoteLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group/btn relative inline-flex items-center gap-2.5 overflow-hidden rounded-full px-7 py-3.5 text-sm font-bold text-background transition-all hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${tone.accent}, ${tone.accent}dd)`,
                boxShadow: `0 4px 24px ${tone.glow}`,
              }}
            >
              <span className="pointer-events-none absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/btn:translate-x-[100%]" />
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
              {requestQuoteLabel}
            </a>
          </motion.div>
        </div>
      </div>

      {!isLast && (
        <div className="mx-auto mt-20 h-px max-w-xs bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      )}
    </section>
  );
}

export function HardwareProductShowcase({
  products,
  locale,
  whatsappNumber,
  requestQuoteLabel,
}: HardwareProductShowcaseProps): React.ReactElement {
  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-0 top-1/4 h-96 w-96 rounded-full bg-accent/3 blur-[150px]" />
        <div className="absolute right-0 top-2/3 h-96 w-96 rounded-full bg-accentWarm/3 blur-[150px]" />
      </div>

      {products.map((product, i) => (
        <ProductShowcase
          key={product._id}
          product={product}
          index={i}
          locale={locale}
          whatsappNumber={whatsappNumber}
          requestQuoteLabel={requestQuoteLabel}
          isLast={i === products.length - 1}
        />
      ))}
    </div>
  );
}
