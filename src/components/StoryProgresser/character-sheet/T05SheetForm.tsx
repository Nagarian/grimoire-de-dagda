import { Box, Button, Input } from '@chakra-ui/react'
import { useState } from 'react'
import type {
  BookCharacterSheet,
  GameMode,
  T05CharacterSheet,
} from 'services/characterSheet'
import { t05InventoryLimit } from 'services/characterSheet'
import { EquipmentList } from './CharacterSheetLists'
import { StringList } from './InventoryLists'
import {
  BooleanField,
  GameModeField,
  NumberField,
  Section,
} from './CharacterSheetFields'

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
  const [sortMemories, setSortMemories] = useState(false)
  const memories = sortMemories
    ? sheet.memories
        .map((memory, index) => ({ memory, index }))
        .sort((left, right) => left.memory.localeCompare(right.memory))
    : sheet.memories.map((memory, index) => ({ memory, index }))

  return (
    <Box display="flex" flexDirection="column" gap="5">
      <GameModeField bookId="T05" value={gameMode} onChange={onSetGameMode} />
      <Section title="Caractéristiques">
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
      <NumberField
        label="Bourse (boulons)"
        value={sheet.money}
        onChange={money => onUpdate({ ...sheet, money })}
      />
      <StringList
        title="Inventaire"
        values={sheet.inventory}
        limit={t05InventoryLimit}
        onChange={inventory => onUpdate({ ...sheet, inventory })}
      />
      <Section title="Culot">
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
        onChange={weapons => onUpdate({ ...sheet, weapons })}
      />
      <EquipmentList
        title="Protection"
        items={sheet.armor}
        limit={1}
        onChange={armor => onUpdate({ ...sheet, armor })}
      />
      <Section title="Mémoires">
        <Button
          variant="outline"
          size="sm"
          alignSelf="flex-start"
          onClick={() => setSortMemories(value => !value)}
        >
          {sortMemories ? 'Afficher dans l’ordre enregistré' : 'Trier par nom'}
        </Button>
        {memories.map(({ memory, index }) => (
          <Box
            key={`${index}-${memory}`}
            display="flex"
            gap="2"
            alignItems="center"
          >
            <Input
              aria-label={`Mémoire ${index + 1}`}
              value={memory}
              onChange={event => {
                const next = [...sheet.memories]
                next[index] = event.target.value
                onUpdate({ ...sheet, memories: next })
              }}
            />
            <Button
              variant="outline"
              onClick={() =>
                onUpdate({
                  ...sheet,
                  memories: sheet.memories.filter(
                    (_, memoryIndex) => memoryIndex !== index,
                  ),
                })
              }
            >
              Retirer
            </Button>
          </Box>
        ))}
        <Button
          variant="outline"
          alignSelf="flex-start"
          onClick={() =>
            onUpdate({
              ...sheet,
              memories: [...sheet.memories, 'Nouvelle mémoire'],
            })
          }
        >
          Ajouter une mémoire
        </Button>
      </Section>
    </Box>
  )
}
