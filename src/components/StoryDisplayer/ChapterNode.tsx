import classNames from 'classnames'
import type { LayoutNode } from 'services/graphLayout'
import { ChapterShape } from './ChapterShape'

export type ChapterNodeProps = {
  node: LayoutNode
}

/** The `chapter-<n>` id is what the chapter search looks up. */
export function chapterElementId(chapter: string): string {
  return `chapter-${chapter}`
}

export function ChapterNode({ node }: ChapterNodeProps) {
  return (
    <g
      id={chapterElementId(node.id)}
      className={classNames('chapter', ...node.classNames)}
      transform={`translate(${node.x} ${node.y})`}
    >
      <ChapterShape
        shape={node.shape}
        width={node.width}
        height={node.height}
      />
      <text
        className="chapter-label"
        x={node.width / 2}
        y={node.height / 2}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {node.id}
      </text>
    </g>
  )
}
