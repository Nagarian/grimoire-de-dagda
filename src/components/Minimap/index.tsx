import { Box } from '@chakra-ui/react'
import { type MouseEvent, useEffect, useRef } from 'react'

export interface MinimapViewport {
  x: number
  y: number
  width: number
  height: number
}

export interface MinimapProps {
  viewport: MinimapViewport
  svgElement: SVGSVGElement | null
  containerElement: HTMLDivElement | null
  onNavigate: (x: number, y: number, scale: number) => void
}

export function Minimap({
  viewport,
  svgElement,
  containerElement,
  onNavigate,
}: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !svgElement || !containerElement) {
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    const svgRect = svgElement.getBoundingClientRect()

    // Scale factor from SVG to mini-map
    const scaleX = canvas.width / svgRect.width
    const scaleY = canvas.height / svgRect.height

    // Clear canvas with transparency
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw viewport rectangle
    ctx.strokeStyle = '#ff6b6b'
    ctx.lineWidth = 2
    ctx.fillStyle = 'rgba(255, 107, 107, 0.1)'
    const viewportX = viewport.x * scaleX
    const viewportY = viewport.y * scaleY
    const viewportWidth = viewport.width * scaleX
    const viewportHeight = viewport.height * scaleY
    ctx.fillRect(viewportX, viewportY, viewportWidth, viewportHeight)
    ctx.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight)
  }, [viewport, svgElement, containerElement])

  const handleClick = (e: MouseEvent) => {
    if (!canvasRef.current || !svgElement || !containerElement) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const svgRect = svgElement.getBoundingClientRect()
    const scaleX = svgRect.width / canvas.width
    const scaleY = svgRect.height / canvas.height

    const targetX = x * scaleX - containerElement.clientWidth / 2
    const targetY = y * scaleY - containerElement.clientHeight / 2
    const scale = viewport.width / containerElement.clientWidth

    onNavigate(-targetX, -targetY, scale)
  }

  return (
    <Box
      as="canvas"
      ref={canvasRef}
      width={200}
      height={150}
      onClick={handleClick}
      borderRadius="sm"
      borderWidth="medium"
      borderColor="border.emphasized"
      shadow="md"
      cursor="crosshair"
      bg="bg.panel"
    />
  )
}
