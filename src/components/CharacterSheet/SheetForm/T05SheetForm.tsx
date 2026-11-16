import { Box, Button, Dialog, Portal, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getBookColorPalette } from 'components/ui/theme'
import type {
  BookCharacterSheet,
  GameMode,
  T05CharacterSheet,
} from 'services/characterSheet'
import { t05InventoryLimit } from 'services/characterSheet'
import type { InventoryItem } from 'services/characterSheet'
import { addInventoryItem, getInventoryItemName } from 'services/characterSheet'
import { EquipmentList } from '../Inputs/EquipmentList'
import { InventoryList } from '../Inputs/InventoryLists'
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
  const [pendingEquipment, setPendingEquipment] =
    useState<InventoryItem | null>(null)
  const [confirmArmorReplacement, setConfirmArmorReplacement] = useState(false)

  function chooseEquipmentDestination(destination: 'inventory' | 'armor') {
    if (!pendingEquipment) {
      return
    }

    if (destination === 'armor' && sheet.armor) {
      setConfirmArmorReplacement(true)
      return
    }

    const updated =
      destination === 'inventory'
        ? onUpdate({
            ...sheet,
            inventory: addInventoryItem(sheet.inventory, pendingEquipment),
          })
        : onUpdate({ ...sheet, armor: pendingEquipment })
    if (updated) {
      setPendingEquipment(null)
    }
  }

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
      <InventoryList
        bookId="T05"
        inventory={sheet.inventory}
        limit={t05InventoryLimit}
        colorPalette={colorPalette}
        onChange={inventory => onUpdate({ ...sheet, inventory })}
        onSelectEffectEquipment={setPendingEquipment}
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
        item={sheet.weapons}
        colorPalette={colorPalette}
        onChange={weapons => onUpdate({ ...sheet, weapons })}
      />
      <EquipmentList
        title={t('sheet.sections.protection')}
        itemType="protection"
        item={sheet.armor}
        colorPalette={colorPalette}
        onChange={armor => onUpdate({ ...sheet, armor })}
      />
      <Dialog.Root
        open={pendingEquipment !== null}
        onOpenChange={details => {
          if (!details.open) {
            setPendingEquipment(null)
            setConfirmArmorReplacement(false)
          }
        }}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner alignItems="center" justifyContent="center">
            <Dialog.Content colorPalette={colorPalette}>
              <Dialog.Header>
                <Dialog.Title>
                  {confirmArmorReplacement
                    ? t('sheet.replaceArmorTitle')
                    : t('sheet.chooseEquipmentDestination')}
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text>
                  {confirmArmorReplacement
                    ? t('sheet.replaceArmorConfirm', {
                        name: pendingEquipment
                          ? getInventoryItemName(pendingEquipment)
                          : '',
                      })
                    : t('sheet.equipmentDestinationDescription', {
                        name: pendingEquipment
                          ? getInventoryItemName(pendingEquipment)
                          : '',
                      })}
                </Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirmArmorReplacement) {
                      setConfirmArmorReplacement(false)
                    } else {
                      setPendingEquipment(null)
                    }
                  }}
                >
                  {t('form.cancel')}
                </Button>
                {confirmArmorReplacement ? (
                  <Button
                    onClick={() => {
                      if (
                        pendingEquipment &&
                        onUpdate({ ...sheet, armor: pendingEquipment })
                      ) {
                        setPendingEquipment(null)
                        setConfirmArmorReplacement(false)
                      }
                    }}
                  >
                    {t('form.replace')}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => chooseEquipmentDestination('inventory')}
                    >
                      {t('sheet.storeInInventory')}
                    </Button>
                    <Button onClick={() => chooseEquipmentDestination('armor')}>
                      {t('sheet.useAsArmor')}
                    </Button>
                  </>
                )}
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
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
