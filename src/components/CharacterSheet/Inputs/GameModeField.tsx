import { Field, HStack, Icon, RadioCard } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import { LuBookOpen, LuBookCheck, LuSkull } from 'react-icons/lu'
import type { BookId } from 'services/books'
import { type GameMode, gameModes } from 'services/characterSheet'

export function GameModeField({
  bookId,
  value,
  onChange,
}: {
  bookId: BookId
  value: GameMode | null
  onChange: (gameMode: GameMode) => boolean
}) {
  const { t } = useTranslation()
  const items = [
    {
      value: 'storytelling',
      title: t(
        bookId === 'T05' ? 'sheet.modes.story' : 'sheet.modes.storytelling',
      ),
      icon: <LuBookOpen />,
    },
    {
      value: 'simplified',
      title: t('sheet.modes.simplified'),
      icon: <LuBookCheck />,
    },
    { value: 'deadly', title: t('sheet.modes.deadly'), icon: <LuSkull /> },
  ] as const satisfies {
    value: GameMode
    title: string
    icon: ReactNode
  }[]

  return (
    <Field.Root required>
      <RadioCard.Root
        aria-label={t('sheet.gameMode')}
        variant="subtle"
        orientation="horizontal"
        align="center"
        justify="center"
        width="100%"
        value={value ?? ''}
        onValueChange={details => {
          const mode = gameModes.find(candidate => candidate === details.value)
          if (mode) {
            onChange(mode)
          }
        }}
      >
        <RadioCard.Label>{t('sheet.gameMode')}</RadioCard.Label>
        <HStack align="stretch" width="100%" gap="2">
          {items.map(item => (
            <RadioCard.Item key={item.value} value={item.value} flex="1">
              <RadioCard.ItemHiddenInput />
              <RadioCard.ItemControl>
                <Icon fontSize="2xl" color="fg.subtle">
                  {item.icon}
                </Icon>
                <RadioCard.ItemText>{item.title}</RadioCard.ItemText>
              </RadioCard.ItemControl>
            </RadioCard.Item>
          ))}
        </HStack>
      </RadioCard.Root>
    </Field.Root>
  )
}
