import { Box } from '@chakra-ui/react'
import type {
  BookCharacterSheet,
  GameMode,
  T02CharacterSheet,
} from 'services/characterSheet'
import { standardInventoryLimit, t02SkillLimit } from 'services/characterSheet'
import {
  BooleanField,
  GameModeField,
  NumberField,
  Section,
  TextAreaField,
  TextField,
} from './CharacterSheetFields'
import { SkillList, WeaponList } from './CharacterSheetLists'
import { InventoryList } from './InventoryLists'

export function T02SheetForm({
  sheet,
  gameMode,
  onUpdate,
  onSetGameMode,
}: {
  sheet: T02CharacterSheet
  gameMode: GameMode | null
  onUpdate: (sheet: BookCharacterSheet) => boolean
  onSetGameMode: (gameMode: GameMode) => boolean
}) {
  return (
    <Box display="flex" flexDirection="column" gap="5">
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
          label="Constitution"
          value={sheet.constitution}
          onChange={constitution => onUpdate({ ...sheet, constitution })}
        />
        <NumberField
          label="Chance"
          value={sheet.luck}
          onChange={luck => onUpdate({ ...sheet, luck })}
        />
      </Section>
      <SkillList
        label="Talents"
        skills={sheet.skills}
        limit={t02SkillLimit}
        getName={skill => skill}
        updateName={(_, name) => name}
        createSkill={() => 'Nouveau talent'}
        onChange={skills => onUpdate({ ...sheet, skills })}
      />
      <WeaponList
        weapons={sheet.weapons}
        onChange={weapons => onUpdate({ ...sheet, weapons })}
      />
      <TextAreaField
        label="Dégâts actuels"
        value={sheet.currentDamage}
        onChange={currentDamage => onUpdate({ ...sheet, currentDamage })}
      />
      <GameModeField bookId="T02" value={gameMode} onChange={onSetGameMode} />
      <Section title="Réputation">
        <NumberField
          label="Réputation (−5 à +5)"
          value={sheet.reputation}
          min={-5}
          max={5}
          onChange={reputation =>
            onUpdate({ ...sheet, reputation: reputation ?? 0 })
          }
        />
      </Section>
      <Section title="Jours écoulés">
        {sheet.passedDays.map((checked, index) => (
          <BooleanField
            key={index}
            label={`Jour ${index + 1}`}
            checked={checked}
            onChange={value =>
              onUpdate({
                ...sheet,
                passedDays: sheet.passedDays.map((day, dayIndex) =>
                  dayIndex === index ? value : day,
                ),
              })
            }
          />
        ))}
      </Section>
      <TextField
        label="Prochain réveil"
        value={sheet.nextWakeUp}
        onChange={nextWakeUp => onUpdate({ ...sheet, nextWakeUp })}
      />
      <InventoryList
        inventory={sheet.inventory}
        overflow={sheet.inventoryOverflow}
        limit={standardInventoryLimit}
        onChange={(inventory, inventoryOverflow) =>
          onUpdate({ ...sheet, inventory, inventoryOverflow })
        }
      />
    </Box>
  )
}
