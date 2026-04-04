export type JournalVideoRender =
  | { kind: "iframe"; src: string }
  | { kind: "video"; src: string }
  | { kind: "external"; href: string }
  | null;

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

  if (/^https:\/\//i.test(trimmed)) {
    return { kind: "external", href: trimmed };
  }

  return null;
}
