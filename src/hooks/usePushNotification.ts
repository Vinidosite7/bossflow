'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export function usePushNotification() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if ('Notification' in window) setPermission(Notification.permission)
  }, [])

  async function requestPermission() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return
    setLoading(true)
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result === 'granted') await subscribe()
    } catch (err) {
      console.error('[Push] Erro ao pedir permissão:', err)
    } finally {
      setLoading(false)
    }
  }

  async function subscribe() {
    try {
      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      if (existing) { await saveSubscription(existing); return }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        ),
      })
      await saveSubscription(subscription)
    } catch (err) {
      console.error('[Push] Erro ao subscribar:', err)
    }
  }

  async function saveSubscription(subscription: PushSubscription) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const sub = subscription.toJSON()
    await supabase.from('push_subscriptions').upsert({
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys?.p256dh,
      auth: sub.keys?.auth,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
  }

  return { permission, loading, requestPermission }
}