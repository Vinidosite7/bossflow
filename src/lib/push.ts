// ── Helper: dispara push notification para o usuário atual
export async function sendPush(userId: string, title: string, body: string, url = '/dashboard') {
  try {
    await fetch('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, body, url }),
    })
  } catch (err) {
    console.error('[Push]', err)
  }
}

// ── Formatadores
export const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
