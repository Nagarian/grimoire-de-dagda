import type { RefObject } from 'react'
import { useCallback, useEffect, useMemo, useRef } from 'react'

export type Rect = {
  x: number
  y: number
  width: number
  height: number
}

export type PanZoom = {
  /** Frames the whole diagram. */
  fit: () => void
  /** Zooms around the middle of the view; a `factor` above 1 zooms in. */
  zoomBy: (factor: number) => void
  /** Animates the view onto a region, leaving some room around it. */
  focusOn: (target: Rect) => void
  /** Moves the view so that a diagram point sits in the middle. */
  centerOn: (x: number, y: number) => void
  /** Called on every view change, for anything mirroring the visible region. */
  subscribe: (listener: (viewport: Rect) => void) => () => void
}

type UsePanZoomOptions = {
  svgRef: RefObject<SVGSVGElement | null>
  /** Diagram size. Zero while the layout is still being computed. */
  width: number
  height: number
}

type Pointer = {
  x: number
  y: number
}

/** How far out and in the reader may zoom, relative to the whole diagram. */
const minZoomOut = 1.5
const maxZoomIn = 60

/**
 * Pan and zoom by writing the `viewBox` attribute straight onto the SVG
 * element. Nothing here goes through React state: a book is several hundred
 * chapters, and re-rendering them on every pointer move would stutter.
 */
export function usePanZoom({
  svgRef,
  width,
  height,
}: UsePanZoomOptions): PanZoom {
  const viewport = useRef<Rect>({ x: 0, y: 0, width: 0, height: 0 })
  const listeners = useRef(new Set<(viewport: Rect) => void>())
  const animation = useRef<number>(0)
  const pointers = useRef(new Map<number, Pointer>())
  const pinchSpread = useRef<number>(0)

  const commit = useCallback(() => {
    const { x, y, width: w, height: h } = viewport.current
    svgRef.current?.setAttribute('viewBox', `${x} ${y} ${w} ${h}`)
    listeners.current.forEach(listener => {
      listener(viewport.current)
    })
  }, [svgRef])

  /** Height over width of the element, so the view never distorts. */
  const ratio = useCallback(() => {
    const box = svgRef.current?.getBoundingClientRect()
    return box && box.width > 0 ? box.height / box.width : 1
  }, [svgRef])

  /**
   * Keeps the view usable: never narrower than a handful of chapters, never
   * wider than a little more than the diagram, always centred over it.
   */
  const clamp = useCallback(
    (next: Rect): Rect => {
      if (width === 0 || height === 0) {
        return next
      }

      const whole = Math.max(width, height / ratio())
      const w = Math.min(
        Math.max(next.width, whole / maxZoomIn),
        whole * minZoomOut,
      )
      const h = w * ratio()

      return {
        width: w,
        height: h,
        x: Math.min(Math.max(next.x + next.width / 2, 0), width) - w / 2,
        y: Math.min(Math.max(next.y + next.height / 2, 0), height) - h / 2,
      }
    },
    [width, height, ratio],
  )

  const apply = useCallback(
    (next: Rect) => {
      cancelAnimationFrame(animation.current)
      viewport.current = clamp(next)
      commit()
    },
    [clamp, commit],
  )

  const fit = useCallback(() => {
    if (width === 0 || height === 0) {
      return
    }

    const w = Math.max(width, height / ratio())
    apply({
      x: (width - w) / 2,
      y: (height - w * ratio()) / 2,
      width: w,
      height: w * ratio(),
    })
  }, [apply, width, height, ratio])

  /** Zooms while keeping the given diagram point under the cursor. */
  const zoomAt = useCallback(
    (factor: number, anchorX: number, anchorY: number) => {
      const { x, y, width: w, height: h } = viewport.current
      const zoomed = clamp({ x, y, width: w / factor, height: h / factor })

      apply({
        ...zoomed,
        x: anchorX - ((anchorX - x) * zoomed.width) / w,
        y: anchorY - ((anchorY - y) * zoomed.height) / h,
      })
    },
    [apply, clamp],
  )

  const zoomBy = useCallback(
    (factor: number) => {
      const { x, y, width: w, height: h } = viewport.current
      zoomAt(factor, x + w / 2, y + h / 2)
    },
    [zoomAt],
  )

  const centerOn = useCallback(
    (x: number, y: number) => {
      const { width: w, height: h } = viewport.current
      apply({ x: x - w / 2, y: y - h / 2, width: w, height: h })
    },
    [apply],
  )

  const focusOn = useCallback(
    (target: Rect) => {
      // Give the target about a fifth of the view, so the reader still sees
      // enough of its surroundings to tell where they landed.
      const { width: w, height: h } = clamp({
        ...target,
        width: target.width * 5,
        height: target.width * 5 * ratio(),
      })
      const to = clamp({
        x: target.x + target.width / 2 - w / 2,
        y: target.y + target.height / 2 - h / 2,
        width: w,
        height: h,
      })
      const from = { ...viewport.current }
      const start = performance.now()
      const duration = 350

      const step = (now: number) => {
        const progress = Math.min((now - start) / duration, 1)
        // Ease out, so the move settles instead of stopping abruptly.
        const eased = 1 - (1 - progress) ** 3

        viewport.current = {
          x: from.x + (to.x - from.x) * eased,
          y: from.y + (to.y - from.y) * eased,
          width: from.width + (to.width - from.width) * eased,
          height: from.height + (to.height - from.height) * eased,
        }
        commit()

        if (progress < 1) {
          animation.current = requestAnimationFrame(step)
        }
      }

      cancelAnimationFrame(animation.current)
      animation.current = requestAnimationFrame(step)
    },
    [clamp, commit, ratio],
  )

  // Frame the diagram once it has been laid out, and follow element resizes so
  // the view keeps the element's aspect ratio.
  useEffect(() => {
    fit()

    const svg = svgRef.current
    if (!svg) {
      return
    }

    const observer = new ResizeObserver(() => {
      const { x, y, width: w, height: h } = viewport.current
      if (w === 0) {
        fit()
        return
      }
      apply({
        x,
        y: y + h / 2 - (w * ratio()) / 2,
        width: w,
        height: w * ratio(),
      })
    })
    observer.observe(svg)

    return () => {
      observer.disconnect()
    }
  }, [fit, apply, ratio, svgRef])

  // Wheel, drag and pinch are wired by hand: the wheel listener has to be
  // non-passive to keep the browser from zooming the page instead.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) {
      return
    }

    const toDiagram = (clientX: number, clientY: number): Pointer => {
      const box = svg.getBoundingClientRect()
      const { x, y, width: w, height: h } = viewport.current
      return {
        x: x + ((clientX - box.left) / box.width) * w,
        y: y + ((clientY - box.top) / box.height) * h,
      }
    }

    const pair = (): [Pointer, Pointer] | undefined => {
      const touches = [...pointers.current.values()]
      const first = touches.at(0)
      const second = touches.at(1)
      return first && second ? [first, second] : undefined
    }

    const spread = (): number => {
      const touches = pair()
      if (!touches) {
        return 0
      }
      const [first, second] = touches
      return Math.hypot(first.x - second.x, first.y - second.y)
    }

    const middle = (): Pointer | undefined => {
      const touches = pair()
      if (!touches) {
        return undefined
      }
      const [first, second] = touches
      return toDiagram((first.x + second.x) / 2, (first.y + second.y) / 2)
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const anchor = toDiagram(event.clientX, event.clientY)
      zoomAt(event.deltaY < 0 ? 1.15 : 1 / 1.15, anchor.x, anchor.y)
    }

    const onPointerDown = (event: PointerEvent) => {
      svg.setPointerCapture(event.pointerId)
      pointers.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      })
      pinchSpread.current = spread()
    }

    const onPointerMove = (event: PointerEvent) => {
      const previous = pointers.current.get(event.pointerId)
      if (!previous) {
        return
      }

      pointers.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      })

      if (pointers.current.size > 1) {
        const anchor = middle()
        const current = spread()
        if (anchor && pinchSpread.current > 0 && current > 0) {
          zoomAt(current / pinchSpread.current, anchor.x, anchor.y)
        }
        pinchSpread.current = current
        return
      }

      const box = svg.getBoundingClientRect()
      const { x, y, width: w, height: h } = viewport.current
      apply({
        x: x - ((event.clientX - previous.x) / box.width) * w,
        y: y - ((event.clientY - previous.y) / box.height) * h,
        width: w,
        height: h,
      })
    }

    const onPointerUp = (event: PointerEvent) => {
      pointers.current.delete(event.pointerId)
      pinchSpread.current = spread()
    }

    svg.addEventListener('wheel', onWheel, { passive: false })
    svg.addEventListener('pointerdown', onPointerDown)
    svg.addEventListener('pointermove', onPointerMove)
    svg.addEventListener('pointerup', onPointerUp)
    svg.addEventListener('pointercancel', onPointerUp)

    return () => {
      svg.removeEventListener('wheel', onWheel)
      svg.removeEventListener('pointerdown', onPointerDown)
      svg.removeEventListener('pointermove', onPointerMove)
      svg.removeEventListener('pointerup', onPointerUp)
      svg.removeEventListener('pointercancel', onPointerUp)
    }
  }, [svgRef, apply, zoomAt])

  useEffect(
    () => () => {
      cancelAnimationFrame(animation.current)
    },
    [],
  )

  const subscribe = useCallback((listener: (viewport: Rect) => void) => {
    listeners.current.add(listener)
    listener(viewport.current)
    return () => {
      listeners.current.delete(listener)
    }
  }, [])

  return useMemo(
    () => ({ fit, zoomBy, focusOn, centerOn, subscribe }),
    [fit, zoomBy, focusOn, centerOn, subscribe],
  )
}
