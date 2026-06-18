export function safeFontSize(size, fallback = 12) {
  const n = typeof size === "string" ? parseFloat(size) : size;
  if (!Number.isFinite(n) || n <= 0) {
    console.warn("[INVALID FONT SIZE]", size);
    return fallback;
  }
  return n;
}

export function safeLineHeight(size, fallback = 16) {
  const n = typeof size === "string" ? parseFloat(size) : size;
  if (!Number.isFinite(n) || n <= 0) {
    console.warn("[INVALID LINE HEIGHT]", size);
    return fallback;
  }
  return n;
}

export function safeLetterSpacing(size, fallback = 0) {
  const n = typeof size === "string" ? parseFloat(size) : size;
  if (!Number.isFinite(n)) {
    console.warn("[INVALID LETTER SPACING]", size);
    return fallback;
  }
  return n;
}

/** Flatten a plain style object (no StyleSheet.flatten). */
export function sanitizePlainTextStyle(style, fallbackFontSize = 12) {
  const flat = style && typeof style === "object" && !Array.isArray(style) ? style : {};
  const fontSize = safeFontSize(flat.fontSize, fallbackFontSize);
  const out = { ...flat, fontSize };

  if (flat.lineHeight != null) {
    out.lineHeight = safeLineHeight(flat.lineHeight, Math.ceil(fontSize * 1.25));
  }
  if (flat.letterSpacing != null) {
    out.letterSpacing = safeLetterSpacing(flat.letterSpacing, 0);
  }

  return out;
}
