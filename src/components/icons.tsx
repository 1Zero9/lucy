/**
 * Inline nav/feature icons — Lucide-style line icons matching
 * docs/LUCY_STYLE_GUIDE.md §6 (24x24 viewBox, 2px stroke, round caps/joins).
 * Paths and per-feature stroke colours are taken from
 * collateral/LUCY_Collateral_Pack/icons/svg/*.svg. Inlined as components so
 * there is no extra network request and each is directly usable in JSX.
 */
import type { SVGProps } from "react";

type IconProps = { size?: number } & Omit<SVGProps<SVGSVGElement>, "width" | "height">;

function base(colour: string) {
  return function Icon({ size = 20, ...props }: IconProps, children: React.ReactNode) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={colour}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        {children}
      </svg>
    );
  };
}

export function HomeIcon(props: IconProps) {
  return base("#7C3AED")(props, (
    <>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10.5V20h14v-9.5" />
      <path d="M9 20v-6h6v6" />
    </>
  ));
}

export function SearchIcon(props: IconProps) {
  return base("#2563EB")(props, (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ));
}

export function NotesIcon(props: IconProps) {
  return base("#06B6D4")(props, (
    <>
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M15 3v4h4" />
      <path d="M9 11h6M9 15h6" />
    </>
  ));
}

export function ModulesIcon(props: IconProps) {
  return base("#2563EB")(props, (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 3v18" />
      <path d="M12 8h5" />
      <path d="M12 12h5" />
    </>
  ));
}

export function TasksIcon(props: IconProps) {
  return base("#16A34A")(props, (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="m8 12 2.5 2.5L16 9" />
    </>
  ));
}

export function FilesIcon(props: IconProps) {
  return base("#06B6D4")(props, (
    <>
      <path d="M8 3h8l4 4v14H8z" />
      <path d="M16 3v5h5" />
      <path d="M4 7v14h12" />
    </>
  ));
}

export function RevisionsIcon(props: IconProps) {
  return base("#EF4444")(props, (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v6h6" />
      <path d="M12 7v5l3 2" />
    </>
  ));
}

export function ArchiveIcon(props: IconProps) {
  return base("#64748B")(props, (
    <>
      <rect x="4" y="7" width="16" height="13" rx="2" />
      <path d="M3 4h18v4H3zM9 12h6" />
    </>
  ));
}

export function SettingsIcon(props: IconProps) {
  return base("#2563EB")(props, (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z" />
    </>
  ));
}

export function PlusIcon(props: IconProps) {
  return base("currentColor")(props, <path d="M12 5v14M5 12h14" />);
}

export function StickyIcon(props: IconProps) {
  return base("#F59E0B")(props, (
    <>
      <path d="M5 4h14v11l-5 5H5z" />
      <path d="M14 20v-5h5" />
    </>
  ));
}

export function DrawingIcon(props: IconProps) {
  return base("#7C3AED")(props, (
    <>
      <path d="m4 20 4.5-1 10-10-3.5-3.5-10 10z" />
      <path d="m13.5 7 3.5 3.5" />
    </>
  ));
}

export function UploadIcon(props: IconProps) {
  return base("#2563EB")(props, (
    <>
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M5 20h14" />
    </>
  ));
}

export function FlashcardsIcon(props: IconProps) {
  return base("#7C3AED")(props, (
    <>
      <rect x="4" y="6" width="14" height="14" rx="2" />
      <path d="M8 6V4h12v14h-2" />
    </>
  ));
}

export function ResearchIcon(props: IconProps) {
  return base("#0891B2")(props, (
    <>
      <path d="M9 3v6l-4 8a3 3 0 0 0 2.7 4h8.6A3 3 0 0 0 19 17l-4-8V3" />
      <path d="M8 3h8M7 15h10" />
    </>
  ));
}

export function CalendarIcon(props: IconProps) {
  return base("#EF4444")(props, (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ));
}

export function HelpIcon(props: IconProps) {
  return base("#7C3AED")(props, (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.8 9a2.4 2.4 0 1 1 3.6 2.1c-.9.5-1.4 1-1.4 2" />
      <path d="M12 17h.01" />
    </>
  ));
}

export function CameraIcon(props: IconProps) {
  return base("#2563EB")(props, (
    <>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="14" r="3.5" />
    </>
  ));
}
