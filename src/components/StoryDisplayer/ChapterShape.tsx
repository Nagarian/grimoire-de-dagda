import type { ChapterShape as Shape } from 'services/chapterType'

export type ChapterShapeProps = {
  shape: Shape
  width: number
  height: number
}

/**
 * The outline of a chapter, drawn inside the box between `0,0` and
 * `width,height`. Colours come from the `chapter-*` class on the parent group.
 */
export function ChapterShape({ shape, width, height }: ChapterShapeProps) {
  const radius = Math.min(width, height) / 2

  switch (shape) {
    case 'circle':
      return (
        <circle
          className="chapter-shape"
          cx={width / 2}
          cy={height / 2}
          r={radius}
        />
      )

    case 'double-circle':
      return (
        <>
          <circle
            className="chapter-shape"
            cx={width / 2}
            cy={height / 2}
            r={radius}
          />
          <circle
            className="chapter-shape"
            cx={width / 2}
            cy={height / 2}
            r={radius - 7}
          />
        </>
      )

    case 'diamond':
      return (
        <polygon
          className="chapter-shape"
          points={points([
            [width / 2, 0],
            [width, height / 2],
            [width / 2, height],
            [0, height / 2],
          ])}
        />
      )

    case 'hexagon':
      return (
        <polygon
          className="chapter-shape"
          points={points([
            [width * 0.22, 0],
            [width * 0.78, 0],
            [width, height / 2],
            [width * 0.78, height],
            [width * 0.22, height],
            [0, height / 2],
          ])}
        />
      )

    case 'bang':
      return <polygon className="chapter-shape" points={bang(width, height)} />

    case 'cylinder': {
      const rim = height * 0.14
      return (
        <>
          <path
            className="chapter-shape"
            d={`M 0 ${rim}
                a ${width / 2} ${rim} 0 0 1 ${width} 0
                v ${height - 2 * rim}
                a ${width / 2} ${rim} 0 0 1 ${-width} 0
                z`}
          />
          <path
            className="chapter-shape chapter-shape-detail"
            d={`M 0 ${rim} a ${width / 2} ${rim} 0 0 0 ${width} 0`}
          />
        </>
      )
    }

    case 'rectangle':
      return (
        <rect
          className="chapter-shape"
          width={width}
          height={height}
          rx="6"
          ry="6"
        />
      )

    case 'card': {
      // A sheet of paper with its top-left corner folded back.
      const fold = Math.min(width, height) * 0.24
      return (
        <>
          <path
            className="chapter-shape"
            d={`M ${fold} 0 H ${width} V ${height} H 0 V ${fold} Z`}
          />
          <path
            className="chapter-shape chapter-shape-detail"
            d={`M 0 ${fold} H ${fold} V 0`}
          />
        </>
      )
    }
  }
}

function points(corners: [number, number][]): string {
  return corners.map(([x, y]) => `${round(x)},${round(y)}`).join(' ')
}

/** An explosion, for combats. */
function bang(width: number, height: number): string {
  const spikes = 14
  const corners = Array.from({ length: spikes * 2 }, (_, index) => {
    const angle = (Math.PI * index) / spikes - Math.PI / 2
    const inset = index % 2 === 0 ? 1 : 0.74
    return [
      width / 2 + (Math.cos(angle) * width * inset) / 2,
      height / 2 + (Math.sin(angle) * height * inset) / 2,
    ] satisfies [number, number]
  })

  return points(corners)
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
