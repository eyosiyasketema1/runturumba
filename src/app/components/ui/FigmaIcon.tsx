import type { FigmaIconSpec } from '../../lib/figma-assets';

interface FigmaIconProps {
  spec: FigmaIconSpec;
  className?: string;
}

/**
 * Renders an exported Figma glyph inside its original frame.
 *
 * Figma nests every icon three deep: a clipped square frame, the glyph's
 * bounding box inside it, and a slightly larger box that lets the stroke
 * overhang. Collapsing that to a single sized <img> would scale the glyph up to
 * fill the frame and eat the designed padding, so the nesting is preserved.
 */
export function FigmaIcon({ spec, className }: FigmaIconProps) {
  const { src, box, inset, bleed } = spec;

  return (
    <span
      aria-hidden="true"
      className={`relative block shrink-0 overflow-hidden ${className ?? ''}`}
      style={{ width: box, height: box }}
    >
      <span className="absolute" style={{ inset }}>
        <span className="absolute" style={{ inset: bleed }}>
          <img src={src} alt="" className="block h-full w-full max-w-none" />
        </span>
      </span>
    </span>
  );
}
