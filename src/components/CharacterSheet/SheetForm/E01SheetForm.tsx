import { Box, Field, Input, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  BookCharacterSheet,
  E01CharacterSheet,
} from 'services/characterSheet'
import { e01CapsuleLimit } from 'services/characterSheet'
import { getBookData, toChapterId } from 'services/bookData'
import { getBookColorPalette } from 'components/ui/theme'
import { getLocalizedBookTitle } from 'services/i18n'
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
  const { t } = useTranslation()
  const colorPalette = getBookColorPalette(sheet.bookId)
  const currentLocalisation = sheet.localisation?.replace('E01-', '') ?? ''
  const [localisationError, setLocalisationError] = useState<string>()

  return (
    <Box display="flex" flexDirection="column" gap="5">
      <Section title={t('sheet.sections.location')}>
        <Field.Root invalid={Boolean(localisationError)}>
          <Field.Label>
            {t('sheet.fields.nextChapterInShadowRealm')}
          </Field.Label>
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
                setLocalisationError(t('localisation.invalidChapter'))
                return
              }
              const chapterId = toChapterId('E01', String(chapter))
              if (getBookData('E01').chaptersById.has(chapterId)) {
                setLocalisationError(undefined)
                onUpdate({ ...sheet, localisation: chapterId })
              } else {
                setLocalisationError(t('localisation.unknownChapter'))
              }
            }}
          />
          {localisationError && (
            <Field.ErrorText>{localisationError}</Field.ErrorText>
          )}
        </Field.Root>
      </Section>
      <Section
        title={t('sheet.sections.capsules', {
          current: sheet.capsules.length,
          limit: e01CapsuleLimit,
        })}
      >
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
              {t('localisation.death', {
                number: index + 1,
                book: getLocalizedBookTitle(capsule.originBook),
                chapter: capsule.deathChapter,
                returnChapter: capsule.returnChapter,
              })}
            </Text>
            <ConfirmDeleteButton
              description={t('form.removeCapsule', { number: index + 1 })}
              colorPalette={colorPalette}
              onConfirm={() => onRemoveCapsule(index)}
            />
          </Box>
        ))}
        {sheet.capsules.length === 0 && (
          <Text color="fg.muted">{t('localisation.noDeaths')}</Text>
        )}
        {sheet.capsules.length >= e01CapsuleLimit && (
          <Text color="fg.error">{t('localisation.removeCapsuleLimit')}</Text>
        )}
      </Section>
    </Box>
  )
}
