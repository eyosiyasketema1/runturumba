import { switchThumb } from '../../lib/figma-assets';

interface FigmaSwitchProps {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** 'md' is the 40×20 card switch; 'sm' is the 32×18 toolbar switch. */
  size?: 'md' | 'sm';
  label?: string;
  id?: string;
}

const SIZES = {
  md: { track: 'h-[20px] w-[40px]', thumb: 18, src: switchThumb.md },
  sm: { track: 'h-[18px] w-[32px]', thumb: 16, src: switchThumb.sm },
} as const;

export function FigmaSwitch({ checked, onCheckedChange, size = 'md', label, id }: FigmaSwitchProps) {
  const { track, thumb, src } = SIZES[size];

  const control = (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label ? undefined : 'Toggle'}
      onClick={() => onCheckedChange?.(!checked)}
      className={`relative shrink-0 rounded-[var(--radius-full,9999px)] transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 ${track} ${
        checked ? 'bg-[var(--primary)]' : 'bg-[var(--input)]'
      }`}
      style={{ filter: 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.05))' }}
    >
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="absolute top-1/2 block max-w-none -translate-y-1/2 rotate-180 transition-[left,right] duration-150"
        style={
          checked
            ? { right: 1, width: thumb, height: thumb }
            : { left: 1, width: thumb, height: thumb }
        }
      />
    </button>
  );

  if (!label) return control;

  return (
    <div className="flex items-center gap-[8px]">
      {control}
      <label
        htmlFor={id}
        className="cursor-pointer text-[14px] leading-[20px] font-medium whitespace-nowrap text-[var(--foreground)]"
      >
        {label}
      </label>
    </div>
  );
}
