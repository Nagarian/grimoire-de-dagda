export type Weapon = {
  name: string
  bonus: string
}

export type Skill = {
  name: string
  /** Omitted before book 3 */
  level: number
}

export type GameMode = 'storytelling' | 'simplified' | 'deadly'

export type CharacterSheet = {
  currentLife: number
  maxLife: number
  dexterity: number
  luck: number
  /** From book 2 onwards */
  constitution: number
  /** Only 1 in book1, multiple after  */
  skill: Skill[]
  weapons: Weapon[]
  /** MaxLength: 24 in 1, then 14 */
  inventory: string[]
  /** From book 2 onwards */
  gameMode: GameMode
  /** From book 2 onwards
   * NB: should be calculatable
   */
  currentDamage: number
}

export type CharacterSheetBook1 = CharacterSheet & {
  save: [number, number, number]
}

export type CharacterSheetBook2 = CharacterSheet & {
  /** Between -5 to +5 */
  reputation: number
  daysPassed: number
  nextWakeUpEvent: string
}

export type CharacterSheetBook3 = CharacterSheet & {
  /** Fr: état */
  shape: string
  /** Fr: statut, apprenti, ainé */
  status: string
  experience: number
}

///////////////////
// Extensions books
///////////////////

export type DeadPosition = {
  book: string
  chapter: string
  resurrection: string
}

export type RoyaumeDesOmbresSheet = {
  localisation: number
  /** MaxLength: 15 */
  deadPositions: DeadPosition[]
}
