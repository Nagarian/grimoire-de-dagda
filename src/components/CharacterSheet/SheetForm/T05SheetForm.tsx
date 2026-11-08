import { Box } from '@chakra-ui/react'
import { getBookColorPalette } from 'components/ui/theme'
import type {
  BookCharacterSheet,
  GameMode,
  T05CharacterSheet,
} from 'services/characterSheet'
import { t05InventoryLimit } from 'services/characterSheet'
import { EquipmentList } from '../Inputs/EquipmentList'
import { StringList } from '../Inputs/InventoryLists'
import { MemoriesList } from '../Inputs/MemoriesList'
import { Section } from '../Inputs/Section'
import { BooleanField } from '../Inputs/BooleanField'
import { NumberField } from '../Inputs/NumberField'
import { GameModeField } from '../Inputs/GameModeField'

export function T05SheetForm({
  sheet,
  gameMode,
  onUpdate,
  onSetGameMode,
}: {
  sheet: T05CharacterSheet
  gameMode: GameMode | null
  onUpdate: (sheet: BookCharacterSheet) => boolean
  onSetGameMode: (gameMode: GameMode) => boolean
}) {
  const colorPalette = getBookColorPalette(sheet.bookId)

  return (
    <Box display="flex" flexDirection="column" gap="5">
      <GameModeField bookId="T05" value={gameMode} onChange={onSetGameMode} />
      <Section title="Caractéristiques" columns={3}>
        <NumberField
          label="Corps"
          value={sheet.body}
          min={4}
          max={10}
          onChange={body => onUpdate({ ...sheet, body })}
        />
        <NumberField
          label="Esprit"
          value={sheet.mind}
          min={4}
          max={10}
          onChange={mind => onUpdate({ ...sheet, mind })}
        />
        <NumberField
          label="Charisme"
          value={sheet.charisma}
          min={4}
          max={10}
          onChange={charisma => onUpdate({ ...sheet, charisma })}
        />
      </Section>
      <Section title="Points de vie" columns={2}>
        <NumberField
          label="Points de vie maximum"
          value={sheet.maxLife}
          onChange={maxLife => onUpdate({ ...sheet, maxLife })}
        />
        <NumberField
          label="Points de vie actuels"
          value={sheet.currentLife}
          max={sheet.maxLife ?? undefined}
          onChange={currentLife => onUpdate({ ...sheet, currentLife })}
        />
      </Section>
      <NumberField
        label="Bourse (boulons)"
        value={sheet.money}
        onChange={money => onUpdate({ ...sheet, money })}
      />
      <StringList
        title="Inventaire"
        values={sheet.inventory}
        limit={t05InventoryLimit}
        colorPalette={colorPalette}
        onChange={inventory => onUpdate({ ...sheet, inventory })}
      />
      <Section title="Culot" columns={sheet.culotUses.length}>
        {sheet.culotUses.map((checked, index) => (
          <BooleanField
            key={index}
            label={`Utilisation ${index + 1}`}
            checked={checked}
            onChange={value =>
              onUpdate({
                ...sheet,
                culotUses: sheet.culotUses.map((use, useIndex) =>
                  useIndex === index ? value : use,
                ),
              })
            }
          />
        ))}
      </Section>
      <EquipmentList
        title="Armes"
        items={sheet.weapons}
        limit={1}
        colorPalette={colorPalette}
        onChange={weapons => onUpdate({ ...sheet, weapons })}
      />
      <EquipmentList
        title="Protection"
        items={sheet.armor}
        limit={1}
        colorPalette={colorPalette}
        onChange={armor => onUpdate({ ...sheet, armor })}
      />
      <MemoriesList
        memories={sheet.memories}
        sortMemories={sheet.sortMemories}
        colorPalette={colorPalette}
        onSortChange={sortMemories => onUpdate({ ...sheet, sortMemories })}
        onChange={memories => onUpdate({ ...sheet, memories })}
      />
    </Box>
  )
}
