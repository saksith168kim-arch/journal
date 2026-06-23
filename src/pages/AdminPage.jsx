// src/pages/AdminPage.jsx
import { useState, useEffect } from 'react'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'

export default function AdminPage() {
    const { isAdmin, loading, userProfile } = useAuth()
    const navigate = useNavigate()
    const [users, setUsers] = useState([])
    const [fetching, setFetching] = useState(true)
    const [updating, setUpdating] = useState(null)
    const [search, setSearch] = useState('')

    // Block non-admins — must be before any early return
    useEffect(() => {
        if (!loading && userProfile && !isAdmin) navigate('/')
    }, [isAdmin, loading, userProfile])

    // Fetch all users
    useEffect(() => {
        async function fetchUsers() {
            try {
                const snap = await getDocs(collection(db, 'users'))
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                setUsers(list)
            } catch (err) {
                console.error('Failed to fetch users:', err)
            } finally {
                setFetching(false)
            }
        }
        if (isAdmin) fetchUsers()
        else if (!loading && userProfile) setFetching(false)
    }, [isAdmin, loading, userProfile])

    const filtered = users.filter(u =>
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.displayName?.toLowerCase().includes(search.toLowerCase())
    )

    const stats = {
        total: users.length,
        free: users.filter(u => u.role === 'free').length,
        pro: users.filter(u => u.role === 'pro').length,
        admin: users.filter(u => u.role === 'admin').length,
    }

    const brd = '1px solid var(--border)'
    const roleColor = (role) => role === 'admin' ? '#f59e0b' : role === 'pro' ? '#22c55e' : 'var(--text-mut)'
    const roleBg = (role) => role === 'admin' ? 'rgba(245,158,11,0.1)' : role === 'pro' ? 'rgba(34,197,94,0.1)' : 'var(--bg-hover)'

    // Single loading check at the bottom — after all hooks
    if (loading || fetching || !userProfile) return (
        <Layout openCount={0}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-dim)' }}>
                Loading...
            </div>
        </Layout>
    )

    async function changeRole(uid, newRole) {
        setUpdating(uid)
        try {
            await updateDoc(doc(db, 'users', uid), { role: newRole })
            setUsers(prev => prev.map(u => u.id === uid ? { ...u, role: newRole } : u))
        } catch (err) {
            alert('Failed to update role: ' + err.message)
        } finally {
            setUpdating(null)
        }
    }

    async function setProUntil(uid, days) {
        const until = new Date()
        until.setDate(until.getDate() + days)
        setUpdating(uid)
        try {
            await updateDoc(doc(db, 'users', uid), { role: 'pro', subscribedUntil: until })
            setUsers(prev => prev.map(u => u.id === uid ? { ...u, role: 'pro', subscribedUntil: until } : u))
        } catch (err) {
            alert('Failed to update: ' + err.message)
        } finally {
            setUpdating(null)
        }
    }

    return (
        <Layout openCount={0}>
            <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-pri)', marginBottom: 4 }}>Admin Panel</div>
                <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>Manage users and subscriptions</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 24 }}>
                {[
                    { label: 'Total Users', value: stats.total, color: 'var(--acc-main)' },
                    { label: 'Free', value: stats.free, color: 'var(--text-mut)' },
                    { label: 'Pro', value: stats.pro, color: '#22c55e' },
                    { label: 'Admin', value: stats.admin, color: '#f59e0b' },
                ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: 'var(--bg-panel)', border: brd, borderRadius: 12, padding: '16px' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>{label}</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}>{value}</div>
                    </div>
                ))}
            </div>

            <div style={{ marginBottom: 14 }}>
                <input
                    placeholder="Search by email or name..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ background: 'var(--bg-panel)', border: brd, borderRadius: 8, color: 'var(--text-pri)', fontSize: 13, padding: '8px 14px', outline: 'none', width: 280, fontFamily: 'var(--font-ui)' }}
                />
            </div>

            <div style={{ background: 'var(--bg-panel)', border: brd, borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                        <tr style={{ background: 'var(--bg-card)', borderBottom: brd }}>
                            {['User', 'Email', 'Role', 'Trade Limit', 'Pro Until', 'Joined', 'Actions'].map(h => (
                                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((u, i) => (
                            <tr key={u.id} style={{ borderBottom: brd, background: i % 2 === 0 ? 'transparent' : 'var(--bg-card)' }}>
                                <td style={{ padding: '12px 14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {u.photoURL
                                            ? <img src={u.photoURL} style={{ width: 28, height: 28, borderRadius: '50%' }} alt="" />
                                            : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--acc-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--acc-main)' }}>
                                                {(u.displayName || u.email || 'U')[0].toUpperCase()}
                                            </div>
                                        }
                                        <span style={{ fontWeight: 600, color: 'var(--text-pri)', whiteSpace: 'nowrap' }}>{u.displayName || '—'}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '12px 14px', color: 'var(--text-sec)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{u.email}</td>
                                <td style={{ padding: '12px 14px' }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: roleBg(u.role), color: roleColor(u.role) }}>
                                        {u.role?.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', color: 'var(--text-sec)' }}>{u.tradeLimit ?? 10}</td>
                                <td style={{ padding: '12px 14px', color: 'var(--text-dim)', fontSize: 12, whiteSpace: 'nowrap' }}>
                                    {u.subscribedUntil ? new Date(u.subscribedUntil?.seconds ? u.subscribedUntil.seconds * 1000 : u.subscribedUntil).toLocaleDateString() : '—'}
                                </td>
                                <td style={{ padding: '12px 14px', color: 'var(--text-dim)', fontSize: 12, whiteSpace: 'nowrap' }}>
                                    {u.createdAt ? new Date(u.createdAt?.seconds ? u.createdAt.seconds * 1000 : u.createdAt).toLocaleDateString() : '—'}
                                </td>
                                <td style={{ padding: '12px 14px' }}>
                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                        {u.role !== 'pro' && u.role !== 'admin' && (
                                            <>
                                                <button onClick={() => setProUntil(u.id, 30)} disabled={updating === u.id}
                                                    style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid #22c55e', background: 'rgba(34,197,94,0.1)', color: '#22c55e', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 600 }}>
                                                    +30d Pro
                                                </button>
                                                <button onClick={() => setProUntil(u.id, 365)} disabled={updating === u.id}
                                                    style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid #22c55e', background: 'rgba(34,197,94,0.1)', color: '#22c55e', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 600 }}>
                                                    +1yr Pro
                                                </button>
                                            </>
                                        )}
                                        {u.role === 'pro' && (
                                            <button onClick={() => changeRole(u.id, 'free')} disabled={updating === u.id}
                                                style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-mut)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 600 }}>
                                                Revoke Pro
                                            </button>
                                        )}
                                        {u.role !== 'admin' && (
                                            <button onClick={() => changeRole(u.id, 'admin')} disabled={updating === u.id}
                                                style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid #f59e0b', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 600 }}>
                                                Make Admin
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>No users found</div>
                )}
            </div>
        </Layout>
    )
}