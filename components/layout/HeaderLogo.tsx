/**
 * Inline, theme-aware re-draw of
 * public/brand/svg/trackway-logo-primary-no-tagline.svg.
 *
 * The static asset hardcodes the "TRACK" wordmark as solid white, which
 * assumes a dark backdrop. The header's background is theme-variable (near
 * white in light mode), so that hardcoded white text loses almost all
 * contrast in light mode. Here "TRACK" uses `currentColor` bound to the
 * `text-foreground` token instead — the same token driving the rest of the
 * header's text color — so it reads correctly in both themes. Everything
 * else (the teal icon, the "WAY" wordmark) keeps the original fixed brand
 * hex, unchanged from the source asset.
 */
export function HeaderLogo({
  className,
}: {
  className?: string;
}): React.ReactElement {
  return (
    <svg
      width="120"
      height="32"
      viewBox="0 0 1040 210"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="TrackWay"
      className={className}
    >
      <defs>
        <filter
          id="headerLogoGlow"
          x="-25%"
          y="-35%"
          width="150%"
          height="170%"
        >
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0.898 0 0 0 0 0.831 0 0 0 0.34 0"
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g transform="translate(28 9)" filter="url(#headerLogoGlow)">
        <path
          d="M34 47H114"
          stroke="#00E5D4"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.58"
        />
        <path
          d="M18 145H104"
          stroke="#00E5D4"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.58"
        />
        <path d="M54 96L222 20L160 96L222 172L54 96Z" fill="#00E5D4" />
        <path d="M96 96L178 61L144 96L178 131L96 96Z" fill="#000000" />
        <path
          d="M124 96L159 82L145 96L159 110L124 96Z"
          fill="#00E5D4"
          opacity="0.9"
        />
      </g>
      <g className="text-foreground">
        <text
          x="300"
          y="115"
          fontFamily="Sora, Montserrat, Inter, Arial, sans-serif"
          fontSize="76"
          fontWeight="950"
          letterSpacing="-4.6"
          fill="currentColor"
        >
          TRACK
        </text>
        <text
          x="573"
          y="115"
          fontFamily="Sora, Montserrat, Inter, Arial, sans-serif"
          fontSize="76"
          fontWeight="950"
          letterSpacing="-4.6"
          fill="#00E5D4"
        >
          WAY
        </text>
      </g>
    </svg>
  );
}
