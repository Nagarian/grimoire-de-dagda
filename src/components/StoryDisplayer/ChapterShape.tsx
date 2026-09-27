import type { ChapterShape as Shape } from 'services/chapterType'

export type ChapterShapeProps = {
  shape: Shape
  width: number
  height: number
}

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

    case 'teardrop':
      return (
        <path
          className="chapter-shape"
          d={`M ${width / 2} 0 C ${width * 0.8} ${height * 0.35}, ${width} ${
            height * 0.52
          }, ${width} ${height * 0.68} A ${width / 2} ${
            height * 0.32
          } 0 1 1 0 ${height * 0.68} C 0 ${height * 0.52}, ${
            width * 0.2
          } ${height * 0.35}, ${width / 2} 0 Z`}
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

function round(value: number): number {
  return Math.round(value * 100) / 100
}
