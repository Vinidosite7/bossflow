// ============================================================
//  BossFlow — lib/plans.ts
//  FONTE DA VERDADE de planos. Não duplique limites em outros arquivos.
// ============================================================

export type PlanKey = 'free' | 'starter' | 'pro' | 'scale'

export const PLAN_ORDER: PlanKey[] = ['free', 'starter', 'pro', 'scale']

export const PLAN_LABELS: Record<PlanKey, string> = {
  free:    'Básico',
  starter: 'Starter',
  pro:     'Pro',
  scale:   'Scale',
}

export const PLAN_PRICES: Record<PlanKey, number> = {
  free:    0,
  starter: 39.90,
  pro:     69.90,
  scale:   149,
}

export const PLAN_CHECKOUT_URLS: Partial<Record<PlanKey, string>> = {
  starter: 'https://pay.cakto.com.br/ewnmtb7_790932',
  pro:     'https://pay.cakto.com.br/roe67up_790935',
}

// ── Limites numéricos ──────────────────────────────────────────
export const PLAN_LIMITS: Record<PlanKey, {
  businesses: number
  accounts: number        // contas/caixas por empresa
  members: number         // membros por empresa (compartilhamento)
  monthlyRevenue: number  // faturamento máx mensal em R$ (0 = sem limite)
}> = {
  free:    { businesses: 1,        accounts: 2,        members: 0,        monthlyRevenue: 20_000 },
  starter: { businesses: 3,        accounts: 5,        members: 10,       monthlyRevenue: Infinity },
  pro:     { businesses: Infinity, accounts: Infinity, members: Infinity, monthlyRevenue: Infinity },
  scale:   { businesses: Infinity, accounts: Infinity, members: Infinity, monthlyRevenue: Infinity },
}

// ── Feature flags ──────────────────────────────────────────────
export const PLAN_FEATURES: Record<PlanKey, {
  // Disponível em Básico
  dashboard:          boolean
  categories:         boolean
  cashFlow:           boolean
  // Starter+
  financialModule:    boolean
  extendedHistory:    boolean
  exportBasic:        boolean
  aiAssistant:        boolean
  shareCompany:       boolean
  scheduling:         boolean
  // Pro+
  reports:            boolean
  goals:              boolean
  exportFull:         boolean
  fullHistory:        boolean
  prioritySupport:    boolean
  onboarding:         boolean
  smartNotifications: boolean
  // Scale
  audit:              boolean
  vipSupport:         boolean
  customIntegrations: boolean
  sla:                boolean
}> = {
  free: {
    dashboard: true, categories: true, cashFlow: true,
    financialModule: false, extendedHistory: false, exportBasic: false,
    aiAssistant: false, shareCompany: false, scheduling: false,
    reports: false, goals: false, exportFull: false, fullHistory: false,
    prioritySupport: false, onboarding: false, smartNotifications: false,
    audit: false, vipSupport: false, customIntegrations: false, sla: false,
  },
  starter: {
    dashboard: true, categories: true, cashFlow: true,
    financialModule: true, extendedHistory: true, exportBasic: true,
    aiAssistant: true, shareCompany: true, scheduling: true,
    reports: false, goals: false, exportFull: false, fullHistory: false,
    prioritySupport: false, onboarding: false, smartNotifications: false,
    audit: false, vipSupport: false, customIntegrations: false, sla: false,
  },
  pro: {
    dashboard: true, categories: true, cashFlow: true,
    financialModule: true, extendedHistory: true, exportBasic: true,
    aiAssistant: true, shareCompany: true, scheduling: true,
    reports: true, goals: true, exportFull: true, fullHistory: true,
    prioritySupport: true, onboarding: true, smartNotifications: true,
    audit: false, vipSupport: false, customIntegrations: false, sla: false,
  },
  scale: {
    dashboard: true, categories: true, cashFlow: true,
    financialModule: true, extendedHistory: true, exportBasic: true,
    aiAssistant: true, shareCompany: true, scheduling: true,
    reports: true, goals: true, exportFull: true, fullHistory: true,
    prioritySupport: true, onboarding: true, smartNotifications: true,
    audit: true, vipSupport: true, customIntegrations: true, sla: true,
  },
}

// ── Helpers ────────────────────────────────────────────────────
export function planHasAccess(currentPlan: string, requiredPlan: PlanKey): boolean {
  const ci = PLAN_ORDER.indexOf(currentPlan as PlanKey)
  const ri = PLAN_ORDER.indexOf(requiredPlan)
  return ci !== -1 && ci >= ri
}

export function getLimits(plan: string) {
  return PLAN_LIMITS[plan as PlanKey] ?? PLAN_LIMITS.free
}

export function getFeatures(plan: string) {
  return PLAN_FEATURES[plan as PlanKey] ?? PLAN_FEATURES.free
}
