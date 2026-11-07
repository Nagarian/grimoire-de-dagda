import { Box } from '@chakra-ui/react'
import type {
  BookCharacterSheet,
  GameMode,
  T03CharacterSheet,
  T04CharacterSheet,
} from 'services/characterSheet'
import { standardInventoryLimit } from 'services/characterSheet'
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

export function T03SheetForm(
  props: SharedSheetFormProps & { sheet: T03CharacterSheet },
) {
  return (
    <MainTomeLaterForm
      {...props}
      sheet={props.sheet}
      gameModePlacement="after-damage"
    />
  )
}

export function T04SheetForm({
  sheet,
  ...props
}: SharedSheetFormProps & { sheet: T04CharacterSheet }) {
  return (
    <Box display="flex" flexDirection="column" gap="5">
      <MainTomeLaterForm
        {...props}
        sheet={sheet}
        gameModePlacement="after-characteristics"
      />
      <Section title="Fragments de la prophétie">
        {sheet.prophecyFragments.map((checked, index) => (
          <BooleanField
            key={index}
            label={`Fragment ${index + 1}`}
            checked={checked}
            onChange={value =>
              props.onUpdate({
                ...sheet,
                prophecyFragments: sheet.prophecyFragments.map(
                  (fragment, fragmentIndex) =>
                    fragmentIndex === index ? value : fragment,
                ),
              })
            }
          />
        ))}
      </Section>
    </Box>
  )
}

type SharedSheetFormProps = {
  gameMode: GameMode | null
  onUpdate: (sheet: BookCharacterSheet) => boolean
  onSetGameMode: (gameMode: GameMode) => boolean
}

function MainTomeLaterForm({
  sheet,
  gameMode,
  gameModePlacement,
  onUpdate,
  onSetGameMode,
}: SharedSheetFormProps & {
  sheet: T03CharacterSheet | T04CharacterSheet
  gameModePlacement: 'after-characteristics' | 'after-damage'
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
      {gameModePlacement === 'after-characteristics' && (
        <GameModeField
          bookId={sheet.bookId}
          value={gameMode}
          onChange={onSetGameMode}
        />
      )}
      <SkillList
        label="Talents"
        skills={sheet.skills}
        getName={skill => skill.name}
        updateName={(skill, name) => ({ ...skill, name })}
        createSkill={() => ({ name: 'Nouveau talent', level: 1 })}
        getLevel={skill => skill.level}
        updateLevel={(skill, level) => ({ ...skill, level })}
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
      {gameModePlacement === 'after-damage' && (
        <GameModeField
          bookId={sheet.bookId}
          value={gameMode}
          onChange={onSetGameMode}
        />
      )}
      <Section title="État et statut">
        <TextField
          label="État"
          value={sheet.state}
          onChange={state => onUpdate({ ...sheet, state })}
        />
        <TextField
          label="Statut"
          value={sheet.status}
          onChange={status => onUpdate({ ...sheet, status })}
        />
      </Section>
      <NumberField
        label="Expérience"
        value={sheet.experience}
        min={0}
        onChange={experience =>
          onUpdate({ ...sheet, experience: experience ?? 0 })
        }
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
