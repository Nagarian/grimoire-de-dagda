import { Box, Field, Input, Text } from '@chakra-ui/react'
import { useState } from 'react'
import type {
  BookCharacterSheet,
  E01CharacterSheet,
} from 'services/characterSheet'
import { e01CapsuleLimit } from 'services/characterSheet'
import { getBookData, toChapterId } from 'services/bookData'
import { getBookColorPalette } from 'components/ui/theme'
import { ConfirmDeleteButton } from '../Inputs/ConfirmDeleteButton'
import { Section } from '../Inputs/Section'

export function E01SheetForm({
  sheet,
  onUpdate,
  onRemoveCapsule,
}: {
  sheet: E01CharacterSheet
  onUpdate: (sheet: BookCharacterSheet) => boolean
  onRemoveCapsule: (capsuleIndex: number) => boolean
}) {
  const colorPalette = getBookColorPalette(sheet.bookId)
  const currentLocalisation = sheet.localisation?.replace('E01-', '') ?? ''
  const [localisationError, setLocalisationError] = useState<string>()

  return (
    <Box display="flex" flexDirection="column" gap="5">
      <Section title="Localisation">
        <Field.Root invalid={Boolean(localisationError)}>
          <Field.Label>Prochain chapitre du Royaume des Ombres</Field.Label>
          <Input
            type="number"
            min="1"
            step="1"
            value={currentLocalisation}
            onChange={event => {
              const value = event.target.value
              if (value === '') {
                setLocalisationError(undefined)
                onUpdate({ ...sheet, localisation: null })
                return
              }
              const chapter = Number(value)
              if (!Number.isInteger(chapter)) {
                setLocalisationError('Saisissez un numéro de chapitre valide.')
                return
              }
              const chapterId = toChapterId('E01', String(chapter))
              if (getBookData('E01').chaptersById.has(chapterId)) {
                setLocalisationError(undefined)
                onUpdate({ ...sheet, localisation: chapterId })
              } else {
                setLocalisationError(
                  'Ce chapitre n’existe pas dans le Royaume des Ombres.',
                )
              }
            }}
          />
          {localisationError && (
            <Field.ErrorText>{localisationError}</Field.ErrorText>
          )}
        </Field.Root>
      </Section>
      <Section title={`Capsules (${sheet.capsules.length}/${e01CapsuleLimit})`}>
        {sheet.capsules.map((capsule, index) => (
          <Box
            key={`${capsule.originBook}-${capsule.deathChapter}-${index}`}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            gap="3"
            borderWidth="1px"
            borderRadius="md"
            padding="3"
          >
            <Text>
              Mort {index + 1} — {capsule.originBook}, chapitre{' '}
              {capsule.deathChapter}, résurrection {capsule.returnChapter}
            </Text>
            <ConfirmDeleteButton
              description={`la mort ${index + 1}`}
              colorPalette={colorPalette}
              onConfirm={() => onRemoveCapsule(index)}
            />
          </Box>
        ))}
        {sheet.capsules.length === 0 && (
          <Text color="fg.muted">Aucune mort enregistrée.</Text>
        )}
        {sheet.capsules.length >= e01CapsuleLimit && (
          <Text color="fg.error">
            Supprimez une capsule pour pouvoir entrer à nouveau dans le Royaume
            des Ombres.
          </Text>
        )}
      </Section>
    </Box>
  )
}
