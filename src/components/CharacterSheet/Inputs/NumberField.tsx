import { Field, IconButton, NumberInput } from '@chakra-ui/react'
import { LuMinus, LuPlus } from 'react-icons/lu'
import { parseInteger } from '../utils'

export function NumberField({
  label,
  value,
  min,
  max,
  width = '100%',
  onChange,
}: {
  label?: string
  value: number | null
  min?: number
  max?: number
  width?: '100%' | 'fit-content'
  onChange: (value: number | null) => void
}) {
  return (
    <Field.Root width={width} maxW="100%" minW="0">
      {label && <Field.Label>{label}</Field.Label>}
      <NumberInput.Root
        spinOnPress
        display="grid"
        gridTemplateColumns={
          width === '100%' ? 'auto minmax(4ch, 1fr) auto' : 'auto 4ch auto'
        }
        width={width}
        minW="0"
        min={min}
        max={max}
        value={value?.toString() ?? ''}
        onValueChange={details => {
          const nextDraft = details.value
          if (nextDraft === '') {
            onChange(null)
          } else {
            const parsed = parseInteger(nextDraft)
            if (parsed !== null) {
              onChange(parsed)
            }
          }
        }}
      >
        <NumberInput.DecrementTrigger asChild>
          <IconButton aria-label={`Diminuer ${label}`} variant="outline">
            <LuMinus />
          </IconButton>
        </NumberInput.DecrementTrigger>
        <NumberInput.Input
          aria-label={label}
          textAlign="center"
          fontSize="lg"
          width={width === '100%' ? '100%' : '4ch'}
          minW="0"
        />
        <NumberInput.IncrementTrigger asChild>
          <IconButton aria-label={`Augmenter ${label}`} variant="outline">
            <LuPlus />
          </IconButton>
        </NumberInput.IncrementTrigger>
      </NumberInput.Root>
    </Field.Root>
  )
}
