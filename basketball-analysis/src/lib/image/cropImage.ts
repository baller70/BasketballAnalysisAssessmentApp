/**
 * Actually crop and rotate a photo.
 *
 * PHOTO REVIEW told the player "Adjust crop to include your full body from head
 * to toe", drew a crop frame with corner brackets, and offered a CROP button —
 * and none of it did anything. The brackets were `aria-hidden` decorations at a
 * fixed 30/34px inset with no drag handling; the rotation dial only applied a
 * CSS `transform` to the preview; CROP opened the file picker; and USE PHOTO
 * advanced to the next step with the ORIGINAL image untouched. So the crop a
 * player set up was never in the photo that got analysed, because there was no
 * crop.
 *
 * This is the part that was missing: given the source image, a crop rectangle
 * and an angle, produce the pixels.
 */

/** A crop rectangle in NORMALISED coordinates of the displayed image box. */
export interface CropRect {
  /** Left edge, 0-1. */
  x: number
  /** Top edge, 0-1. */
  y: number
  /** Width, 0-1. */
  w: number
  /** Height, 0-1. */
  h: number
}

export const FULL_FRAME: CropRect = { x: 0, y: 0, w: 1, h: 1 }

/** Keep a rect inside the image and never smaller than this fraction. */
const MIN_SIDE = 0.1

/**
 * Clamp a rect into the unit square, preserving size where possible.
 *
 * Dragging is the common case, so a rect pushed past an edge slides back
 * instead of being squashed — a crop that silently changed shape as it hit the
 * side of the photo would fight the player rather than follow them.
 */
export function clampRect(r: CropRect): CropRect {
  const w = Math.min(1, Math.max(MIN_SIDE, r.w))
  const h = Math.min(1, Math.max(MIN_SIDE, r.h))
  return {
    w, h,
    x: Math.min(1 - w, Math.max(0, r.x)),
    y: Math.min(1 - h, Math.max(0, r.y)),
  }
}

/**
 * The largest rect of a given aspect ratio, centred, inside the unit square.
 * The badge on this screen says 3:4, so that is what the frame starts as.
 */
export function centredRect(aspect: number): CropRect {
  // aspect = width / height. The box is square in normalised space, so the
  // narrower dimension is the one that fills.
  const w = aspect >= 1 ? 1 : aspect
  const h = aspect >= 1 ? 1 / aspect : 1
  return clampRect({ x: (1 - w) / 2, y: (1 - h) / 2, w, h })
}

/** Resize a rect from one corner, holding the opposite corner still. */
export function resizeFromCorner(
  r: CropRect,
  corner: "nw" | "ne" | "sw" | "se",
  dx: number,
  dy: number,
  aspect: number | null,
): CropRect {
  const right = r.x + r.w
  const bottom = r.y + r.h
  let { x, y, w, h } = r

  if (corner === "nw" || corner === "sw") { x = r.x + dx; w = right - x }
  else { w = r.w + dx }
  if (corner === "nw" || corner === "ne") { y = r.y + dy; h = bottom - y }
  else { h = r.h + dy }

  if (aspect != null && w > 0) {
    // Height follows width, and the anchored edge stays put.
    const nh = w / aspect
    if (corner === "nw" || corner === "ne") y = bottom - nh
    h = nh
  }
  return clampRect({ x, y, w, h })
}

/**
 * Render the crop.
 *
 * The rect is expressed against the DISPLAYED image, so it maps straight onto
 * the natural pixels — the caller never has to know the source resolution.
 * Rotation is applied about the centre first, then the rect is taken from the
 * rotated frame, which is the order the preview shows it in; doing it the other
 * way round would cut a different part of the photo than the player saw.
 *
 * Returns a JPEG data URL. Resolves to the ORIGINAL src unchanged when there is
 * nothing to do (full frame, no rotation) so an untouched photo is never
 * needlessly re-encoded.
 */
export async function cropImage(
  src: string,
  rect: CropRect,
  angleDeg: number,
  quality = 0.92,
): Promise<string> {
  const untouched =
    angleDeg === 0 && rect.x === 0 && rect.y === 0 && rect.w === 1 && rect.h === 1
  if (untouched) return src

  const img = await loadImage(src)
  const { naturalWidth: iw, naturalHeight: ih } = img
  if (!iw || !ih) return src

  // The rotated bounding box, so a tilted photo does not lose its corners.
  const rad = (angleDeg * Math.PI) / 180
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))
  const rw = iw * cos + ih * sin
  const rh = iw * sin + ih * cos

  const stage = document.createElement("canvas")
  stage.width = Math.round(rw)
  stage.height = Math.round(rh)
  const sctx = stage.getContext("2d")
  if (!sctx) return src
  sctx.translate(rw / 2, rh / 2)
  sctx.rotate(rad)
  sctx.drawImage(img, -iw / 2, -ih / 2)

  const sx = Math.round(rect.x * rw)
  const sy = Math.round(rect.y * rh)
  const sw = Math.max(1, Math.round(rect.w * rw))
  const sh = Math.max(1, Math.round(rect.h * rh))

  const out = document.createElement("canvas")
  out.width = sw
  out.height = sh
  const octx = out.getContext("2d")
  if (!octx) return src
  octx.drawImage(stage, sx, sy, sw, sh, 0, 0, sw, sh)

  return out.toDataURL("image/jpeg", quality)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    // Object URLs and data URLs are same-origin; this keeps a remote src from
    // tainting the canvas and making toDataURL throw.
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("could not load the image to crop"))
    img.src = src
  })
}
