import { brandLogos, cardFlourish, contentIcons } from '../../lib/figma-assets';
import { FigmaIcon } from '../ui/FigmaIcon';
import { StatusPill, type ChannelCardStatus } from './StatusPill';
import { FigmaSwitch } from '../ui/FigmaSwitch';

export type ChannelProvider = keyof typeof brandLogos;

export interface FigmaChannel {
  id: string;
  name: string;
  provider: ChannelProvider;
  enabled: boolean;
  statuses: ChannelCardStatus[];
  /** e.g. "SMS - 02/21/2026" — shown on metric cards. */
  meta?: string;
  metrics?: { sent: string; delivery: string };
  /** Credentials variant: a channel-type row plus a truncated key. */
  channelType?: string;
  publicKey?: string;
}

/** The WhatsApp card gets a green flourish; the rest get the neutral one. */
const flourishFor = (provider: ChannelProvider) =>
  provider === 'whatsapp' ? cardFlourish.green : cardFlourish.neutral;

/** Only the Agelgil mark is non-square in the design. */
const LOGO_SIZE: Record<ChannelProvider, { width: number; height: number }> = {
  whatsapp: { width: 32, height: 32 },
  telegram: { width: 32, height: 32 },
  sms: { width: 32, height: 32 },
  agelgil: { width: 32, height: 29.727 },
};

interface ChannelCardProps {
  channel: FigmaChannel;
  onToggle?: (id: string, enabled: boolean) => void;
  onClick?: () => void;
}

export function ChannelCard({ channel, onToggle, onClick }: ChannelCardProps) {
  const logo = LOGO_SIZE[channel.provider];
  const isCredentialsVariant = channel.publicKey != null;

  return (
    <article
      className="relative flex shrink-0 flex-col items-start justify-center overflow-hidden rounded-xl border border-muted bg-background p-[16px] cursor-pointer hover:border-primary/30 transition-colors"
      style={isCredentialsVariant ? { height: 202 } : undefined}
      onClick={onClick}
    >
      <div className="flex w-[268px] shrink-0 flex-col gap-[16px]">
        <div className="flex w-[268px] shrink-0 items-center justify-between">
          <div className="flex shrink-0 items-center gap-[8px]">
            <img
              src={brandLogos[channel.provider]}
              alt=""
              aria-hidden="true"
              className="block shrink-0 max-w-none object-contain"
              style={{ width: logo.width, height: logo.height }}
            />
            <h3 className="text-[14px] leading-[20px] font-semibold whitespace-nowrap text-foreground">
              {channel.name}
            </h3>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <FigmaSwitch
              checked={channel.enabled}
              onCheckedChange={(next) => onToggle?.(channel.id, next)}
              size="md"
            />
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-[16px]">
          <div className="flex shrink-0 items-start gap-[16px]">
            {channel.statuses.map((status) => (
              <StatusPill key={status} status={status} />
            ))}
          </div>

          {channel.meta && (
            <p className="shrink-0 text-[12px] leading-[16px] font-medium whitespace-nowrap text-muted-foreground">
              {channel.meta}
            </p>
          )}

          {channel.channelType && (
            <div className="flex shrink-0 items-center gap-[8px]">
              <FigmaIcon spec={contentIcons.bot} />
              <p className="text-[12px] leading-[16px] font-medium whitespace-nowrap text-muted-foreground">
                {channel.channelType}
              </p>
            </div>
          )}
        </div>

        {channel.metrics && (
          <div className="flex w-full shrink-0 items-start gap-[32px] whitespace-nowrap">
            <div className="flex shrink-0 flex-col items-start">
              <span className="text-[12px] leading-[16px] font-medium text-muted-foreground">
                Sent
              </span>
              <span className="text-[16px] leading-[24px] font-bold text-foreground">
                {channel.metrics.sent}
              </span>
            </div>
            <div className="flex shrink-0 flex-col items-start">
              <span className="text-[12px] leading-[16px] font-medium text-muted-foreground">
                Delivery
              </span>
              <span className="text-[16px] leading-[24px] font-bold text-foreground">
                {channel.metrics.delivery}
              </span>
            </div>
          </div>
        )}

        {channel.publicKey && (
          <div className="flex w-full shrink-0 items-start">
            <div className="flex min-w-0 flex-1 flex-col items-start text-[12px] leading-[16px] font-medium whitespace-nowrap">
              <span className="shrink-0 text-muted-foreground">Public Key</span>
              <span className="w-full shrink-0 overflow-hidden text-ellipsis text-foreground">
                {channel.publicKey}
              </span>
            </div>
          </div>
        )}
      </div>

      <img
        src={flourishFor(channel.provider)}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute block size-[118px] max-w-none"
        style={{ left: 231, top: 141 }}
      />
    </article>
  );
}
