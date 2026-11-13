import {
  Box,
  type BoxProps,
  Field,
  IconButton,
  NumberInput,
  Popover,
  Portal,
  Tooltip,
} from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LuEye,
  LuEyeOff,
  LuHand,
  LuMaximize,
  LuMousePointer2,
  LuPaintbrush,
  LuSearch,
  LuZoomIn,
  LuZoomOut,
} from 'react-icons/lu'
import { RiInformation2Line, RiInformationOffLine } from 'react-icons/ri'
import { TbMap, TbMapOff } from 'react-icons/tb'

type ControlsProps = {
  disabled: boolean
  showMinimap: boolean
  onMinimapToggle: () => void
  showLegend: boolean
  onLegendToggle: () => void
  showHiddenElements: boolean
  onHiddenElementsToggle: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  selectMode: boolean
  onSelectModeToggle: () => void
  showVisitedChapterCounts: boolean
  onVisitedChapterCountsToggle?: () => void
  /** Moves the view onto a chapter. Returns false when the book has no such chapter. */
  onSearch: (chapter: string) => boolean
} & Pick<BoxProps, 'position' | 'top' | 'right' | 'zIndex'>

export function Controls({
  disabled,
  showMinimap,
  onMinimapToggle,
  showLegend,
  onLegendToggle,
  showHiddenElements,
  onHiddenElementsToggle,
  onZoomIn,
  onZoomOut,
  onReset,
  selectMode,
  onSelectModeToggle,
  showVisitedChapterCounts,
  onVisitedChapterCountsToggle,
  onSearch,
  ...props
}: ControlsProps) {
  const { t } = useTranslation()
  const [searchValue, setSearchValue] = useState<string>('')
  const [notFound, setNotFound] = useState<boolean>(false)

  const search = (chapter: string) => {
    setSearchValue(chapter)
    setNotFound(chapter !== '' && !onSearch(chapter))
  }

  return (
    <Box
      {...props}
      display="flex"
      flexDirection="column"
      gap="2"
      padding="2"
      borderRadius="md"
      role="toolbar"
      aria-orientation="vertical"
      aria-label={t('diagram.controls')}
    >
      <ControlTooltip label={t('diagram.zoomIn')}>
        <IconButton
          size="sm"
          aria-label={t('diagram.zoomIn')}
          disabled={disabled}
          onClick={onZoomIn}
        >
          <LuZoomIn />
        </IconButton>
      </ControlTooltip>
      <ControlTooltip label={t('diagram.zoomOut')}>
        <IconButton
          size="sm"
          aria-label={t('diagram.zoomOut')}
          disabled={disabled}
          onClick={onZoomOut}
        >
          <LuZoomOut />
        </IconButton>
      </ControlTooltip>
      <ControlTooltip label={t('diagram.fit')}>
        <IconButton
          size="sm"
          aria-label={t('diagram.fit')}
          disabled={disabled}
          onClick={onReset}
        >
          <LuMaximize />
        </IconButton>
      </ControlTooltip>
      <ControlTooltip
        label={
          showMinimap ? t('diagram.hideMinimap') : t('diagram.showMinimap')
        }
      >
        <IconButton
          size="sm"
          aria-label={
            showMinimap ? t('diagram.hideMinimap') : t('diagram.showMinimap')
          }
          aria-pressed={showMinimap}
          disabled={disabled}
          onClick={onMinimapToggle}
        >
          {showMinimap ? <TbMapOff /> : <TbMap />}
        </IconButton>
      </ControlTooltip>
      <ControlTooltip
        label={showLegend ? t('diagram.hideLegend') : t('diagram.showLegend')}
      >
        <IconButton
          size="sm"
          aria-label={
            showLegend ? t('diagram.hideLegend') : t('diagram.showLegend')
          }
          aria-pressed={showLegend}
          disabled={disabled}
          onClick={onLegendToggle}
        >
          {showLegend ? <RiInformationOffLine /> : <RiInformation2Line />}
        </IconButton>
      </ControlTooltip>
      <ControlTooltip
        label={
          showHiddenElements
            ? t('diagram.hideHidden')
            : t('diagram.revealHidden')
        }
      >
        <IconButton
          size="sm"
          aria-label={
            showHiddenElements
              ? t('diagram.hideHidden')
              : t('diagram.revealHidden')
          }
          aria-pressed={showHiddenElements}
          disabled={disabled}
          onClick={onHiddenElementsToggle}
        >
          {showHiddenElements ? <LuEyeOff /> : <LuEye />}
        </IconButton>
      </ControlTooltip>
      <ControlTooltip
        label={selectMode ? t('diagram.selectMode') : t('diagram.panMode')}
      >
        <IconButton
          size="sm"
          aria-label={
            selectMode ? t('diagram.selectMode') : t('diagram.panMode')
          }
          aria-pressed={selectMode}
          disabled={disabled}
          onClick={onSelectModeToggle}
        >
          {selectMode ? <LuMousePointer2 /> : <LuHand />}
        </IconButton>
      </ControlTooltip>
      <ControlTooltip
        label={
          showVisitedChapterCounts
            ? t('diagram.hideVisitedChapterColors')
            : t('diagram.showVisitedChapterColors')
        }
      >
        <IconButton
          size="sm"
          aria-label={
            showVisitedChapterCounts
              ? t('diagram.hideVisitedChapterColors')
              : t('diagram.showVisitedChapterColors')
          }
          aria-pressed={showVisitedChapterCounts}
          disabled={disabled || !onVisitedChapterCountsToggle}
          onClick={onVisitedChapterCountsToggle}
        >
          <LuPaintbrush />
        </IconButton>
      </ControlTooltip>
      <Popover.Root
        onOpenChange={d => {
          if (!d.open) {
            return
          }

          setSearchValue('')
          setNotFound(false)
        }}
      >
        <Popover.Trigger asChild>
          <IconButton
            size="sm"
            aria-label={t('diagram.goToChapter')}
            disabled={disabled}
          >
            <ControlTooltip label={t('diagram.goToChapter')}>
              <LuSearch />
            </ControlTooltip>
          </IconButton>
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner>
            <Popover.Content>
              <Popover.Arrow />
              <Popover.Body display="flex" flexDirection="column" gap="1">
                <Popover.Title fontWeight="medium">
                  {t('diagram.goToChapter')}
                </Popover.Title>
                <Field.Root invalid={notFound}>
                  <Field.Label>{t('diagram.chapterNumber')}</Field.Label>
                  <NumberInput.Root
                    min={1}
                    value={searchValue}
                    onValueChange={e => {
                      search(e.value)
                    }}
                  >
                    <NumberInput.Control />
                    <NumberInput.Input />
                  </NumberInput.Root>
                  {notFound && (
                    <Field.ErrorText>
                      {t('diagram.chapterNotFound')}
                    </Field.ErrorText>
                  )}
                </Field.Root>
              </Popover.Body>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
    </Box>
  )
}

function ControlTooltip({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <Tooltip.Root openDelay={200} closeDelay={100}>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content>
          <Tooltip.Arrow />
          {label}
        </Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip.Root>
  )
}
