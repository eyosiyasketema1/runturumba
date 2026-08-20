import { contentIcons } from '../../lib/figma-assets';
import { FigmaIcon } from '../ui/FigmaIcon';
import { FigmaSwitch } from '../ui/FigmaSwitch';

interface ChannelsToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  showArchived: boolean;
  onShowArchivedChange: (value: boolean) => void;
}

function SelectButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex shrink-0 items-center gap-[6px] overflow-hidden rounded-sm border border-border bg-background py-[10px] pr-[24px] pl-[20px] text-[14px] leading-[20px] font-medium whitespace-nowrap text-foreground hover:bg-muted"
    >
      {label}
      <FigmaIcon spec={contentIcons.chevronDown} />
    </button>
  );
}

export function ChannelsToolbar({
  query,
  onQueryChange,
  showArchived,
  onShowArchivedChange,
}: ChannelsToolbarProps) {
  return (
    <div className="flex w-full items-center pb-[24px]">
      <div className="flex w-full shrink-0 flex-col items-start rounded-sm border border-border/60 bg-background p-[16px]">
        <div className="flex w-full items-start gap-[8px]">
          <div className="flex w-[358px] shrink-0 flex-col items-start">
            <div className="flex h-[40px] w-full shrink-0 items-center gap-[8px] rounded-sm border border-border bg-secondary/30 px-[12px] py-[6px]">
              <FigmaIcon spec={contentIcons.search} />
              <input
                type="search"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Search Channels"
                aria-label="Search channels"
                className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-[8px]">
            <div className="flex shrink-0 items-center justify-end gap-[8px]">
              <SelectButton label="All Types" />
              <SelectButton label="All Status" />
              <span aria-hidden="true" className="block h-[30px] w-px shrink-0 bg-border" />
              <SelectButton label="Newest First" />
            </div>

            <FigmaSwitch
              id="show-archived"
              size="sm"
              label="Show archived"
              checked={showArchived}
              onCheckedChange={onShowArchivedChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
