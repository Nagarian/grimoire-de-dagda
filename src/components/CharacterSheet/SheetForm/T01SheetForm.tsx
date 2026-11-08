import { Box } from '@chakra-ui/react'
import { getBookColorPalette } from 'components/ui/theme'
import type {
  BookCharacterSheet,
  GameMode,
  T01CharacterSheet,
} from 'services/characterSheet'
import { t01InventoryLimit } from 'services/characterSheet'
import { Section } from '../Inputs/Section'
import { TextAreaField } from '../Inputs/TextAreaField'
import { NumberField } from '../Inputs/NumberField'
import { GameModeField } from '../Inputs/GameModeField'
import { SkillList } from '../Inputs/SkillList'
import { InventoryList } from '../Inputs/InventoryLists'

export function T01SheetForm({
  sheet,
  gameMode,
  onUpdate,
  onSetGameMode,
}: {
  sheet: T01CharacterSheet
  gameMode: GameMode | null
  onUpdate: (sheet: BookCharacterSheet) => boolean
  onSetGameMode: (gameMode: GameMode) => boolean
}) {
  const colorPalette = getBookColorPalette(sheet.bookId)

  return (
    <Box display="flex" flexDirection="column" gap="5">
      <GameModeField bookId="T01" value={gameMode} onChange={onSetGameMode} />
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
      <Section title="Caractéristiques">
        <NumberField
          label="Dextérité"
          value={sheet.dexterity}
          onChange={dexterity => onUpdate({ ...sheet, dexterity })}
        />
        <NumberField
          label="Chance"
          value={sheet.luck}
          onChange={luck => onUpdate({ ...sheet, luck })}
        />
      </Section>
      <SkillList
        label="Talent"
        skills={sheet.skills}
        limit={1}
        getName={skill => skill}
        createSkill={name => name}
        colorPalette={colorPalette}
        onChange={skills => onUpdate({ ...sheet, skills })}
      />
      <TextAreaField
        label="Armes et spécificités"
        value={sheet.weaponsAndFeatures}
        onChange={weaponsAndFeatures =>
          onUpdate({ ...sheet, weaponsAndFeatures })
        }
      />
      <InventoryList
        inventory={sheet.inventory}
        overflow={sheet.inventoryOverflow}
        limit={t01InventoryLimit}
        colorPalette={colorPalette}
        onChange={(inventory, inventoryOverflow) =>
          onUpdate({ ...sheet, inventory, inventoryOverflow })
        }
      />
    </Box>
  )
}
