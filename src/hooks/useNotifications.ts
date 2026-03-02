'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { fireWelcomeToasts } from '@/hooks/useToast'

export type Notification = {
  id: string
  type: 'task' | 'payment' | 'event' | 'sale' | 'info'
  title: string
  message: string
  color: string
  href: string
  createdAt: Date
  read: boolean
}

const STORAGE_KEY = 'bossflow_read_notifs'

function getReadIds(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

function markAsRead(id: string) {
  const ids = getReadIds()
  if (!ids.includes(id)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids, id]))
  }
}

function markAllRead(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

export function useNotifications(businessId: string | null) {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const firedRef = useRef(false)

  const load = useCallback(async () => {
    if (!businessId) { setLoading(false); return }
    try {
      const readIds = getReadIds()
      const today = new Date().toISOString().split('T')[0]
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]

      const [
        { data: overdueTasks },
        { data: dueTomorrow },
        { data: pendingTxs },
        { data: todayEvents },
        { data: lowStock },
      ] = await Promise.all([
        supabase.from('tasks').select('id, title, due_date')
          .eq('business_id', businessId).eq('status', 'todo').lt('due_date', today).limit(5),
        supabase.from('tasks').select('id, title')
          .eq('business_id', businessId).eq('status', 'todo').eq('due_date', tomorrowStr).limit(3),
        supabase.from('transactions').select('id, title, amount')
          .eq('business_id', businessId).eq('paid', false).lt('date', today).limit(5),
        supabase.from('events').select('id, title, start_at')
          .eq('business_id', businessId)
          .gte('start_at', today + 'T00:00:00')
          .lte('start_at', todayEnd.toISOString()).limit(3),
        supabase.from('products').select('id, name, stock')
          .eq('business_id', businessId).not('stock', 'is', null).lt('stock', 5).limit(3),
      ])

      const notifs: Notification[] = []

      // Eventos hoje — prioridade máxima
      ;(todayEvents || []).forEach(ev => {
        const id = `event-${ev.id}`
        const time = new Date(ev.start_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        notifs.push({
          id, type: 'event',
          title: 'Evento hoje',
          message: `${ev.title} às ${time}`,
          color: '#22d3ee',
          href: '/agenda',
          createdAt: new Date(ev.start_at),
          read: readIds.includes(id),
        })
      })

      // Tarefas atrasadas
      ;(overdueTasks || []).forEach(t => {
        const id = `task-overdue-${t.id}`
        const daysAgo = Math.floor((Date.now() - new Date(t.due_date).getTime()) / 86400000)
        notifs.push({
          id, type: 'task',
          title: 'Tarefa atrasada',
          message: `${t.title}${daysAgo > 0 ? ` · ${daysAgo}d atraso` : ''}`,
          color: '#f87171',
          href: '/tarefas',
          createdAt: new Date(t.due_date),
          read: readIds.includes(id),
        })
      })

      // Tarefas vencendo amanhã
      ;(dueTomorrow || []).forEach(t => {
        const id = `task-tomorrow-${t.id}`
        notifs.push({
          id, type: 'task',
          title: 'Vence amanhã',
          message: t.title,
          color: '#fbbf24',
          href: '/tarefas',
          createdAt: new Date(),
          read: readIds.includes(id),
        })
      })

      // Pagamentos pendentes
      ;(pendingTxs || []).forEach(t => {
        const id = `payment-${t.id}`
        const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        notifs.push({
          id, type: 'payment',
          title: 'Pagamento pendente',
          message: `${t.title} · ${fmt(Number(t.amount))}`,
          color: '#fbbf24',
          href: '/financeiro',
          createdAt: new Date(),
          read: readIds.includes(id),
        })
      })

      // Estoque baixo
      ;(lowStock || []).forEach(p => {
        const id = `stock-${p.id}`
        notifs.push({
          id, type: 'info',
          title: 'Estoque baixo',
          message: `${p.name} · ${p.stock} unidades`,
          color: '#a78bfa',
          href: '/produtos',
          createdAt: new Date(),
          read: readIds.includes(id),
        })
      })

      setNotifications(notifs)

      // Dispara toasts só na primeira carga do dia
      if (!firedRef.current) {
        firedRef.current = true
        fireWelcomeToasts(notifs)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [businessId])

  useEffect(() => { load() }, [load])

  function readNotification(id: string) {
    markAsRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  function readAll() {
    markAllRead(notifications.map(n => n.id))
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return { notifications, loading, unreadCount, readNotification, readAll, reload: load }
}
