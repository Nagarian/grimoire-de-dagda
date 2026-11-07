import {
  Box,
  createListCollection,
  Field,
  Portal,
  Select,
} from '@chakra-ui/react'
import type {
  BookCharacterSheet,
  GameMode,
  T02CharacterSheet,
} from 'services/characterSheet'
import { standardInventoryLimit, t02SkillLimit } from 'services/characterSheet'
import { getBookData } from 'services/bookData'
import { Section } from '../Inputs/Section'
import { ReputationField } from '../Inputs/ReputationField'
import { BooleanField } from '../Inputs/BooleanField'
import { TextAreaField } from '../Inputs/TextAreaField'
import { NumberField } from '../Inputs/NumberField'
import { GameModeField } from '../Inputs/GameModeField'
import { WeaponList } from '../Inputs/WeaponList'
import { SkillList } from '../Inputs/SkillList'
import { InventoryList } from '../Inputs/InventoryLists'

const wakeUpChapterCollection = createListCollection({
  items: [
    { label: 'Aucun chapitre sélectionné', value: '' },
    ...getBookData('T02').chapters.map(chapter => ({
      label:
        chapter.number === 'MAP'
          ? 'Carte du monde'
          : `Chapitre ${chapter.number}`,
      value: chapter.number,
    })),
  ],
})

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
      <Section title="Caractéristiques" columns={3}>
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
        <ReputationField
          value={sheet.reputation}
          onChange={reputation => onUpdate({ ...sheet, reputation })}
        />
      </Section>
      <Section title="Jours écoulés" columns={sheet.passedDays.length}>
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
        <Field.Root gridColumn="1 / -1">
          <Field.Label>Prochain réveil</Field.Label>
          <Select.Root
            collection={wakeUpChapterCollection}
            value={sheet.nextWakeUp ? [sheet.nextWakeUp] : []}
            onValueChange={event => {
              const nextWakeUp = event.value.at(0)
              if (nextWakeUp !== undefined) {
                onUpdate({ ...sheet, nextWakeUp })
              }
            }}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="Choisir un chapitre" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {wakeUpChapterCollection.items.map(item => (
                    <Select.Item key={item.value} item={item}>
                      {item.label}
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
        </Field.Root>
      </Section>
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
