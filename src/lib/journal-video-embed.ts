export type VideoPlatform = "youtube" | "vimeo" | "instagram" | "tiktok" | "facebook" | "x" | "generic";

export type JournalVideoRender =
  | { kind: "iframe"; src: string }
  | { kind: "video"; src: string }
  | { kind: "link"; href: string; platform: VideoPlatform }
  | null;

export function detectVideoPlatform(url: string): VideoPlatform {
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  if (/vimeo\.com/i.test(url)) return "vimeo";
  if (/instagram\.com/i.test(url)) return "instagram";
  if (/tiktok\.com/i.test(url)) return "tiktok";
  if (/facebook\.com|fb\.watch/i.test(url)) return "facebook";
  if (/twitter\.com|x\.com/i.test(url)) return "x";
  return "generic";
}

/** Resolves admin-entered URLs to safe embed targets or direct video sources. */
export function resolveJournalVideo(url: string | null | undefined): JournalVideoRender {
  const trimmed = url?.trim() ?? "";
  if (!trimmed) return null;

  if (/^https:\/\/(www\.)?youtube\.com\/embed\//i.test(trimmed)) {
    return { kind: "iframe", src: trimmed };
  }
  if (/^https:\/\/player\.vimeo\.com\/video\//i.test(trimmed)) {
    return { kind: "iframe", src: trimmed };
  }

  const ytWatch = trimmed.match(/(?:youtube\.com\/watch\?[^#]*v=|youtu\.be\/)([\w-]{11})/i);
  if (ytWatch) {
    return { kind: "iframe", src: `https://www.youtube.com/embed/${ytWatch[1]}` };
  }

  const ytEmbed = trimmed.match(/youtube\.com\/embed\/([\w-]+)/i);
  if (ytEmbed) {
    return { kind: "iframe", src: `https://www.youtube.com/embed/${ytEmbed[1]}` };
  }

  const vimeo = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo) {
    return { kind: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}` };
  }

  if (/\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(trimmed) && /^https?:\/\//i.test(trimmed)) {
    return { kind: "video", src: trimmed };
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return { kind: "link", href: trimmed, platform: detectVideoPlatform(trimmed) };
  }

  return null;
}
