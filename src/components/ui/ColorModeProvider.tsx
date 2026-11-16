import { ClientOnly, HStack, SegmentGroup, Skeleton } from '@chakra-ui/react'
import type { ThemeProviderProps } from 'next-themes'
import { ThemeProvider, useTheme } from 'next-themes'
import { useTranslation } from 'react-i18next'
import { LuMonitor, LuMoon, LuSun } from 'react-icons/lu'

export interface ColorModeProviderProps extends ThemeProviderProps {}

export function ColorModeProvider(props: ColorModeProviderProps) {
  return (
    <ThemeProvider attribute="class" disableTransitionOnChange {...props} />
  )
}

const values = [
  {
    value: 'light',
    icon: LuSun,
  },
  {
    value: 'dark',
    icon: LuMoon,
  },
  {
    value: 'system',
    icon: LuMonitor,
  },
] as const

export function ColorModeSelector() {
  const { t } = useTranslation()
  const { theme, setTheme, forcedTheme } = useTheme()
  const items = values.map(item => ({
    value: item.value,
    label: (
      <HStack gap="2">
        <item.icon aria-hidden="true" />
        {t(`theme.modes.${item.value}`)}
      </HStack>
    ),
  }))

  return (
    <ClientOnly fallback={<Skeleton height="10" width="100%" />}>
      <SegmentGroup.Root
        aria-label={t('settings.themeColorLabel')}
        width="100%"
        css={{
          '--segment-indicator-bg': 'colors.colorPalette.500',
          '--segment-indicator-shadow': 'shadows.md',
          '& [data-part="item"]': {
            flex: 1,
            justifyContent: 'center',
          },
        }}
        value={forcedTheme ?? theme ?? 'system'}
        onValueChange={details => {
          const mode = details.value
          if (mode === 'light' || mode === 'dark' || mode === 'system') {
            setTheme(mode)
          }
        }}
      >
        <SegmentGroup.Indicator />
        <SegmentGroup.Items items={items} />
      </SegmentGroup.Root>
    </ClientOnly>
  )
}
