// src/hooks/useTrades.js
import { useState, useEffect, useCallback } from 'react'
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'

const FREE_TRADE_LIMIT = 10

export function useTrades() {
  const { user, isPro, isAdmin } = useAuth()
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)

  // Real-time listener
  useEffect(() => {
    if (!user) { setTrades([]); setLoading(false); return }
    const q = query(
      collection(db, 'users', user.uid, 'trades'),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setTrades(data)
      setLoading(false)
    })
    return unsub
  }, [user])

  // Check if user can add more trades
  const canAddTrade = isPro || isAdmin || trades.length < FREE_TRADE_LIMIT
  const tradesRemaining = isPro || isAdmin ? null : Math.max(0, FREE_TRADE_LIMIT - trades.length)

  const addTrade = useCallback(async (trade) => {
    if (!user) return
    if (!isPro && !isAdmin && trades.length >= FREE_TRADE_LIMIT) {
      throw new Error('TRADE_LIMIT_REACHED')
    }
    const { id: _ignored, ...rest } = trade
    await addDoc(collection(db, 'users', user.uid, 'trades'), {
      ...rest,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }, [user, isPro, isAdmin, trades.length])

  const updateTrade = useCallback(async (id, trade) => {
    if (!user) return
    const { id: _ignored, ...rest } = trade
    await updateDoc(doc(db, 'users', user.uid, 'trades', id), {
      ...rest,
      updatedAt: serverTimestamp(),
    })
  }, [user])

  const deleteTrade = useCallback(async (id) => {
    if (!user) return
    await deleteDoc(doc(db, 'users', user.uid, 'trades', id))
  }, [user])

  const importTrades = useCallback(async (tradesList) => {
    if (!user) return
    if (!isPro && !isAdmin && trades.length + tradesList.length > FREE_TRADE_LIMIT) {
      throw new Error('TRADE_LIMIT_REACHED')
    }
    await Promise.all(
      tradesList.map((t) => {
        const { id: _ignored, ...rest } = t
        return addDoc(collection(db, 'users', user.uid, 'trades'), {
          ...rest,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      })
    )
  }, [user, isPro, isAdmin, trades.length])

  return {
    trades,
    loading,
    addTrade,
    updateTrade,
    deleteTrade,
    importTrades,
    canAddTrade,
    tradesRemaining,
  }
}