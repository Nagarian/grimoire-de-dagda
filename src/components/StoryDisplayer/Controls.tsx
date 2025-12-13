import { Box, type BoxProps, IconButton } from '@chakra-ui/react'
import { LuMap, LuZoomIn, LuZoomOut } from 'react-icons/lu'
import { MdLegendToggle, MdZoomInMap } from 'react-icons/md'
import { useControls } from 'react-zoom-pan-pinch'

type ControlsProps = {
  showMinimap: boolean
  showLegend?: boolean
  onMinimapToggle: () => void
  onLegendToggle?: () => void
} & Pick<BoxProps, 'position' | 'top' | 'right' | 'zIndex'>

export function Controls({
  showMinimap,
  showLegend,
  onMinimapToggle,
  onLegendToggle,
  ...props
}: ControlsProps) {
  const { resetTransform, zoomIn, zoomOut } = useControls()

  return (
    <Box
      {...props}
      display="flex"
      flexDirection="column"
      gap="2"
      padding="2"
      borderRadius="md"
    >
      <IconButton
        size="sm"
        aria-label="Zoom-in"
        onClick={() => {
          zoomIn(0.3)
        }}
      >
        <LuZoomIn />
      </IconButton>
      <IconButton
        size="sm"
        aria-label="Zoom-out"
        onClick={() => {
          zoomOut(0.3)
        }}
      >
        <LuZoomOut />
      </IconButton>
      <IconButton
        size="sm"
        aria-label="Reset"
        onClick={() => {
          resetTransform()
        }}
      >
        <MdZoomInMap />
      </IconButton>
      <IconButton
        size="sm"
        aria-label={showMinimap ? 'Show minimap' : 'Hide minimap'}
        onClick={onMinimapToggle}
      >
        <LuMap />
      </IconButton>
      <IconButton
        size="sm"
        aria-label={showLegend ? 'Show legend' : 'Hide legend'}
        onClick={onLegendToggle}
      >
        <MdLegendToggle />
      </IconButton>
    </Box>
  )
}
