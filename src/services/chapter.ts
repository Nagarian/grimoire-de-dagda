export type ChapterType =
  | 'START'
  | 'END'
  | 'STORY'
  | 'ENIGME'
  | 'SOLUTION'
  | 'FIGHT'
  | 'SAVEPOINT'
  | 'RRO'
  | 'ROLOC'
  | 'GT'
  | 'ROS'


export type Path = {
  to: string
  condition?: string
}

export type Action = {
  type: string
  value?: string
}

export type Chapter = {
  book: string
  id: string
  type: ChapterType
  paths: Path[]
  actions: Action[]
}
