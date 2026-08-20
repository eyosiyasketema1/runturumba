import { tabIcons, type FigmaIconSpec } from '../../lib/figma-assets';
import type { CatalogCategory } from '../../lib/catalog-data';
import { FigmaIcon } from '../ui/FigmaIcon';

/** `null` is the "All" tab. */
export type CatalogFilter = CatalogCategory | null;

interface Tab {
  label: string;
  icon: FigmaIconSpec;
  value: CatalogFilter;
}

const TABS: Tab[] = [
  { label: 'All', icon: tabIcons.all, value: null },
  { label: 'Social Media', icon: tabIcons.social, value: 'Social Media' },
  { label: 'SMS', icon: tabIcons.sms, value: 'SMS' },
  { label: 'Email', icon: tabIcons.email, value: 'Email' },
  // The design labels this tab "Live Chat" while the section below reads
  // "Web Chat". Label kept as drawn; it filters the Web Chat section.
  { label: 'Live Chat', icon: tabIcons.liveChat, value: 'Web Chat' },
];

interface CatalogTabsProps {
  value: CatalogFilter;
  onChange: (value: CatalogFilter) => void;
}

export function CatalogTabs({ value, onChange }: CatalogTabsProps) {
  return (
    <div role="tablist" className="flex h-full shrink-0 items-center">
      {TABS.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.label}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`relative flex h-[32px] shrink-0 items-center justify-center gap-[6px] border-b-2 px-[20px] py-[8px] text-[16px] leading-[24px] font-medium whitespace-nowrap transition-colors ${
              active
                ? 'border-[var(--primary)] bg-[var(--background)] text-[var(--primary)]'
                : 'border-[var(--border)] text-[var(--muted-foreground)]'
            }`}
          >
            <FigmaIcon spec={tab.icon} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
