import { Box } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { getBookColorPalette } from 'components/ui/theme'
import type {
  BookCharacterSheet,
  GameMode,
  T03CharacterSheet,
} from 'services/characterSheet'
import { standardInventoryLimit } from 'services/characterSheet'
import { Section } from '../Inputs/Section'
import { TextAreaField } from '../Inputs/TextAreaField'
import { TextField } from '../Inputs/TextField'
import { NumberField } from '../Inputs/NumberField'
import { GameModeField } from '../Inputs/GameModeField'
import { WeaponList } from '../Inputs/WeaponList'
import { SkillList } from '../Inputs/SkillList'
import { InventoryList } from '../Inputs/InventoryLists'

export function T03SheetForm({
  sheet,
  gameMode,
  onUpdate,
  onSetGameMode,
}: {
  sheet: T03CharacterSheet
  gameMode: GameMode | null
  onUpdate: (sheet: BookCharacterSheet) => boolean
  onSetGameMode: (gameMode: GameMode) => boolean
}) {
  const { t } = useTranslation()
  const colorPalette = getBookColorPalette(sheet.bookId)

  return (
    <Box display="flex" flexDirection="column" gap="5">
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
      <Section title={t('sheet.sections.characteristics')} columns={3}>
        <NumberField
          label={t('sheet.fields.dexterity')}
          value={sheet.dexterity}
          onChange={dexterity => onUpdate({ ...sheet, dexterity })}
        />
        <NumberField
          label={t('sheet.fields.constitution')}
          value={sheet.constitution}
          onChange={constitution => onUpdate({ ...sheet, constitution })}
        />
        <NumberField
          label={t('sheet.fields.luck')}
          value={sheet.luck}
          onChange={luck => onUpdate({ ...sheet, luck })}
        />
      </Section>
      <SkillList
        label={t('sheet.fields.talents')}
        skills={sheet.skills}
        getName={skill => skill.name}
        createSkill={(name, level) => ({ name, level })}
        getLevel={skill => skill.level}
        updateSkill={(skill, name, level) => ({ ...skill, name, level })}
        colorPalette={colorPalette}
        onChange={skills => onUpdate({ ...sheet, skills })}
      />
      <WeaponList
        weapons={sheet.weapons}
        colorPalette={colorPalette}
        onChange={weapons => onUpdate({ ...sheet, weapons })}
      />
      <TextAreaField
        label={t('sheet.fields.damage')}
        value={sheet.currentDamage}
        onChange={currentDamage => onUpdate({ ...sheet, currentDamage })}
      />
      <GameModeField
        bookId={sheet.bookId}
        value={gameMode}
        onChange={onSetGameMode}
      />
      <Section title={t('sheet.sections.stateStatus')} columns={2}>
        <TextField
          label={t('sheet.fields.state')}
          value={sheet.state}
          onChange={state => onUpdate({ ...sheet, state })}
        />
        <TextField
          label={t('sheet.fields.status')}
          value={sheet.status}
          onChange={status => onUpdate({ ...sheet, status })}
        />
      </Section>
      <NumberField
        label={t('sheet.fields.experience')}
        value={sheet.experience}
        min={0}
        placeholder="0"
        onChange={experience => onUpdate({ ...sheet, experience })}
      />
      <InventoryList
        inventory={sheet.inventory}
        overflow={sheet.inventoryOverflow}
        limit={standardInventoryLimit}
        colorPalette={colorPalette}
        onChange={(inventory, inventoryOverflow) =>
          onUpdate({ ...sheet, inventory, inventoryOverflow })
        }
      />
    </Box>
  )
}
