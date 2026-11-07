import { CheckboxCard } from '@chakra-ui/react'

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
    <CheckboxCard.Root
      variant="subtle"
      checked={checked}
      onCheckedChange={details => onChange(details.checked === true)}
    >
      <CheckboxCard.HiddenInput aria-label={label} />
      <CheckboxCard.Control>
        <CheckboxCard.Label>{label}</CheckboxCard.Label>
        <CheckboxCard.Indicator />
      </CheckboxCard.Control>
    </CheckboxCard.Root>
  )
}
