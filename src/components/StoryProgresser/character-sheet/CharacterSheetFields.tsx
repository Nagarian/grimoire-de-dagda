import {
  Box,
  Checkbox,
  Field,
  Heading,
  Input,
  NativeSelect,
  Text,
  Textarea,
} from '@chakra-ui/react'
import type { ReactNode } from 'react'
import type { BookId } from 'services/books'
import type { GameMode } from 'services/characterSheet'
import { gameModes } from 'services/characterSheet'
import { parseInteger } from './utils'

export function GameModeField({
  bookId,
  value,
  onChange,
}: {
  bookId: BookId
  value: GameMode | null
  onChange: (gameMode: GameMode) => boolean
}) {
  const storytellingLabel = bookId === 'T05' ? 'Histoire' : 'Narratif'

  return (
    <Field.Root required>
      <Field.Label>Mode de jeu</Field.Label>
      <NativeSelect.Root>
        <NativeSelect.Field
          aria-label="Mode de jeu"
          value={value ?? ''}
          onChange={event => {
            const mode = gameModes.find(
              candidate => candidate === event.target.value,
            )
            if (mode) {
              onChange(mode)
            }
          }}
        >
          <option value="" disabled>
            Choisir un mode
          </option>
          <option value="storytelling">{storytellingLabel}</option>
          <option value="simplified">Simplifié</option>
          <option value="deadly">Mortel</option>
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </Field.Root>
  )
}

export function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number | null
  min?: number
  max?: number
  onChange: (value: number | null) => void
}) {
  return (
    <Field.Root>
      <Field.Label>{label}</Field.Label>
      <Input
        key={value === null ? 'empty' : value}
        aria-label={label}
        type="number"
        step="1"
        min={min}
        max={max}
        defaultValue={value ?? ''}
        onChange={event => {
          const nextDraft = event.target.value
          if (nextDraft === '') {
            onChange(null)
            return
          }
          const parsed = parseInteger(nextDraft)
          if (parsed !== null) {
            onChange(parsed)
          }
        }}
        onBlur={event => {
          const nextDraft = event.currentTarget.value
          const parsed = parseInteger(nextDraft)
          if (
            (nextDraft !== '' && parsed === null) ||
            (parsed !== null &&
              ((min !== undefined && parsed < min) ||
                (max !== undefined && parsed > max)))
          ) {
            event.currentTarget.value = value?.toString() ?? ''
          }
        }}
      />
    </Field.Root>
  )
}

export function TextField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Field.Root>
      <Field.Label>{label}</Field.Label>
      <Input
        aria-label={label}
        value={value}
        onChange={event => onChange(event.target.value)}
      />
    </Field.Root>
  )
}

export function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Field.Root>
      <Field.Label>{label}</Field.Label>
      <Textarea
        aria-label={label}
        value={value}
        onChange={event => onChange(event.target.value)}
      />
    </Field.Root>
  )
}

export function BooleanField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <Checkbox.Root
      checked={checked}
      onCheckedChange={details => onChange(details.checked === true)}
    >
      <Checkbox.HiddenInput />
      <Checkbox.Control />
      <Checkbox.Label>{label}</Checkbox.Label>
    </Checkbox.Root>
  )
}

export function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <Box as="section" display="flex" flexDirection="column" gap="3">
      <Heading as="h3" size="md">
        {title}
      </Heading>
      {children}
    </Box>
  )
}

export function EmptySheetMessage() {
  return (
    <Text color="fg.muted">Aucune feuille n’est disponible pour ce livre.</Text>
  )
}
