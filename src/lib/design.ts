import type { CSSProperties } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// BossFlow Design System — tokens visuais centralizados
//
// Antes: const T = { ... } copiado em 13 arquivos
// Agora: importe daqui e mude num lugar só
// ─────────────────────────────────────────────────────────────────────────────

// ─── Paleta ──────────────────────────────────────────────────────────────────
export const T = {
  // Backgrounds
  bg:      'rgba(8,8,14,0.92)',
  bgDeep:  'rgba(6,6,10,0.97)',
  surface: 'rgba(255,255,255,0.025)',

  // Bordas
  border:  'rgba(255,255,255,0.055)',
  borderP: 'rgba(124,110,247,0.22)',  // borda accent/purple
  borderB: 'rgba(255,255,255,0.08)',   // borda mais forte

  // Texto
  text:  '#dcdcf0',  // primário
  sub:   '#8a8aaa',  // secundário
  muted: '#4a4a6a',  // terciário / placeholder
  dim:   '#3a3a5c',  // quase invisível

  // Semântico
  green:  '#34d399',  // receita / sucesso
  red:    '#f87171',  // despesa / erro
  amber:  '#fbbf24',  // atenção / pendente
  purple: '#7c6ef7',  // accent principal
  violet: '#a78bfa',  // accent claro
  cyan:   '#22d3ee',  // informação / vendas
  orange: '#f97316',  // metas / urgente

  // Misc
  blur: 'blur(20px)',
} as const

export type TokenColor = typeof T

// ─── Tipografia ───────────────────────────────────────────────────────────────
export const SYNE = 'Syne, sans-serif'
export const DM   = 'DM Sans, sans-serif'

// ─── Surface padrão de card ───────────────────────────────────────────────────
// Usado em SpotlightCard, containers de seção, modais
export const card: CSSProperties = {
  background:     T.bg,
  border:         `1px solid ${T.border}`,
  backdropFilter: T.blur,
  boxShadow:      '0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
}

// Surface mais profunda (modais, dropdowns)
export const cardDeep: CSSProperties = {
  background:     T.bgDeep,
  border:         `1px solid ${T.border}`,
  backdropFilter: T.blur,
  boxShadow:      '0 8px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
}

// ─── Input base ───────────────────────────────────────────────────────────────
// Variantes por tamanho — use spread + override de padding quando necessário
export const inp: CSSProperties = {
  background:   'rgba(255,255,255,0.03)',
  border:       `1px solid ${T.border}`,
  color:        T.text,
  borderRadius: 12,
  padding:      '10px 14px',
  fontSize:     13,
  outline:      'none',
  width:        '100%',
  transition:   'border-color 0.15s',
  fontFamily:   SYNE,
}

// Variante maior (modais principais, forms primários)
export const inpLg: CSSProperties = { ...inp, padding: '13px 16px' }

// Variante menor (filtros, inline fields)
export const inpSm: CSSProperties = { ...inp, padding: '7px 11px', fontSize: 12 }

// ─── Border radius padronizado ────────────────────────────────────────────────
// Use SEMPRE um desses três — nunca valor ad-hoc
export const radius = {
  sm:  8,   // badges, tags, botões pequenos
  md:  12,  // inputs, cards compactos
  lg:  18,  // cards principais, modais
} as const

// ─── Shadow padronizado ───────────────────────────────────────────────────────
export const shadow = {
  card:   '0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
  deep:   '0 8px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
  glow:   '0 0 28px rgba(124,110,247,0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
  soft:   '0 10px 30px rgba(0,0,0,0.35)',
} as const

// ─── Botão primário (gradient purple) ────────────────────────────────────────
export const btnPrimary: CSSProperties = {
  background: 'linear-gradient(135deg, #7c6ef7 0%, #a06ef7 100%)',
  color:      'white',
  boxShadow:  shadow.glow,
  border:     '1px solid rgba(255,255,255,0.1)',
  cursor:     'pointer',
}

// ─── Botão ghost ──────────────────────────────────────────────────────────────
export const btnGhost: CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  color:      T.sub,
  border:     `1px solid ${T.border}`,
  cursor:     'pointer',
}
