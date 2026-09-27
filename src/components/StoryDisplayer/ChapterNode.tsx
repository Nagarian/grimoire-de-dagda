import classNames from 'classnames'
import type { ChapterBadge } from 'services/chapterType'
import { chapterBadgeHeight } from 'services/chapterType'
import type { LayoutNode } from 'services/graphLayout'
import { ChapterBadgeGlyph } from './ChapterBadgeGlyph'
import { ChapterShape } from './ChapterShape'

export type ChapterNodeProps = {
  node: LayoutNode
}

/** The `chapter-<n>` id is what the chapter search looks up. */
export function chapterElementId(chapter: string): string {
  return `chapter-${chapter}`
}

export function ChapterNode({ node }: ChapterNodeProps) {
  const shapeY = node.badges.length > 0 ? chapterBadgeHeight : 0
  const shapeHeight = node.height - shapeY

  return (
    <g
      id={chapterElementId(node.id)}
      className={classNames('chapter', ...node.classNames)}
      transform={`translate(${node.x} ${node.y})`}
    >
      <g transform={`translate(0 ${shapeY})`}>
        <ChapterShape
          shape={node.shape}
          width={node.width}
          height={shapeHeight}
        />
      </g>
      <ChapterBadges badges={node.badges} width={node.width} />
      <text
        className="chapter-label"
        x={node.width / 2}
        y={shapeY + shapeHeight / 2}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {node.id}
      </text>
    </g>
  )
}

function ChapterBadges({
  badges,
  width,
}: {
  badges: ChapterBadge[]
  width: number
}) {
  const badgeWidth = 24
  const totalWidth = badges.length * badgeWidth
  const startX = (width - totalWidth) / 2

  return (
    <g className="chapter-badges" aria-hidden="true">
      {badges.map((badge, index) => (
        <ChapterBadgeGlyph
          key={`${badge}-${index}`}
          badge={badge}
          x={startX + index * badgeWidth}
        />
      ))}
    </g>
  )
}
