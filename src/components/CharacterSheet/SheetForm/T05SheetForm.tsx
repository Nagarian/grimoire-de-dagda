import { Box } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const colorPalette = getBookColorPalette(sheet.bookId)

  return (
    <Box display="flex" flexDirection="column" gap="5">
      <GameModeField bookId="T05" value={gameMode} onChange={onSetGameMode} />
      <Section title={t('sheet.sections.characteristics')} columns={3}>
        <NumberField
          label={t('sheet.fields.body')}
          value={sheet.body}
          min={4}
          max={10}
          onChange={body => onUpdate({ ...sheet, body })}
        />
        <NumberField
          label={t('sheet.fields.mind')}
          value={sheet.mind}
          min={4}
          max={10}
          onChange={mind => onUpdate({ ...sheet, mind })}
        />
        <NumberField
          label={t('sheet.fields.charisma')}
          value={sheet.charisma}
          min={4}
          max={10}
          onChange={charisma => onUpdate({ ...sheet, charisma })}
        />
      </Section>
      <Section title={t('sheet.sections.health')} columns={2}>
        <NumberField
          label={t('sheet.fields.maxLife')}
          value={sheet.maxLife}
          onChange={maxLife => onUpdate({ ...sheet, maxLife })}
        />
        <NumberField
          label={t('sheet.fields.currentLife')}
          value={sheet.currentLife}
          max={sheet.maxLife ?? undefined}
          onChange={currentLife => onUpdate({ ...sheet, currentLife })}
        />
      </Section>
      <NumberField
        label={t('sheet.fields.money')}
        value={sheet.money}
        onChange={money => onUpdate({ ...sheet, money })}
      />
      <StringList
        title={t('sheet.inventoryTitle')}
        values={sheet.inventory}
        limit={t05InventoryLimit}
        colorPalette={colorPalette}
        onChange={inventory => onUpdate({ ...sheet, inventory })}
      />
      <Section
        title={t('sheet.sections.culot')}
        columns={sheet.culotUses.length}
      >
        {sheet.culotUses.map((checked, index) => (
          <BooleanField
            key={index}
            label={t('sheet.usage', { number: index + 1 })}
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
        title={t('sheet.sections.weapons')}
        itemType="weapon"
        items={sheet.weapons}
        limit={1}
        colorPalette={colorPalette}
        onChange={weapons => onUpdate({ ...sheet, weapons })}
      />
      <EquipmentList
        title={t('sheet.sections.protection')}
        itemType="protection"
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
