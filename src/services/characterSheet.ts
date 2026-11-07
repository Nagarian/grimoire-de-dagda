import type { BookId } from 'services/books'
import type { ChapterId } from 'services/chapterDsl'

export const gameModes = ['storytelling', 'simplified', 'deadly'] as const
export type GameMode = (typeof gameModes)[number]

export type MainTomeId = 'T01' | 'T02' | 'T03' | 'T04'
export type CharacterTomeId = MainTomeId | 'T05'

export type InventoryItem = {
  title: string
  quantity: number
}

export type Skill = {
  name: string
  level: number
}

export type Weapon = {
  name: string
  bonus: string
}

export type Equipment = {
  name: string
  effect: string
}

export type T01CharacterSheet = {
  bookId: 'T01'
  maxLife: number | null
  currentLife: number | null
  dexterity: number | null
  luck: number | null
  skills: string[]
  weaponsAndFeatures: string
  inventory: InventoryItem[]
  inventoryOverflow: InventoryItem[]
  savepoints: (T01Savepoint | null)[]
}

export type T01Savepoint = {
  markerChapterId: ChapterId
  resumeChapterId: ChapterId
  sheet: Omit<T01CharacterSheet, 'savepoints'>
  gameMode: GameMode | null
}

export type T02CharacterSheet = {
  bookId: 'T02'
  maxLife: number | null
  currentLife: number | null
  dexterity: number | null
  constitution: number | null
  luck: number | null
  skills: string[]
  weapons: Weapon[]
  currentDamage: string
  reputation: number
  passedDays: boolean[]
  nextWakeUp: string
  inventory: InventoryItem[]
  inventoryOverflow: InventoryItem[]
}

export type T03CharacterSheet = {
  bookId: 'T03'
  maxLife: number | null
  currentLife: number | null
  dexterity: number | null
  constitution: number | null
  luck: number | null
  skills: Skill[]
  weapons: Weapon[]
  currentDamage: string
  state: string
  status: string
  experience: number
  inventory: InventoryItem[]
  inventoryOverflow: InventoryItem[]
}

export type T04CharacterSheet = Omit<T03CharacterSheet, 'bookId'> & {
  bookId: 'T04'
  prophecyFragments: boolean[]
}

export type T05CharacterSheet = {
  bookId: 'T05'
  body: number | null
  mind: number | null
  charisma: number | null
  maxLife: number | null
  currentLife: number | null
  money: number | null
  inventory: string[]
  culotUses: boolean[]
  weapons: Equipment[]
  armor: Equipment[]
  memories: string[]
}

export type E01Capsule = {
  originBook: BookId
  deathChapter: string
  returnChapter: string
}

export type E01CharacterSheet = {
  bookId: 'E01'
  localisation: ChapterId | null
  capsules: E01Capsule[]
}

export type BookCharacterSheet =
  | T01CharacterSheet
  | T02CharacterSheet
  | T03CharacterSheet
  | T04CharacterSheet
  | T05CharacterSheet
  | E01CharacterSheet

export type CharacterSheetState = {
  gameMode: GameMode | null
  sheets: Partial<Record<BookId, BookCharacterSheet>>
}

export const t01InventoryLimit = 24
export const standardInventoryLimit = 14
export const t05InventoryLimit = 12
export const e01CapsuleLimit = 15
export const t02SkillLimit = 2

export function createCharacterSheetState(
  bookId: CharacterTomeId,
  gameMode: GameMode | null,
): CharacterSheetState {
  return {
    gameMode,
    sheets: { [bookId]: createBlankBookSheet(bookId) },
  }
}

export function createBlankBookSheet(bookId: BookId): BookCharacterSheet {
  switch (bookId) {
    case 'T01':
      return {
        bookId,
        maxLife: null,
        currentLife: null,
        dexterity: null,
        luck: null,
        skills: [],
        weaponsAndFeatures: '',
        inventory: [],
        inventoryOverflow: [],
        savepoints: [null, null, null],
      }
    case 'T02':
      return {
        bookId,
        maxLife: null,
        currentLife: null,
        dexterity: null,
        constitution: null,
        luck: null,
        skills: [],
        weapons: [],
        currentDamage: '',
        reputation: 0,
        passedDays: [false, false, false, false],
        nextWakeUp: '',
        inventory: [],
        inventoryOverflow: [],
      }
    case 'T03':
      return createBlankT03Sheet()
    case 'T04':
      return {
        ...createBlankT03Sheet(),
        bookId: 'T04',
        prophecyFragments: [false, false, false],
      }
    case 'T05':
      return {
        bookId,
        body: null,
        mind: null,
        charisma: null,
        maxLife: null,
        currentLife: null,
        money: null,
        inventory: [],
        culotUses: [false, false, false],
        weapons: [],
        armor: [],
        memories: [],
      }
    case 'E01':
      return { bookId, localisation: null, capsules: [] }
  }
}

export function convertMainTomeSheet(
  source: Extract<BookCharacterSheet, { bookId: MainTomeId }>,
  targetBookId: MainTomeId,
): Extract<BookCharacterSheet, { bookId: MainTomeId }> {
  const skills = source.skills.map(skillName =>
    typeof skillName === 'string' ? skillName : skillName.name,
  )
  const sourceWeapons =
    source.bookId === 'T01'
      ? source.weaponsAndFeatures.trim()
        ? [{ name: 'Armes et spécificités', bonus: source.weaponsAndFeatures }]
        : []
      : source.weapons
  const sourceDamage = source.bookId === 'T01' ? '' : source.currentDamage
  const allInventory = normalizeInventory([
    ...source.inventory,
    ...source.inventoryOverflow,
  ])
  const inventoryLimit =
    targetBookId === 'T01' ? t01InventoryLimit : standardInventoryLimit
  const inventory = allInventory.slice(0, inventoryLimit)
  const inventoryOverflow = allInventory.slice(inventoryLimit)

  if (targetBookId === 'T01') {
    return {
      bookId: 'T01',
      maxLife: source.maxLife,
      currentLife: source.currentLife,
      dexterity: source.dexterity,
      luck: source.luck,
      skills: skills.slice(0, 1),
      weaponsAndFeatures:
        source.bookId === 'T01'
          ? source.weaponsAndFeatures
          : [
              ...sourceWeapons.map(weapon => `${weapon.name}: ${weapon.bonus}`),
              sourceDamage,
            ]
              .filter(value => value.trim() !== '')
              .join('\n'),
      inventory,
      inventoryOverflow,
      savepoints: [null, null, null],
    }
  }

  const constitution = source.bookId === 'T01' ? null : source.constitution

  if (targetBookId === 'T02') {
    return {
      bookId: targetBookId,
      maxLife: source.maxLife,
      currentLife: source.currentLife,
      dexterity: source.dexterity,
      constitution,
      luck: source.luck,
      skills: skills.slice(0, t02SkillLimit),
      weapons: sourceWeapons,
      currentDamage: sourceDamage,
      reputation: source.bookId === 'T02' ? source.reputation : 0,
      passedDays:
        source.bookId === 'T02'
          ? source.passedDays
          : [false, false, false, false],
      nextWakeUp: source.bookId === 'T02' ? source.nextWakeUp : '',
      inventory,
      inventoryOverflow,
    }
  }

  if (targetBookId === 'T03') {
    return convertToT03(source, constitution, sourceWeapons, sourceDamage)
  }

  const t03Sheet = convertToT03(
    source,
    constitution,
    sourceWeapons,
    sourceDamage,
  )
  return {
    ...t03Sheet,
    bookId: 'T04',
    prophecyFragments:
      source.bookId === 'T04'
        ? source.prophecyFragments
        : [false, false, false],
  }
}

function createBlankT03Sheet(): T03CharacterSheet {
  return {
    bookId: 'T03',
    maxLife: null,
    currentLife: null,
    dexterity: null,
    constitution: null,
    luck: null,
    skills: [],
    weapons: [],
    currentDamage: '',
    state: '',
    status: '',
    experience: 0,
    inventory: [],
    inventoryOverflow: [],
  }
}

function convertToT03(
  source: Extract<BookCharacterSheet, { bookId: MainTomeId }>,
  constitution: number | null,
  weapons: Weapon[],
  currentDamage: string,
): T03CharacterSheet {
  const skills =
    source.bookId === 'T03' || source.bookId === 'T04'
      ? source.skills
      : source.skills.map(name => ({ name, level: 1 }))
  const inventory = normalizeInventory([
    ...source.inventory,
    ...source.inventoryOverflow,
  ])
  return {
    bookId: 'T03',
    maxLife: source.maxLife,
    currentLife: source.currentLife,
    dexterity: source.dexterity,
    constitution,
    luck: source.luck,
    skills,
    weapons,
    currentDamage,
    state:
      source.bookId === 'T03' || source.bookId === 'T04' ? source.state : '',
    status:
      source.bookId === 'T03' || source.bookId === 'T04' ? source.status : '',
    experience:
      source.bookId === 'T03' || source.bookId === 'T04'
        ? source.experience
        : 0,
    inventory: inventory.slice(0, standardInventoryLimit),
    inventoryOverflow: inventory.slice(standardInventoryLimit),
  }
}

export function isGameMode(value: unknown): value is GameMode {
  return gameModes.some(mode => mode === value)
}

export function isCharacterSheetState(
  value: unknown,
): value is CharacterSheetState {
  if (
    !isRecord(value) ||
    (value.gameMode !== null && !isGameMode(value.gameMode)) ||
    !isRecord(value.sheets)
  ) {
    return false
  }

  return Object.entries(value.sheets).every(
    ([bookId, sheet]) =>
      isBookIdValue(bookId) && isBookCharacterSheet(sheet, bookId),
  )
}

function isBookCharacterSheet(
  value: unknown,
  bookId: BookId,
): value is BookCharacterSheet {
  if (!isRecord(value) || value.bookId !== bookId) {
    return false
  }

  switch (bookId) {
    case 'T01':
      return (
        nullableInteger(value.maxLife) &&
        nullableInteger(value.currentLife) &&
        validLife(value.currentLife, value.maxLife) &&
        nullableInteger(value.dexterity) &&
        nullableInteger(value.luck) &&
        isStringArray(value.skills) &&
        value.skills.length <= 1 &&
        typeof value.weaponsAndFeatures === 'string' &&
        isInventory(value.inventory, t01InventoryLimit) &&
        isInventory(value.inventoryOverflow, Number.MAX_SAFE_INTEGER) &&
        Array.isArray(value.savepoints) &&
        value.savepoints.length === 3 &&
        value.savepoints.every(
          savepoint => savepoint === null || isT01Savepoint(savepoint),
        )
      )
    case 'T02':
      return (
        nullableInteger(value.maxLife) &&
        nullableInteger(value.currentLife) &&
        validLife(value.currentLife, value.maxLife) &&
        nullableInteger(value.dexterity) &&
        nullableInteger(value.constitution) &&
        nullableInteger(value.luck) &&
        isStringArray(value.skills) &&
        value.skills.length <= t02SkillLimit &&
        isWeaponArray(value.weapons) &&
        typeof value.currentDamage === 'string' &&
        isIntegerInRange(value.reputation, -5, 5) &&
        isBooleanArray(value.passedDays, 4) &&
        typeof value.nextWakeUp === 'string' &&
        isInventory(value.inventory, standardInventoryLimit) &&
        isInventory(value.inventoryOverflow, Number.MAX_SAFE_INTEGER)
      )
    case 'T03':
      return isT03Sheet(value)
    case 'T04':
      return (
        isT03Sheet(value) &&
        value.bookId === 'T04' &&
        isBooleanArray(value.prophecyFragments, 3)
      )
    case 'T05':
      return (
        nullableIntegerInRange(value.body, 4, 10) &&
        nullableIntegerInRange(value.mind, 4, 10) &&
        nullableIntegerInRange(value.charisma, 4, 10) &&
        nullableInteger(value.maxLife) &&
        nullableInteger(value.currentLife) &&
        validLife(value.currentLife, value.maxLife) &&
        nullableInteger(value.money) &&
        isUniqueStringArray(value.inventory) &&
        value.inventory.length <= t05InventoryLimit &&
        isBooleanArray(value.culotUses, 3) &&
        isEquipmentArray(value.weapons) &&
        value.weapons.length <= 1 &&
        isEquipmentArray(value.armor) &&
        value.armor.length <= 1 &&
        isStringArray(value.memories)
      )
    case 'E01':
      return (
        (value.localisation === null || isChapterId(value.localisation)) &&
        Array.isArray(value.capsules) &&
        value.capsules.length <= e01CapsuleLimit &&
        value.capsules.every(isE01Capsule)
      )
  }
}

function isT03Sheet(value: Record<string, unknown>): boolean {
  return (
    nullableInteger(value.maxLife) &&
    nullableInteger(value.currentLife) &&
    validLife(value.currentLife, value.maxLife) &&
    nullableInteger(value.dexterity) &&
    nullableInteger(value.constitution) &&
    nullableInteger(value.luck) &&
    isSkillArray(value.skills) &&
    isWeaponArray(value.weapons) &&
    typeof value.currentDamage === 'string' &&
    typeof value.state === 'string' &&
    typeof value.status === 'string' &&
    isIntegerInRange(value.experience, 0, Number.MAX_SAFE_INTEGER) &&
    isInventory(value.inventory, standardInventoryLimit) &&
    isInventory(value.inventoryOverflow, Number.MAX_SAFE_INTEGER)
  )
}

function isT01Savepoint(value: unknown): value is T01Savepoint {
  if (
    !isRecord(value) ||
    !isT01ChapterId(value.markerChapterId) ||
    !isT01ChapterId(value.resumeChapterId) ||
    (value.gameMode !== null && !isGameMode(value.gameMode)) ||
    !isRecord(value.sheet)
  ) {
    return false
  }

  const sheet = value.sheet
  return (
    sheet.bookId === 'T01' &&
    nullableInteger(sheet.maxLife) &&
    nullableInteger(sheet.currentLife) &&
    validLife(sheet.currentLife, sheet.maxLife) &&
    nullableInteger(sheet.dexterity) &&
    nullableInteger(sheet.luck) &&
    isStringArray(sheet.skills) &&
    sheet.skills.length <= 1 &&
    typeof sheet.weaponsAndFeatures === 'string' &&
    isInventory(sheet.inventory, t01InventoryLimit) &&
    isInventory(sheet.inventoryOverflow, Number.MAX_SAFE_INTEGER)
  )
}

function isE01Capsule(value: unknown): value is E01Capsule {
  return (
    isRecord(value) &&
    typeof value.originBook === 'string' &&
    isBookIdValue(value.originBook) &&
    value.originBook !== 'E01' &&
    typeof value.deathChapter === 'string' &&
    value.deathChapter !== '' &&
    typeof value.returnChapter === 'string' &&
    value.returnChapter !== ''
  )
}

function isBookIdValue(value: string): value is BookId {
  return (
    value === 'T01' ||
    value === 'T02' ||
    value === 'T03' ||
    value === 'T04' ||
    value === 'T05' ||
    value === 'E01'
  )
}

function isInventory(value: unknown, limit: number): value is InventoryItem[] {
  if (
    Array.isArray(value) &&
    value.length <= limit &&
    value.every(
      item =>
        isRecord(item) &&
        typeof item.title === 'string' &&
        item.title.trim() !== '' &&
        isIntegerInRange(item.quantity, 1, Number.MAX_SAFE_INTEGER),
    )
  ) {
    const titles = value.map(item => item.title.trim().toLocaleLowerCase())
    return new Set(titles).size === titles.length
  }
  return false
}

function isWeaponArray(value: unknown): value is Weapon[] {
  return (
    Array.isArray(value) &&
    value.every(
      item =>
        isRecord(item) &&
        typeof item.name === 'string' &&
        typeof item.bonus === 'string',
    )
  )
}

function isEquipmentArray(value: unknown): value is Equipment[] {
  return (
    Array.isArray(value) &&
    value.every(
      item =>
        isRecord(item) &&
        typeof item.name === 'string' &&
        typeof item.effect === 'string',
    )
  )
}

function isSkillArray(value: unknown): value is Skill[] {
  return (
    Array.isArray(value) &&
    value.every(
      skill =>
        isRecord(skill) &&
        typeof skill.name === 'string' &&
        isIntegerInRange(skill.level, 1, Number.MAX_SAFE_INTEGER),
    )
  )
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}

function isUniqueStringArray(value: unknown): value is string[] {
  if (!isStringArray(value)) {
    return false
  }
  const normalized = value.map(item => item.trim().toLocaleLowerCase())
  return new Set(normalized).size === normalized.length
}

function isBooleanArray(value: unknown, length: number): value is boolean[] {
  return (
    Array.isArray(value) &&
    value.length === length &&
    value.every(item => typeof item === 'boolean')
  )
}

function nullableInteger(value: unknown): value is number | null {
  return value === null || isIntegerInRange(value, 0, Number.MAX_SAFE_INTEGER)
}

function nullableIntegerInRange(
  value: unknown,
  min: number,
  max: number,
): value is number | null {
  return value === null || isIntegerInRange(value, min, max)
}

function validLife(current: unknown, maximum: unknown): boolean {
  return (
    current === null ||
    maximum === null ||
    (typeof current === 'number' &&
      typeof maximum === 'number' &&
      current <= maximum)
  )
}

function isIntegerInRange(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= minimum &&
    value <= maximum
  )
}

function isChapterId(value: unknown): value is ChapterId {
  return (
    typeof value === 'string' &&
    /^(T0[1-5]|E01)-[1-9]\d*$|^(T0[1-5]|E01)-MAP$/.test(value)
  )
}

function isT01ChapterId(value: unknown): value is ChapterId {
  return isChapterId(value) && value.startsWith('T01-')
}

function normalizeInventory(items: InventoryItem[]): InventoryItem[] {
  const normalized = new Map<string, InventoryItem>()
  for (const item of items) {
    const key = item.title.trim().toLocaleLowerCase()
    const existing = normalized.get(key)
    if (!existing) {
      normalized.set(key, { title: item.title, quantity: item.quantity })
      continue
    }

    normalized.set(key, {
      title: existing.title,
      quantity: existing.quantity + item.quantity,
    })
  }
  return [...normalized.values()]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
