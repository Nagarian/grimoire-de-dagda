import { Button, Dialog, IconButton, Portal } from '@chakra-ui/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuTrash2, LuX } from 'react-icons/lu'

export function ConfirmDeleteButton({
  description,
  colorPalette = 'gray',
  onConfirm,
}: {
  description: string
  colorPalette?: string
  onConfirm: () => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <>
      <IconButton
        variant="outline"
        aria-label={t('form.remove')}
        onClick={() => setOpen(true)}
      >
        <LuTrash2 />
      </IconButton>
      <Dialog.Root open={open} onOpenChange={details => setOpen(details.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner alignItems="center" justifyContent="center">
            <Dialog.Content colorPalette={colorPalette}>
              <Dialog.Header>
                <Dialog.Title>{t('form.deleteTitle')}</Dialog.Title>
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
              <Dialog.Body>{t('form.deleteBody', { description })}</Dialog.Body>
              <Dialog.Footer>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  {t('form.cancel')}
                </Button>
                <Button
                  colorPalette="red"
                  onClick={() => {
                    onConfirm()
                    setOpen(false)
                  }}
                >
                  {t('form.confirmDelete')}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}
