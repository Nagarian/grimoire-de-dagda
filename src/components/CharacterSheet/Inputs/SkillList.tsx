import {
  Box,
  Button,
  Field,
  Group,
  IconButton,
  Input,
  Text,
} from '@chakra-ui/react'
import { useState } from 'react'
import { LuPencil } from 'react-icons/lu'
import { updateAt } from '../utils'
import { ConfirmDeleteButton } from './ConfirmDeleteButton'
import { ItemDialog } from './ItemDialog'
import { NumberField } from './NumberField'
import { Section } from './Section'

export function SkillList<T>({
  label,
  skills,
  limit,
  getName,
  createSkill,
  getLevel,
  updateSkill,
  colorPalette = 'gray',
  onChange,
}: {
  label: string
  skills: T[]
  limit?: number
  getName: (skill: T) => string
  createSkill: (name: string, level: number) => T
  getLevel?: (skill: T) => number
  updateSkill?: (skill: T, name: string, level: number) => T
  colorPalette?: string
  onChange: (skills: T[]) => void
}) {
  const [newName, setNewName] = useState('')
  const [newLevel, setNewLevel] = useState<number | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  function openCreateDialog() {
    setEditingIndex(null)
    setNewName('')
    setNewLevel(null)
    setDialogOpen(true)
  }

  function openEditDialog(index: number, skill: T) {
    if (!getLevel) {
      return
    }
    setEditingIndex(index)
    setNewName(getName(skill))
    setNewLevel(getLevel(skill))
    setDialogOpen(true)
  }

  function submitSkill() {
    const name = newName.trim()
    if (!name || (getLevel && newLevel === null)) {
      return false
    }

    if (editingIndex !== null) {
      const skill = skills.at(editingIndex)
      if (!skill || !updateSkill || newLevel === null) {
        return false
      }
      onChange(
        updateAt(skills, editingIndex, updateSkill(skill, name, newLevel)),
      )
    } else {
      onChange([...skills, createSkill(name, newLevel ?? 1)])
    }

    setNewName('')
    setNewLevel(null)
  }

  return (
    <Section title={label}>
      {skills.map((skill, index) => (
        <Group
          key={index}
          display="grid"
          gridTemplateColumns={
            getLevel && updateSkill ? '1fr auto auto auto' : '1fr auto'
          }
          w="full"
          alignItems="center"
        >
          <Text minW="0" overflowWrap="anywhere">
            {getName(skill)}
          </Text>
          {getLevel && (
            <Text aria-label={`Niveau de ${getName(skill)}`}>
              {getLevel(skill)}
            </Text>
          )}
          {getLevel && updateSkill && (
            <IconButton
              variant="outline"
              aria-label={`Modifier le talent ${getName(skill)}`}
              onClick={() => openEditDialog(index, skill)}
            >
              <LuPencil />
            </IconButton>
          )}
          <ConfirmDeleteButton
            description={`ce talent (${getName(skill)})`}
            colorPalette={colorPalette}
            onConfirm={() =>
              onChange(skills.filter((_, skillIndex) => skillIndex !== index))
            }
          />
        </Group>
      ))}
      {(limit === undefined || skills.length < limit) && (
        <Box gridColumn="1 / -1">
          <Button
            variant="outline"
            alignSelf="flex-start"
            onClick={openCreateDialog}
          >
            Ajouter un talent
          </Button>
        </Box>
      )}
      <ItemDialog
        title={
          editingIndex === null ? 'Ajouter un talent' : 'Modifier un talent'
        }
        submitLabel={editingIndex === null ? 'Ajouter' : 'Enregistrer'}
        open={dialogOpen}
        canSubmit={
          newName.trim().length > 0 && (!getLevel || newLevel !== null)
        }
        colorPalette={colorPalette}
        onOpenChange={setDialogOpen}
        onSubmit={submitSkill}
      >
        <Field.Root>
          <Field.Label>Nom</Field.Label>
          <Input
            aria-label="Nom"
            placeholder="Nom du talent"
            value={newName}
            onChange={event => setNewName(event.target.value)}
          />
        </Field.Root>
        {getLevel && (
          <NumberField
            label="Niveau"
            value={newLevel}
            min={1}
            placeholder="1"
            onChange={setNewLevel}
          />
        )}
      </ItemDialog>
    </Section>
  )
}
