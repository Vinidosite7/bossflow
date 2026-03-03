cat > public/register-sw.js << 'EOF'
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      console.log('[BossFlow SW] Registrado:', reg.scope)
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[BossFlow SW] Nova versão disponível')
            }
          })
        }
      })
    } catch (err) {
      console.error('[BossFlow SW] Erro:', err)
    }
  })
}
EOF