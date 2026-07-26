"use client";

import { useCallback, useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { getLocalized } from "@/lib/i18n-utils";
import { buildWhatsAppLink } from "@/lib/contact-links";
import type { Locale } from "@/i18n/routing";
import type { HardwareProduct } from "@/sanity/types";
import { Button } from "@/components/ui/Button";

// Products alternate between the two brand hues. `button` is the matching
// Button tone so the quote CTA stays in step with its product's accent.
const BRAND_TONES = [
  { accent: "#00E5D4", glow: "rgba(0,229,212,0.25)", button: "teal" },
  { accent: "#FB923C", glow: "rgba(251,146,60,0.25)", button: "warm" },
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
            <Button
              href={quoteLink}
              external
              target="_blank"
              rel="noopener noreferrer"
              variant="whatsapp"
              tone={tone.button}
            >
              {requestQuoteLabel}
            </Button>
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
