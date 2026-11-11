import {
  Box,
  createListCollection,
  Field,
  Portal,
  Select,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { TrackManagementPanel } from 'components/Settings/TrackManagementPanel'
import { SettingsSection } from 'components/Settings/SettingsSection'
import { useStoryProgress } from 'components/StoryProgresser/useStoryProgress'
import { ColorModeButton } from 'components/ui/color-mode'
import { PageHeader } from 'components/ui/PageHeader'
import { i18n } from 'services/i18n'
import type { BookId } from 'services/books'

const languageCollection = createListCollection({
  items: [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
  ],
})

export function Settings({
  onCurrentBookChange,
}: {
  onCurrentBookChange?: (bookId: BookId | undefined) => void
}) {
  const { t } = useTranslation()
  const story = useStoryProgress()
  const activeTrack = story.activeTrack

  useEffect(() => {
    onCurrentBookChange?.(story.currentBook?.id)
  }, [onCurrentBookChange, story.currentBook?.id])

  return (
    <Box height="100%" minHeight="0" display="flex" flexDirection="column">
      <PageHeader
        subtitle={activeTrack?.name ?? t('settings.pageTitle')}
        title={t('settings.pageTitle')}
      />
      <Box
        flex="1"
        minHeight="0"
        overflowY="auto"
        padding={{ base: '4', md: '8' }}
      >
        <Box
          width="100%"
          maxWidth="breakpoint-md"
          marginX="auto"
          display="flex"
          flexDirection="column"
          gap="6"
        >
          {story.progress && (
            <TrackManagementPanel
              tracks={story.progress.tracks}
              activeTrack={activeTrack}
              bookId={story.currentBook?.id}
              error={story.error}
              onChangeTrack={story.changeTrack}
              onCreateTrack={story.createTrack}
              onRenameTrack={story.renameTrack}
              onDeleteTrack={story.deleteTrack}
            />
          )}
          <SettingsSection title={t('settings.languageSection')}>
            <Field.Root
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              gap="4"
            >
              <Field.Label marginBottom="0">
                {t('settings.languageLabel')}
              </Field.Label>
              <Select.Root
                collection={languageCollection}
                value={[i18n.resolvedLanguage ?? 'fr']}
                onValueChange={details => {
                  const language = details.value.at(0)
                  if (language === 'fr' || language === 'en') {
                    void i18n.changeLanguage(language)
                  }
                }}
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {languageCollection.items.map(item => (
                        <Select.Item key={item.value} item={item}>
                          {t(
                            item.value === 'fr'
                              ? 'settings.languages.fr'
                              : 'settings.languages.en',
                          )}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Field.Root>
          </SettingsSection>
          <SettingsSection title={t('settings.appearanceSection')}>
            <Field.Root
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              gap="4"
            >
              <Field.Label marginBottom="0">
                {t('settings.themeColorLabel')}
              </Field.Label>
              <ColorModeButton />
            </Field.Root>
          </SettingsSection>
        </Box>
      </Box>
    </Box>
  )
}
