// iOS UI primitives — List, Row, Tile, Switch, Segmented, SearchField,
// NavBar, LargeTitle, Badge, StatBox, ActionBtn, QuickTile, BoxPlaceholder, TabBar.
import React from 'react';
import { iOS, iOSType, tileGradients, BRAND, FONT_AR, FONT_EN } from './theme';
import { Icon } from './icons';
import { Dir, marginEnd, marginStart, textAlign, separatorInset, chevronFlip } from './rtl';

// ─── Tile icon (rounded squircle with gradient) ───────────
export function Tile({
  from,
  to,
  children,
  size = 29,
  bg,
}: {
  from?: string;
  to?: string;
  children?: React.ReactNode;
  size?: number;
  bg?: string;
}) {
  const gradient = from && to ? `linear-gradient(180deg, ${from} 0%, ${to} 100%)` : bg || iOS.gray;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 7,
        background: gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 0.5px 0 rgba(0,0,0,0.05)',
      }}
    >
      {children}
    </div>
  );
}

// ─── Row (list cell) ──────────────────────────────────────
export function Row({
  leading,
  title,
  subtitle,
  trailing,
  detail,
  chevron,
  onLast,
  destructive,
  link,
  tall,
  noLeadingInset,
  onClick,
  dir = 'ltr',
}: {
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  detail?: React.ReactNode;
  chevron?: boolean;
  onLast?: boolean;
  destructive?: boolean;
  link?: boolean;
  tall?: boolean;
  noLeadingInset?: boolean;
  onClick?: () => void;
  dir?: Dir;
}) {
  const [pressed, setPressed] = React.useState(false);
  const leadingInset = leading ? (noLeadingInset ? 16 : 58) : 16;
  return (
    <div
      onClick={onClick}
      onTouchStart={() => onClick && setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onMouseDown={() => onClick && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        minHeight: tall ? 60 : 44,
        padding: '8px 16px',
        position: 'relative',
        background: pressed ? 'rgba(120,120,128,0.12)' : iOS.bg2,
        cursor: onClick ? 'pointer' : 'default',
        direction: dir,
        transition: 'background 120ms ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {leading && (
        <div style={{ ...marginEnd(12, dir), display: 'flex', flexShrink: 0 }}>{leading}</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 17,
            letterSpacing: -0.43,
            color: destructive ? iOS.red : link ? iOS.blue : iOS.label,
            fontWeight: 400,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textAlign: textAlign(dir),
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 13,
              color: iOS.label2,
              marginTop: 2,
              letterSpacing: -0.08,
              textAlign: textAlign(dir),
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {detail && (
        <div
          style={{
            fontSize: 17,
            color: iOS.label2,
            ...(chevron ? marginEnd(6, dir) : {}),
            letterSpacing: -0.43,
          }}
        >
          {detail}
        </div>
      )}
      {trailing}
      {chevron && (
        <div style={{ ...marginStart(8, dir), ...chevronFlip(dir) }}>
          <Icon.chevronR />
        </div>
      )}
      {!onLast && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            ...separatorInset(leadingInset, dir),
            height: 0.5,
            background: iOS.sepCell,
          }}
        />
      )}
    </div>
  );
}

// ─── Switch (toggle) ──────────────────────────────────────
export function Switch({ on = false, onChange }: { on?: boolean; onChange?: (on: boolean) => void }) {
  return (
    <div
      onClick={() => onChange?.(!on)}
      style={{
        width: 51,
        height: 31,
        borderRadius: 16,
        background: on ? iOS.green : '#E9E9EA',
        position: 'relative',
        flexShrink: 0,
        transition: 'background 0.2s',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 22 : 2,
          width: 27,
          height: 27,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 3px 8px rgba(0,0,0,0.15), 0 3px 1px rgba(0,0,0,0.06)',
          transition: 'left 0.2s',
        }}
      />
    </div>
  );
}

// ─── List (inset grouped list container) ──────────────────
export function List({
  header,
  footer,
  children,
  style = {},
  dir = 'ltr',
}: {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  dir?: Dir;
}) {
  // Inject onLast + dir into children
  const items = React.Children.toArray(children).filter(Boolean) as React.ReactElement[];
  const withLast = items.map((c, i) =>
    React.cloneElement(c, {
      onLast: i === items.length - 1,
      dir: (c.props as any).dir ?? dir,
    })
  );
  return (
    <div style={{ marginBottom: 24, direction: dir, ...style }}>
      {header && (
        <div
          style={{
            padding: '8px 32px 6px',
            fontSize: 13,
            color: iOS.label2,
            letterSpacing: -0.08,
            textTransform: 'uppercase',
            fontWeight: 400,
            textAlign: textAlign(dir),
          }}
        >
          {header}
        </div>
      )}
      <div
        style={{
          margin: '0 16px',
          borderRadius: 10,
          background: iOS.bg2,
          overflow: 'hidden',
        }}
      >
        {withLast}
      </div>
      {footer && (
        <div
          style={{
            padding: '7px 32px 0',
            fontSize: 13,
            color: iOS.label2,
            letterSpacing: -0.08,
            lineHeight: 1.38,
            textAlign: textAlign(dir),
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

// ─── Segmented control ────────────────────────────────────
export function Segmented({
  options,
  active = 0,
  onChange,
}: {
  options: string[];
  active?: number;
  onChange?: (i: number) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        background: 'rgba(120,120,128,0.12)',
        borderRadius: 9,
        padding: 2,
        gap: 2,
      }}
    >
      {options.map((o, i) => (
        <div
          key={i}
          onClick={() => onChange?.(i)}
          style={{
            flex: 1,
            padding: '6px 8px',
            textAlign: 'center',
            fontSize: 13,
            fontWeight: i === active ? 590 : 400,
            color: iOS.label,
            borderRadius: 7,
            background: i === active ? '#fff' : 'transparent',
            boxShadow: i === active ? '0 3px 8px rgba(0,0,0,0.12), 0 3px 1px rgba(0,0,0,0.04)' : 'none',
            letterSpacing: -0.08,
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          {o}
        </div>
      ))}
    </div>
  );
}

// ─── Search field ─────────────────────────────────────────
export function SearchField({
  value = '',
  placeholder = 'Search',
  onChange,
  onFocus,
  onBlur,
  autoFocus,
  onClear,
  dir = 'ltr',
}: {
  value?: string;
  placeholder?: string;
  onChange?: (v: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
  onClear?: () => void;
  dir?: Dir;
}) {
  const hasValue = value.length > 0;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: iOS.fill,
        borderRadius: 10,
        height: 36,
        padding: '0 8px',
        direction: dir,
      }}
    >
      <Icon.search color={iOS.label2} size={15} />
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        autoFocus={autoFocus}
        style={{
          flex: 1,
          fontSize: 17,
          color: iOS.label,
          letterSpacing: -0.43,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          padding: 0,
          minWidth: 0,
          textAlign: textAlign(dir),
        }}
      />
      {hasValue ? (
        <button
          onClick={() => (onClear ? onClear() : onChange?.(''))}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
          aria-label="Clear"
        >
          <Icon.xCircle color={iOS.label3} size={18} />
        </button>
      ) : (
        <Icon.mic color={iOS.label2} size={18} />
      )}
    </div>
  );
}

// ─── NavBar ───────────────────────────────────────────────
export function NavBar({
  leading,
  title,
  trailing,
}: {
  leading?: React.ReactNode;
  title?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div
      style={{
        paddingTop: 54,
        paddingBottom: 8,
        background: 'rgba(249,249,249,0.82)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '0.5px solid rgba(60,60,67,0.18)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          minHeight: 44,
          padding: '0 12px',
          gap: 6,
        }}
      >
        <div style={{ minWidth: 70, display: 'flex', alignItems: 'center' }}>{leading}</div>
        <div
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 17,
            fontWeight: 600,
            color: iOS.label,
            letterSpacing: -0.43,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </div>
        <div
          style={{
            minWidth: 70,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          {trailing}
        </div>
      </div>
    </div>
  );
}

// ─── LargeTitle (no sticky) ───────────────────────────────
export function LargeTitle({
  title,
  subtitle,
  trailing,
  dir = 'ltr',
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  dir?: Dir;
}) {
  return (
    <div
      style={{
        padding: '4px 16px 10px',
        display: 'flex',
        alignItems: 'flex-end',
        gap: 8,
        direction: dir,
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: 0.37,
            color: iOS.label,
            lineHeight: '41px',
            textAlign: textAlign(dir),
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 15,
              color: iOS.label2,
              marginTop: 2,
              letterSpacing: -0.23,
              textAlign: textAlign(dir),
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {trailing}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────
export function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.06,
        color,
        background: `${color}1F`,
        padding: '3px 8px',
        borderRadius: 6,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </span>
  );
}

// ─── StatBox ──────────────────────────────────────────────
export function StatBox({
  label,
  value,
  big,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  big?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: iOS.bg2,
        borderRadius: 12,
        padding: '10px 12px',
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: iOS.label2,
          textTransform: 'uppercase',
          letterSpacing: 0.06,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: big ? 17 : 15,
          fontWeight: 600,
          color: iOS.label,
          marginTop: 3,
          letterSpacing: -0.23,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ─── ActionBtn ────────────────────────────────────────────
export function ActionBtn({
  tint = iOS.blue,
  filled,
  icon,
  label,
  onClick,
}: {
  tint?: string;
  filled?: boolean;
  icon?: React.ReactNode;
  label: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 44,
        borderRadius: 10,
        background: filled ? tint : `${tint}14`,
        color: filled ? '#fff' : tint,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        fontSize: 16,
        fontWeight: 600,
        letterSpacing: -0.32,
        border: 'none',
        cursor: 'pointer',
        width: '100%',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── QuickTile (dashboard gradient tile) ──────────────────
export function QuickTile({
  from,
  to,
  icon,
  title,
  sub,
  onClick,
  dir = 'ltr',
}: {
  from: string;
  to: string;
  icon: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  onClick?: () => void;
  dir?: Dir;
}) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
        borderRadius: 16,
        padding: '12px 14px',
        color: '#fff',
        boxShadow: pressed
          ? '0 1px 2px rgba(0,0,0,0.08)'
          : '0 1px 3px rgba(0,0,0,0.05), 0 6px 16px rgba(0,0,0,0.06)',
        minHeight: 78,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        direction: dir,
        transform: pressed ? 'scale(0.96)' : 'scale(1)',
        transition: 'transform 180ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 180ms',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: 'rgba(255,255,255,0.22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <div style={{ textAlign: textAlign(dir) }}>
        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.24 }}>{title}</div>
        {sub && <div style={{ fontSize: 12, opacity: 0.88, letterSpacing: -0.08, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── BoxPlaceholder (medicine artwork) ────────────────────
export function BoxPlaceholder({ size = 56, tint = iOS.blue }: { size?: number; tint?: string }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        background: `linear-gradient(135deg, ${tint}22 0%, ${tint}11 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: '0.5px solid rgba(60,60,67,0.12)',
      }}
    >
      <Icon.pill color={tint} size={Math.round(size * 0.44)} />
    </div>
  );
}

// ─── IOSTabBar ────────────────────────────────────────────
export type TabKey = 'search' | 'insurance' | 'saved' | 'settings';

export function IOSTabBar({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
}) {
  const tabs: { key: TabKey; label: string; icon: (c: string) => React.ReactNode }[] = [
    { key: 'search', label: 'Search', icon: (c) => <Icon.search color={c} size={26} /> },
    { key: 'insurance', label: 'Insurance', icon: (c) => <Icon.shield color={c} size={26} /> },
    { key: 'saved', label: 'Saved', icon: (c) => <Icon.star color={c} size={26} /> },
    { key: 'settings', label: 'Settings', icon: (c) => <Icon.gear color={c} size={26} /> },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 4px)',
        background: 'rgba(249,249,249,0.92)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderTop: '0.33px solid rgba(60,60,67,0.3)',
        zIndex: 40,
      }}
    >
      <div style={{ display: 'flex', height: 49, paddingTop: 4 }}>
        {tabs.map((t) => {
          const a = t.key === active;
          const color = a ? iOS.blue : iOS.gray;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                paddingTop: 2,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transform: a ? 'scale(1)' : 'scale(1)',
                transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms',
                opacity: 1,
                WebkitTapHighlightColor: 'transparent',
              }}
              onTouchStart={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.55'; }}
              onTouchEnd={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
            >
              <div style={{
                transform: a ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}>
                {t.icon(color)}
              </div>
              <span style={{ fontSize: 10, color, fontWeight: 500, letterSpacing: 0.06 }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── ScreenTransition (slide + fade wrapper for view changes) ────
export function ScreenTransition({ children, viewKey }: { children: React.ReactNode; viewKey: string }) {
  return (
    <div
      key={viewKey}
      style={{
        animation: 'iosScreenIn 320ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <style>{`
        @keyframes iosScreenIn {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes iosFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes iosPressScale {
          0% { transform: scale(1); }
          50% { transform: scale(0.96); }
          100% { transform: scale(1); }
        }
      `}</style>
      {children}
    </div>
  );
}

// Re-export helpers
export { iOS, iOSType, tileGradients, Icon, BRAND, FONT_AR, FONT_EN };
export { EDMark, EDWordmark } from './brand';
export type { Dir };
export { langPick, marginEnd, marginStart, paddingStart, paddingEnd, textAlign, chevronFlip } from './rtl';
