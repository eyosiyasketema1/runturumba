import { contentIcons } from '../../lib/figma-assets';
import { FigmaIcon } from '../ui/FigmaIcon';

export type ChannelCardStatus = 'connected' | 'disconnected' | 'error' | 'disabled';

const STATUS = {
  connected: {
    label: 'Connected',
    icon: contentIcons.connected,
    background: 'var(--success-soft, rgba(22, 163, 74, 0.1))',
    color: 'var(--success, #16a34a)',
  },
  disconnected: {
    label: 'Disconnected',
    icon: contentIcons.disconnected,
    background: 'var(--muted)',
    color: 'var(--muted-foreground)',
  },
  error: {
    label: 'Error',
    icon: contentIcons.error,
    background: 'var(--destructive-soft, rgba(224, 52, 52, 0.1))',
    color: 'var(--destructive)',
  },
  disabled: {
    label: 'Disabled',
    icon: null,
    background: 'var(--muted)',
    color: 'var(--muted-foreground)',
  },
} as const;

export function StatusPill({ status }: { status: ChannelCardStatus }) {
  const { label, icon, background, color } = STATUS[status];

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center gap-[6px] rounded-full px-[12px] py-[6px] text-[14px] leading-[20px] font-medium whitespace-nowrap"
      style={{ background, color }}
    >
      {icon && <FigmaIcon spec={icon} />}
      {label}
    </span>
  );
}
