import { Box, Button, Dialog, IconButton, Portal } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LuX } from 'react-icons/lu'

export function ItemDialog({
  title,
  submitLabel,
  children,
  open,
  canSubmit,
  colorPalette = 'gray',
  onOpenChange,
  onSubmit,
}: {
  title: string
  submitLabel: string
  children: ReactNode
  open: boolean
  canSubmit: boolean
  colorPalette?: string
  onOpenChange: (open: boolean) => void
  onSubmit: () => boolean | void
}) {
  const { t } = useTranslation()

  return (
    <Dialog.Root
      open={open}
      onOpenChange={details => onOpenChange(details.open)}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner alignItems="center" justifyContent="center">
          <Dialog.Content colorPalette={colorPalette}>
            <Dialog.Header>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <IconButton
                  aria-label={t('form.close')}
                  variant="ghost"
                  size="sm"
                >
                  <LuX />
                </IconButton>
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <Box
                as="form"
                display="flex"
                flexDirection="column"
                gap="3"
                onSubmit={event => {
                  event.preventDefault()
                  if (onSubmit() !== false) {
                    onOpenChange(false)
                  }
                }}
              >
                {children}
                <Dialog.Footer paddingX="0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    {t('form.cancel')}
                  </Button>
                  <Button type="submit" disabled={!canSubmit}>
                    {submitLabel}
                  </Button>
                </Dialog.Footer>
              </Box>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
