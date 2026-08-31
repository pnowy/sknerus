type Rgb = { r: number; g: number; b: number }

const HEX_SHORT = /^#?([\da-f])([\da-f])([\da-f])([\da-f])?$/i
const HEX_LONG = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})([\da-f]{2})?$/i
const RGB_FUNC = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function parseColor(color: string): Rgb | null {
  const input = color.trim()
  const short = HEX_SHORT.exec(input)
  if (short) {
    return {
      r: Number.parseInt(short[1].repeat(2), 16),
      g: Number.parseInt(short[2].repeat(2), 16),
      b: Number.parseInt(short[3].repeat(2), 16),
    }
  }
  const long = HEX_LONG.exec(input)
  if (long) {
    return { r: Number.parseInt(long[1], 16), g: Number.parseInt(long[2], 16), b: Number.parseInt(long[3], 16) }
  }
  const func = RGB_FUNC.exec(input)
  if (func) {
    return {
      r: clamp(Math.round(Number(func[1])), 0, 255),
      g: clamp(Math.round(Number(func[2])), 0, 255),
      b: clamp(Math.round(Number(func[3])), 0, 255),
    }
  }
  return null
}

function toHex({ r, g, b }: Rgb) {
  const part = (v: number) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')
  return `#${part(r)}${part(g)}${part(b)}`
}

export function relativeLuminance(rgb: Rgb) {
  const channel = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b)
}

export function contrastRatio(a: string, b: string) {
  const rgbA = parseColor(a)
  const rgbB = parseColor(b)
  if (!rgbA || !rgbB) return 1
  const lumA = relativeLuminance(rgbA)
  const lumB = relativeLuminance(rgbB)
  const lighter = Math.max(lumA, lumB)
  const darker = Math.min(lumA, lumB)
  return (lighter + 0.05) / (darker + 0.05)
}

function mix(color: Rgb, target: Rgb, amount: number): Rgb {
  return {
    r: color.r + (target.r - color.r) * amount,
    g: color.g + (target.g - color.g) * amount,
    b: color.b + (target.b - color.b) * amount,
  }
}

const WHITE: Rgb = { r: 255, g: 255, b: 255 }
const BLACK: Rgb = { r: 0, g: 0, b: 0 }

/**
 * Returns the given color adjusted so it stays legible on the given background.
 * The hue is preserved as much as possible — the color is only blended towards
 * white or black (whichever contrasts more with the background) until the
 * requested WCAG contrast ratio is reached.
 */
export function ensureReadableColor(color: string, background: string, minRatio = 4.5): string {
  const rgb = parseColor(color)
  const bg = parseColor(background)
  if (!rgb || !bg) return color
  if (contrastRatio(color, background) >= minRatio) return color

  const target = relativeLuminance(bg) > 0.5 ? BLACK : WHITE
  for (let step = 1; step <= 20; step++) {
    const candidate = toHex(mix(rgb, target, step / 20))
    if (contrastRatio(candidate, background) >= minRatio) return candidate
  }
  return toHex(target)
}
