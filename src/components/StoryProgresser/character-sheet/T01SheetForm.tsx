import { Box } from '@chakra-ui/react'
import type { ChapterId } from 'services/chapterDsl'
import type {
  BookCharacterSheet,
  GameMode,
  T01CharacterSheet,
} from 'services/characterSheet'
import { t01InventoryLimit } from 'services/characterSheet'
import {
  GameModeField,
  NumberField,
  Section,
  TextAreaField,
} from './CharacterSheetFields'
import { Savepoints, SkillList } from './CharacterSheetLists'
import { InventoryList } from './InventoryLists'
import type { SavepointContext } from './types'

export function T01SheetForm({
  sheet,
  gameMode,
  savepointContext,
  onUpdate,
  onSetGameMode,
  onSaveAtSavepoint,
  onRestoreSavepoint,
}: {
  sheet: T01CharacterSheet
  gameMode: GameMode | null
  savepointContext?: SavepointContext
  onUpdate: (sheet: BookCharacterSheet) => boolean
  onSetGameMode: (gameMode: GameMode) => boolean
  onSaveAtSavepoint: (
    markerChapterId: ChapterId,
    resumeChapterId: ChapterId,
    slotIndex: number,
  ) => boolean
  onRestoreSavepoint: (slotIndex: number) => boolean
}) {
  return (
    <Box display="flex" flexDirection="column" gap="5">
      <GameModeField bookId="T01" value={gameMode} onChange={onSetGameMode} />
      <Section title="Points de vie">
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
        updateName={(_, name) => name}
        createSkill={() => 'Nouveau talent'}
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
        showBourse
        onChange={(inventory, inventoryOverflow) =>
          onUpdate({ ...sheet, inventory, inventoryOverflow })
        }
      />
      <Savepoints
        savepoints={sheet.savepoints}
        context={savepointContext}
        onSave={onSaveAtSavepoint}
        onRestore={onRestoreSavepoint}
      />
    </Box>
  )
}
