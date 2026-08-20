interface StatTileProps {
  label: string;
  value: string;
  caption: string;
}

export function StatTile({ label, value, caption }: StatTileProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-start justify-end overflow-hidden rounded-sm bg-secondary/50 px-[24px] py-[16px]">
      <div className="flex w-full shrink-0 flex-col items-start gap-[6px] break-words">
        <div className="flex h-[78px] w-full shrink-0 flex-col items-start text-foreground">
          <span className="w-full min-w-full shrink-0 text-[12px] leading-[16px] font-medium tracking-normal uppercase">
            {label}
          </span>
          <span className="min-h-0 flex-1 text-[48px] leading-none font-bold">{value}</span>
        </div>
        <span className="w-full shrink-0 text-[14px] leading-[20px] text-foreground/50">
          {caption}
        </span>
      </div>
    </div>
  );
}
