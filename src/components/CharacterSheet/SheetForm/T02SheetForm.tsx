import {
  Box,
  createListCollection,
  Field,
  Portal,
  Select,
} from '@chakra-ui/react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getBookColorPalette } from 'components/ui/theme'
import type {
  BookCharacterSheet,
  GameMode,
  T02CharacterSheet,
} from 'services/characterSheet'
import { standardInventoryLimit, t02SkillLimit } from 'services/characterSheet'
import { getBookData } from 'services/bookData'
import { getChapterLabel } from 'services/i18n'
import { Section } from '../Inputs/Section'
import { ReputationField } from '../Inputs/ReputationField'
import { BooleanField } from '../Inputs/BooleanField'
import { TextAreaField } from '../Inputs/TextAreaField'
import { NumberField } from '../Inputs/NumberField'
import { GameModeField } from '../Inputs/GameModeField'
import { WeaponList } from '../Inputs/WeaponList'
import { SkillList } from '../Inputs/SkillList'
import { InventoryList } from '../Inputs/InventoryLists'

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
  const { t } = useTranslation()
  const wakeUpChapterCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: t('sheet.chapterNone'), value: '' },
          ...getBookData('T02').chapters.map(chapter => ({
            label:
              chapter.number === 'MAP'
                ? t('chapter.map')
                : getChapterLabel(chapter.number),
            value: chapter.number,
          })),
        ],
      }),
    [t],
  )
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
        limit={t02SkillLimit}
        getName={skill => skill}
        createSkill={name => name}
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
      <GameModeField bookId="T02" value={gameMode} onChange={onSetGameMode} />
      <Section title={t('sheet.sections.reputation')}>
        <ReputationField
          value={sheet.reputation}
          onChange={reputation => onUpdate({ ...sheet, reputation })}
        />
      </Section>
      <Section
        title={t('sheet.sections.daysPassed')}
        columns={sheet.passedDays.length}
      >
        {sheet.passedDays.map((checked, index) => (
          <BooleanField
            key={index}
            label={t('sheet.day', { number: index + 1 })}
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
          <Field.Label>{t('sheet.fields.nextWakeUp')}</Field.Label>
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
                <Select.ValueText placeholder={t('sheet.chooseChapter')} />
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
        colorPalette={colorPalette}
        onChange={(inventory, inventoryOverflow) =>
          onUpdate({ ...sheet, inventory, inventoryOverflow })
        }
      />
    </Box>
  )
}
