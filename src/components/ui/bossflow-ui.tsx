// ─────────────────────────────────────────────────────────────────────────────
// bossflow-ui.tsx — Barrel de re-exports (retrocompatibilidade)
//
// TODOS os imports existentes nas páginas continuam funcionando sem mudança.
// Os componentes agora vivem em arquivos menores:
//
//   components/ui/effects.tsx    → BackgroundGrid, FloatingOrbs, SpotlightCard,
//                                  CardSpotlight, GlowCorner, GlowingEffect,
//                                  BackgroundBeamsSection, RippleBackground
//   components/ui/primitives.tsx → Skeleton, StatBar, LiveDot, ShimmerButton,
//                                  NoiseButton, BossLoader, FloatingDock, SyneText
//   components/ui/decorative.tsx → Sparkles, EncryptedText, ColourfulText,
//                                  BentoGrid, BentoItem
//
// AcernityFonts → REMOVIDO (fonts já carregadas em app/globals.css)
// T helper     → RENOMEADO para SyneText (evita conflito com T de lib/design.ts)
//                Mantido como alias abaixo para retrocompat
// ─────────────────────────────────────────────────────────────────────────────

export {
  BackgroundGrid,
  FloatingOrbs,
  SpotlightCard,
  CardSpotlight,
  GlowCorner,
  GlowingEffect,
  BackgroundBeamsSection,
  RippleBackground,
} from './effects'

export {
  Skeleton,
  StatBar,
  LiveDot,
  ShimmerButton,
  NoiseButton,
  BossLoader,
  FloatingDock,
  SyneText,
} from './primitives'

export {
  Sparkles,
  EncryptedText,
  ColourfulText,
  BentoGrid,
  BentoItem,
} from './decorative'

// Alias retrocompat: T → SyneText
// Não colide com o objeto T de lib/design.ts porque este é um componente React (PascalCase)
export { SyneText as T } from './primitives'
