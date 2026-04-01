'use client'

/**
 * PageBackground — wrapper de fundo padrão para páginas do dashboard
 *
 * Combina BackgroundGrid (dots + mask radial) e FloatingOrbs (blobs animados).
 * Substitui o padrão repetido em todas as 13 páginas:
 *
 *   Antes:
 *     <BackgroundGrid>
 *       <FloatingOrbs />
 *       {children}
 *     </BackgroundGrid>
 *
 *   Depois:
 *     <PageBackground>
 *       {children}
 *     </PageBackground>
 *
 * Props:
 *   grid – grade de dots com mask radial (default: true)
 *   orbs – blobs de gradiente animados (default: true)
 *
 * Exemplos:
 *
 * Padrão (grid + orbs):
 *   <PageBackground>
 *     <div className="flex flex-col gap-5">...</div>
 *   </PageBackground>
 *
 * Loading state (mesmo wrapper):
 *   if (loading) return <PageBackground><Skeleton /></PageBackground>
 *
 * Sem orbs (páginas estáticas, menos animação):
 *   <PageBackground orbs={false}>...</PageBackground>
 *
 * Só overlay sem grid (login, landing):
 *   <PageBackground grid={false}>...</PageBackground>
 */

import { BackgroundGrid, FloatingOrbs } from '@/components/ui/effects'

interface PageBackgroundProps {
  children: React.ReactNode
  /** Grade de dots com mask radial. Default: true */
  grid?: boolean
  /** Blobs de gradiente animados. Default: true */
  orbs?: boolean
  className?: string
}

export function PageBackground({
  children,
  grid = true,
  orbs = true,
  className,
}: PageBackgroundProps) {
  if (!grid) {
    return (
      <div
        className={className}
        style={{ position: 'relative', minHeight: '100%' }}
      >
        {orbs && <FloatingOrbs />}
        {children}
      </div>
    )
  }

  return (
    <BackgroundGrid>
      <div className={className}>
        {orbs && <FloatingOrbs />}
        {children}
      </div>
    </BackgroundGrid>
  )
}
