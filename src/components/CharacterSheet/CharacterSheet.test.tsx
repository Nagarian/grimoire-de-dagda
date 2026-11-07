import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { CharacterSheet } from './CharacterSheet'
import { InventoryList } from './Inputs/InventoryLists'
import { MemoriesList } from './Inputs/MemoriesList'
import { Section } from './Inputs/Section'
import { NumberField } from './Inputs/NumberField'
import {
  createBlankBookSheet,
  isCharacterSheetState,
  t01InventoryLimit,
} from 'services/characterSheet'
import type {
  BookCharacterSheet,
  E01CharacterSheet,
  GameMode,
  InventoryItem,
  T01CharacterSheet,
  T02CharacterSheet,
  T05CharacterSheet,
} from 'services/characterSheet'
import { renderWithProviders } from 'test/renderWithProviders'

class TestResizeObserver implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', TestResizeObserver)
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    configurable: true,
    value: vi.fn<HTMLElement['scrollTo']>(),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo')
})

function renderSheet(
  sheet: E01CharacterSheet | T02CharacterSheet | T05CharacterSheet,
  gameMode: 'storytelling' | 'simplified' | 'deadly' | null = 'storytelling',
) {
  const onUpdate = vi.fn<(sheet: BookCharacterSheet) => boolean>(() => true)
  const onSetGameMode = vi.fn<(mode: GameMode) => boolean>(() => true)
  renderWithProviders(
    <CharacterSheet
      bookId={sheet.bookId}
      sheet={sheet}
      gameMode={gameMode}
      onUpdate={onUpdate}
      onSetGameMode={onSetGameMode}
      onRemoveCapsule={vi.fn<(index: number) => boolean>(() => true)}
    />,
  )
  return { onUpdate, onSetGameMode }
}

describe('CharacterSheet', () => {
  it('lets section children span columns while its title spans the full section', () => {
    renderWithProviders(
      <Section title="Caractéristiques" columns={2}>
        <div>Force</div>
        <div>Dextérité</div>
      </Section>,
    )

    const heading = screen.getByRole('heading', { name: 'Caractéristiques' })
    const header = heading.parentElement
    const section = header?.parentElement
    expect(section).not.toBeNull()
    expect(section).toHaveStyle({
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    })
    expect(header).toHaveStyle({ gridColumn: '1 / -1' })
    expect(screen.getByText('Force')).toBeInTheDocument()
    expect(screen.getByText('Dextérité')).toBeInTheDocument()
  })

  it('toggles the memories sort mode from the section header', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <MemoriesList
        memories={['Zèbre', 'Abeille']}
        onChange={vi.fn<() => void>()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Trier par nom' }))

    expect(
      screen.getByRole('button', { name: 'Afficher dans l’ordre enregistré' }),
    ).toBeInTheDocument()
  })

  it('keeps focus while editing a memory', async () => {
    const user = userEvent.setup()

    function StatefulMemoriesList() {
      const [memories, setMemories] = useState(['Souvenir'])
      return <MemoriesList memories={memories} onChange={setMemories} />
    }

    renderWithProviders(<StatefulMemoriesList />)
    const input = screen.getByRole('textbox', { name: 'Souvenir 1' })

    await user.click(input)
    await user.type(input, ' ajouté')

    expect(input).toHaveFocus()
    expect(input).toHaveValue('Souvenir ajouté')
  })

  it('keeps focus while updating a numeric field value', () => {
    function StatefulNumberField() {
      const [value, setValue] = useState<number | null>(1322)

      return (
        <NumberField
          label="Points de vie maximum"
          value={value}
          onChange={setValue}
        />
      )
    }

    renderWithProviders(<StatefulNumberField />)
    const input = screen.getByRole('spinbutton', {
      name: 'Points de vie maximum',
    })

    input.focus()
    fireEvent.change(input, { target: { value: '1323' } })

    expect(input).toHaveFocus()
    expect(input).toHaveValue('1323')
  })

  it('adds an inventory item with an unused title after removing an item', async () => {
    const user = userEvent.setup()
    const blankSheet = createBlankBookSheet('T01')
    if (blankSheet.bookId !== 'T01') {
      throw new Error('Expected the T01 sheet')
    }

    const initialInventory = [
      { title: 'Objet 1', quantity: 1 },
      { title: 'Objet 2', quantity: 1 },
      { title: 'Objet 3', quantity: 1 },
    ]
    let updatedInventory = initialInventory

    function StatefulInventoryList() {
      const [inventory, setInventory] =
        useState<InventoryItem[]>(initialInventory)

      return (
        <InventoryList
          inventory={inventory}
          overflow={[]}
          limit={t01InventoryLimit}
          onChange={nextInventory => {
            updatedInventory = nextInventory
            setInventory(nextInventory)
          }}
        />
      )
    }

    renderWithProviders(<StatefulInventoryList />)

    await user.click(screen.getAllByRole('button', { name: 'Retirer' })[0])
    await user.click(screen.getByRole('button', { name: 'Ajouter un objet' }))

    const sheet: T01CharacterSheet = {
      ...blankSheet,
      inventory: updatedInventory,
    }

    expect(
      isCharacterSheetState({
        gameMode: 'storytelling',
        sheets: { T01: sheet },
      }),
    ).toBe(true)
    expect(updatedInventory.map(item => item.title)).toEqual([
      'Objet 2',
      'Objet 3',
      'Objet 1',
    ])
    expect(screen.getByLabelText('Objet 3')).toHaveValue('Objet 1')
  })

  it('renders T05 sheet fields and applies the PDF stat limits', async () => {
    const user = userEvent.setup()
    const sheet = createBlankBookSheet('T05')
    if (sheet.bookId !== 'T05') {
      throw new Error('Expected the T05 sheet')
    }

    const { onUpdate, onSetGameMode } = renderSheet(sheet)

    expect(screen.getByRole('radio', { name: 'Histoire' })).toBeChecked()
    expect(screen.getByText('Histoire')).toBeVisible()
    expect(screen.getByLabelText('Corps')).toHaveAttribute('aria-valuemin', '4')
    expect(screen.getByLabelText('Corps')).toHaveAttribute(
      'aria-valuemax',
      '10',
    )
    expect(screen.getByText('Protection')).toBeVisible()
    expect(screen.getByText('Souvenirs')).toBeVisible()
    expect(
      screen.getByRole('checkbox', { name: 'Utilisation 1' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Simplifié' }))
    expect(onSetGameMode).toHaveBeenCalledWith('simplified')
    await user.click(screen.getByRole('checkbox', { name: 'Utilisation 1' }))
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ culotUses: [true, false, false] }),
    )
  })

  it('uses a reputation selector, checkbox cards, and a chapter select for T02', async () => {
    const user = userEvent.setup()
    const sheet = createBlankBookSheet('T02')
    if (sheet.bookId !== 'T02') {
      throw new Error('Expected the T02 sheet')
    }

    const { onUpdate } = renderSheet(sheet)
    await user.click(screen.getByRole('radio', { name: '5' }))
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ reputation: 5 }),
    )
    expect(screen.getByRole('checkbox', { name: 'Jour 1' })).toBeInTheDocument()

    await user.click(screen.getByRole('combobox', { name: 'Prochain réveil' }))
    await user.click(
      within(screen.getByRole('listbox')).getByRole('option', {
        name: 'Chapitre 3',
      }),
    )
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ nextWakeUp: '3' }),
    )
  }, 15_000)

  it('reports an invalid E01 localisation rather than silently ignoring it', () => {
    const sheet = createBlankBookSheet('E01')
    if (sheet.bookId !== 'E01') {
      throw new Error('Expected the E01 sheet')
    }
    const { onUpdate } = renderSheet(sheet, null)

    fireEvent.change(
      screen.getByLabelText('Prochain chapitre du Royaume des Ombres'),
      { target: { value: '9999' } },
    )

    expect(
      screen.getByText('Ce chapitre n’existe pas dans le Royaume des Ombres.'),
    ).toBeVisible()
    expect(onUpdate).not.toHaveBeenCalled()
  })
})
