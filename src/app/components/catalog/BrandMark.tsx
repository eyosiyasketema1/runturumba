import type { BrandMarkSpec } from '../../lib/figma-assets';

/**
 * Renders a provider logo inside a fixed 32px box.
 *
 * Most marks are one image. LINE, Slack, SMPP and the Web Chat avatar came back
 * from Figma as multi-layer exports, so those keep their stack and per-layer
 * offsets rather than being flattened or substituted.
 */
export function BrandMark({ mark, size = 32 }: { mark: BrandMarkSpec; size?: number }) {
  const frame = `relative block shrink-0 ${mark.clip ? 'overflow-hidden' : ''}`;
  const frameStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: mark.rounded ? 9999 : undefined,
    background: mark.kind === 'layers' ? mark.background : undefined,
  };

  if (mark.kind === 'image') {
    return (
      <span aria-hidden="true" className={frame} style={frameStyle}>
        <img
          src={mark.src}
          alt=""
          className="absolute inset-0 block h-full w-full max-w-none"
          style={{
            objectFit: mark.fit,
            borderRadius: mark.rounded ? 9999 : undefined,
          }}
        />
      </span>
    );
  }

  // Layer offsets are expressed against the 32px design box; scale if resized.
  const scale = size / 32;

  return (
    <span aria-hidden="true" className={frame} style={frameStyle}>
      {mark.layers.map((layer, index) => (
        <span
          key={index}
          className="absolute block"
          style={
            layer.inset != null
              ? { inset: layer.inset }
              : {
                  left: (layer.left ?? 0) * scale,
                  top: (layer.top ?? 0) * scale,
                  width: (layer.width ?? 32) * scale,
                  height: (layer.height ?? 32) * scale,
                }
          }
        >
          <img src={layer.src} alt="" className="block h-full w-full max-w-none" />
        </span>
      ))}
    </span>
  );
}
