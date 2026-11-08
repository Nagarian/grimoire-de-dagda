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
  GameMode,
  InventoryItem,
  T01CharacterSheet,
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
  sheet: BookCharacterSheet,
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

    function StatefulMemoriesList() {
      const [sortMemories, setSortMemories] = useState(false)
      return (
        <MemoriesList
          memories={['Zèbre', 'Abeille']}
          sortMemories={sortMemories}
          onSortChange={setSortMemories}
          onChange={vi.fn<() => void>()}
        />
      )
    }

    renderWithProviders(<StatefulMemoriesList />)

    await user.click(screen.getByRole('button', { name: 'Trier par nom' }))
    expect(
      screen.getByRole('button', { name: 'Afficher dans l’ordre enregistré' }),
    ).toBeInTheDocument()
    const memories = screen.getByRole('region', { name: 'Souvenirs' })
    expect(
      within(memories)
        .getAllByText(/Zèbre|Abeille/)
        .map(element => element.textContent),
    ).toEqual(['Abeille', 'Zèbre'])
  })

  it('creates memories in a dialog and confirms their removal', async () => {
    const user = userEvent.setup()

    function StatefulMemoriesList() {
      const [memories, setMemories] = useState(['Souvenir'])
      const [sortMemories, setSortMemories] = useState(false)
      return (
        <MemoriesList
          memories={memories}
          sortMemories={sortMemories}
          onSortChange={setSortMemories}
          onChange={setMemories}
        />
      )
    }

    renderWithProviders(<StatefulMemoriesList />)

    expect(
      screen.queryByRole('textbox', { name: 'Souvenir 1' }),
    ).not.toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Ajouter un souvenir' }),
    )
    const input = screen.getByRole('textbox', { name: 'Souvenir' })
    expect(input).toHaveAttribute('placeholder', 'Décrivez le souvenir')
    await user.type(input, 'Nouvelle histoire')
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(screen.getByText('Nouvelle histoire')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Retirer' })[1])
    expect(screen.getByText('Nouvelle histoire')).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Confirmer la suppression' }),
    )
    expect(screen.queryByText('Nouvelle histoire')).not.toBeInTheDocument()
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

  it('creates inventory items in a dialog after confirming removal', async () => {
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
    expect(screen.getByText('Objet 1')).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Confirmer la suppression' }),
    )
    await user.click(screen.getByRole('button', { name: 'Ajouter un objet' }))
    expect(
      screen.getByRole('textbox', { name: 'Nom de l’objet' }),
    ).toHaveAttribute('placeholder', 'Ex. Potion de soin')
    expect(screen.getByRole('spinbutton', { name: 'Quantité' })).toHaveValue(
      '1',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Nom de l’objet' }),
      'Potion',
    )
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

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
    expect(updatedInventory).toEqual([
      { title: 'Objet 2', quantity: 1 },
      { title: 'Objet 3', quantity: 1 },
      { title: 'Potion', quantity: 1 },
    ])
    expect(screen.getByText('Potion')).toBeInTheDocument()
  })

  it('edits an inventory item from its edit dialog', async () => {
    const user = userEvent.setup()
    const initialInventory = [{ title: 'Potion', quantity: 1 }]
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
    expect(
      screen.queryByRole('textbox', { name: 'Objet 1' }),
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Modifier Objet 1' }))

    const name = screen.getByRole('textbox', { name: 'Nom de l’objet' })
    const quantity = screen.getByRole('spinbutton', { name: 'Quantité' })
    expect(name).toHaveValue('Potion')
    expect(quantity).toHaveValue('1')

    await user.clear(name)
    await user.type(name, 'Élixir')
    await user.clear(quantity)
    await user.type(quantity, '3')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(updatedInventory).toEqual([{ title: 'Élixir', quantity: 3 }])
    expect(screen.getByText('Élixir')).toBeInTheDocument()
  })

  it('creates a talent in a dialog without default values', async () => {
    const user = userEvent.setup()
    const sheet = createBlankBookSheet('T03')
    if (sheet.bookId !== 'T03') {
      throw new Error('Expected the T03 sheet')
    }

    const { onUpdate } = renderSheet(sheet)
    await user.click(screen.getByRole('button', { name: 'Ajouter un talent' }))

    const name = screen.getByRole('textbox', { name: 'Nom' })
    const level = screen.getByRole('spinbutton', { name: 'Niveau' })
    expect(name).toHaveValue('')
    expect(name).toHaveAttribute('placeholder', 'Nom du talent')
    expect(level).toHaveValue('')
    expect(level).toHaveAttribute('placeholder', '1')
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeDisabled()

    await user.type(name, 'Esquive')
    await user.type(level, '3')
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        skills: [{ name: 'Esquive', level: 3 }],
      }),
    )
  })

  it('updates a skill level through its edit dialog', async () => {
    const user = userEvent.setup()
    const blankSheet = createBlankBookSheet('T03')
    if (blankSheet.bookId !== 'T03') {
      throw new Error('Expected the T03 sheet')
    }

    const sheet = {
      ...blankSheet,
      skills: [{ name: 'Esquive', level: 3 }],
    }
    const { onUpdate } = renderSheet(sheet)
    await user.click(
      screen.getByRole('button', { name: 'Modifier le talent Esquive' }),
    )
    const editedLevel = screen.getByRole('spinbutton', { name: 'Niveau' })
    expect(editedLevel).toHaveValue('3')
    await user.clear(editedLevel)
    await user.type(editedLevel, '5')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        skills: [{ name: 'Esquive', level: 5 }],
      }),
    )
  })

  it('leaves experience blank and shows its placeholder', () => {
    const sheet = createBlankBookSheet('T03')
    if (sheet.bookId !== 'T03') {
      throw new Error('Expected the T03 sheet')
    }

    renderSheet(sheet)

    const experience = screen.getByRole('spinbutton', { name: 'Expérience' })
    expect(experience).toHaveValue('')
    expect(experience).toHaveAttribute('placeholder', '0')
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

    await user.click(screen.getByRole('button', { name: 'Trier par nom' }))
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ sortMemories: true }),
    )

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
    expect(screen.getByRole('radio', { name: '0' })).toBeChecked()
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
