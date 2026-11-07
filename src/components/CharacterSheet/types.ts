import type { ChapterId } from 'services/chapterDsl'

export type SavepointContext = {
  markerChapterId: ChapterId
  resumeChapterId: ChapterId
}
