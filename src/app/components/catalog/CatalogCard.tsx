import { catalogIcons } from '../../lib/figma-assets';
import type { CatalogEntry } from '../../lib/catalog-data';
import { FigmaIcon } from '../ui/FigmaIcon';
import { BrandMark } from './BrandMark';

interface CatalogCardProps {
  entry: CatalogEntry;
  onConnect?: (id: string) => void;
}

export function CatalogCard({ entry, onConnect }: CatalogCardProps) {
  return (
    <article
      className="relative h-[180px] w-[300px] shrink-0 overflow-hidden border bg-white"
      style={{ borderColor: entry.borderColor }}
    >
      {/* Brand glow, clipped by the card. The artwork overflows its own box. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{ left: 232, top: -59, width: 118, height: 118 }}
      >
        <div className="absolute" style={{ inset: '-84.75%' }}>
          <img src={entry.glow} alt="" className="block h-full w-full max-w-none" />
        </div>
      </div>

      <div
        className="absolute flex flex-col items-start justify-between"
        style={{ left: 15, top: 15, width: 268, height: 148 }}
      >
        <div className="flex w-full shrink-0 flex-col items-start gap-[12px]">
          <div className="flex w-full shrink-0 items-center justify-between">
            {entry.title && (
              <h3 className="shrink-0 leading-[24px] font-semibold whitespace-nowrap text-black">
                <span className="text-[16px] leading-[24px]">{entry.title}</span>
                {entry.titleTail && (
                  <span className="text-[14px] leading-[20px] font-semibold">{entry.titleTail}</span>
                )}
              </h3>
            )}
            <BrandMark mark={entry.mark} />
          </div>

          <p className="w-full shrink-0 text-[14px] leading-[20px] break-words text-[var(--muted-foreground)]">
            {entry.description}
          </p>
        </div>

        <div className="flex w-full shrink-0 items-start justify-between">
          <button
            type="button"
            onClick={() => onConnect?.(entry.id)}
            className="flex shrink-0 items-center justify-center gap-[6px] rounded-[var(--radius-full)] bg-[var(--opacity-primary-soft)] px-[12px] py-[6px] text-[14px] leading-[20px] font-medium whitespace-nowrap text-[var(--foreground)]"
          >
            <FigmaIcon spec={catalogIcons.link} />
            Connect
          </button>

          <span className="flex shrink-0 items-center justify-center gap-[6px] rounded-[var(--radius-full)] bg-[var(--opacity-accent-10)] px-[12px] py-[6px] text-[14px] leading-[20px] font-medium whitespace-nowrap text-[var(--secondary-foreground)]">
            {entry.connectedCount} connected
          </span>
        </div>
      </div>
    </article>
  );
}
