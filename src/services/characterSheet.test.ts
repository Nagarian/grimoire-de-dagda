import {
  convertMainTomeSheet,
  createBlankBookSheet,
  createCharacterSheetState,
  isCharacterSheetState,
  standardInventoryLimit,
} from 'services/characterSheet'
import type {
  CharacterSheetState,
  T01CharacterSheet,
  T02CharacterSheet,
} from 'services/characterSheet'
import { describe, expect, it } from 'vitest'

describe('character sheet defaults', () => {
  it('creates blank sheets with each book’s required fixed-size trackers', () => {
    expect(createCharacterSheetState('T01', 'deadly')).toMatchObject({
      gameMode: 'deadly',
      sheets: {
        T01: {
          maxLife: null,
          currentLife: null,
          savepoints: [null, null, null],
        },
      },
    })
    expect(createBlankBookSheet('T02')).toMatchObject({
      passedDays: [false, false, false, false],
    })
    expect(createBlankBookSheet('T04')).toMatchObject({
      prophecyFragments: [false, false, false],
    })
    expect(createBlankBookSheet('T05')).toMatchObject({
      culotUses: [false, false, false],
    })
  })
})

describe('main-tome character sheet conversion', () => {
  it('preserves shared stats and inventory while adapting fields to T02', () => {
    const source = createBlankBookSheet('T01') as T01CharacterSheet
    source.maxLife = 20
    source.currentLife = 12
    source.dexterity = 8
    source.luck = 3
    source.skills = ['Pistage']
    source.weaponsAndFeatures = 'Épée : +2 en dextérité'
    source.inventory = Array.from({ length: 24 }, (_, index) => ({
      title: `Objet ${index + 1}`,
      quantity: 1,
    }))
    source.inventoryOverflow = [{ title: 'Potion', quantity: 2 }]

    const converted = convertMainTomeSheet(source, 'T02')

    expect(converted).toMatchObject({
      maxLife: 20,
      currentLife: 12,
      dexterity: 8,
      luck: 3,
      skills: ['Pistage'],
      weapons: [
        {
          name: 'Armes et spécificités',
          bonus: 'Épée : +2 en dextérité',
        },
      ],
      inventory: source.inventory.slice(0, standardInventoryLimit),
      inventoryOverflow: [
        ...source.inventory.slice(standardInventoryLimit),
        { title: 'Potion', quantity: 2 },
      ],
    })
  })

  it('gives T03+ skills level one and initializes experience', () => {
    const source: T02CharacterSheet = {
      ...(createBlankBookSheet('T02') as T02CharacterSheet),
      skills: ['Esquive', 'Pistage'],
    }

    expect(convertMainTomeSheet(source, 'T03')).toMatchObject({
      skills: [
        { name: 'Esquive', level: 1 },
        { name: 'Pistage', level: 1 },
      ],
      experience: 0,
    })
  })
})

describe('character sheet validation', () => {
  it('rejects invalid life totals, out-of-range reputation, and duplicate items', () => {
    const state = createCharacterSheetState('T02', 'simplified')
    const sheet = state.sheets.T02 as T02CharacterSheet

    expect(
      isCharacterSheetState({
        ...state,
        sheets: { T02: { ...sheet, maxLife: 5, currentLife: 6 } },
      }),
    ).toBe(false)
    expect(
      isCharacterSheetState({
        ...state,
        sheets: { T02: { ...sheet, reputation: 6 } },
      }),
    ).toBe(false)
    expect(
      isCharacterSheetState({
        ...state,
        sheets: {
          T02: {
            ...sheet,
            inventory: [
              { title: 'Potion', quantity: 1 },
              { title: 'potion', quantity: 1 },
            ],
          },
        },
      }),
    ).toBe(false)
  })

  it('accepts valid per-book state and fixed-length lists', () => {
    const state: CharacterSheetState = createCharacterSheetState(
      'T04',
      'storytelling',
    )
    expect(isCharacterSheetState(state)).toBe(true)
  })

  it('enforces T05 characteristic and equipment limits', () => {
    const state = createCharacterSheetState('T05', 'deadly')
    const sheet = createBlankBookSheet('T05')

    expect(
      isCharacterSheetState({
        ...state,
        sheets: { T05: { ...sheet, body: 11 } },
      }),
    ).toBe(false)
    expect(
      isCharacterSheetState({
        ...state,
        sheets: {
          T05: {
            ...sheet,
            weapons: [
              { name: 'Épée', effect: 'Assaut +1' },
              { name: 'Hache', effect: 'Assaut +2' },
            ],
          },
        },
      }),
    ).toBe(false)
  })
})
