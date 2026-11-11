import { Field, SegmentGroup } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { parseInteger } from '../utils'

export function ReputationField({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  const { t } = useTranslation()
  const items = Array.from({ length: 11 }, (_, index) => {
    const reputation = index - 5
    return { value: reputation.toString(), label: reputation.toString() }
  })

  return (
    <Field.Root>
      <Field.Label>{t('sheet.fields.reputation')}</Field.Label>
      <SegmentGroup.Root
        aria-label={t('sheet.fields.reputation')}
        width="100%"
        css={{
          '--segment-indicator-bg': 'colors.colorPalette.500',
          '--segment-indicator-shadow': 'shadows.md',
          '& [data-part="item"]': {
            flex: 1,
            justifyContent: 'center',
          },
        }}
        value={value.toString()}
        onValueChange={details => {
          const reputation = parseInteger(details.value ?? '')
          if (reputation !== null) {
            onChange(reputation)
          }
        }}
      >
        <SegmentGroup.Indicator />
        <SegmentGroup.Items items={items} />
      </SegmentGroup.Root>
    </Field.Root>
  )
}
