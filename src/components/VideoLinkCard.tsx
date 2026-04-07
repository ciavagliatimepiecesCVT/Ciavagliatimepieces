import type { VideoPlatform } from "@/lib/journal-video-embed";

const PLATFORM_META: Record<VideoPlatform, { label: string; color: string; icon: React.ReactNode }> = {
  youtube: {
    label: "Watch on YouTube",
    color: "bg-red-600 hover:bg-red-700",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-white" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
  vimeo: {
    label: "Watch on Vimeo",
    color: "bg-[#1ab7ea] hover:bg-[#0d9fd0]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-white" aria-hidden="true">
        <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197a315.065 315.065 0 0 0 3.648-3.248C5.259 2.466 6.478 1.698 7.3 1.623c1.922-.18 3.108 1.13 3.554 3.93.481 3.05.815 4.95.999 5.697.555 2.52 1.165 3.78 1.832 3.78.517 0 1.296-.819 2.335-2.454 1.039-1.636 1.595-2.879 1.667-3.727.149-1.414-.409-2.121-1.667-2.121-.594 0-1.205.136-1.832.41 1.217-3.981 3.540-5.908 6.964-5.784 2.54.09 3.741 1.725 3.581 4.912z"/>
      </svg>
    ),
  },
  instagram: {
    label: "Watch on Instagram",
    color: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 hover:opacity-90",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-white" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  tiktok: {
    label: "Watch on TikTok",
    color: "bg-black hover:bg-neutral-900",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-white" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
      </svg>
    ),
  },
  facebook: {
    label: "Watch on Facebook",
    color: "bg-[#1877f2] hover:bg-[#0d65d9]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-white" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  x: {
    label: "Watch on X",
    color: "bg-black hover:bg-neutral-900",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-white" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  generic: {
    label: "Watch video",
    color: "bg-foreground hover:bg-foreground/90",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-white" aria-hidden="true">
        <path d="M8 5v14l11-7z"/>
      </svg>
    ),
  },
};

type Props = {
  href: string;
  platform: VideoPlatform;
  labelOverride?: string;
  /** Dark variant for the admin panel (white text on dark bg) */
  dark?: boolean;
};

export default function VideoLinkCard({ href, platform, labelOverride, dark }: Props) {
  const meta = PLATFORM_META[platform];
  const label = labelOverride ?? meta.label;

  if (dark) {
    // Admin panel variant — neutral border card
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white transition hover:bg-white/10"
      >
        {meta.icon}
        <span className="text-sm">{label}</span>
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-none stroke-white/50 stroke-2" aria-hidden="true">
          <path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </a>
    );
  }

  // Public page variant — coloured platform button
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-3 rounded-2xl px-5 py-3 text-white transition ${meta.color}`}
    >
      {meta.icon}
      <span className="text-sm font-medium">{label}</span>
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-none stroke-white/70 stroke-2" aria-hidden="true">
        <path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </a>
  );
}
