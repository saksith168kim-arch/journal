// src/pages/TradePage.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTrades } from '../hooks/useTrades'
import { Input, Select, Button } from '../components/ui'
import PositionEntryForm from '../components/trades/PositionEntryForm'
import Layout from '../components/layout/Layout'
import { useLang } from '../context/LanguageContext'

const STRATEGIES = ['Breakout', 'Trend Following', 'Mean Reversion', 'Scalping', 'Swing Trade', 'Momentum', 'News Play', 'Options Strategy', 'Custom']
const ASSETS = ['Stocks', 'Forex', 'Crypto', 'Options', 'Futures', 'ETF']

const emptyForm = () => ({
  date: new Date().toISOString().slice(0, 10),
  symbol: 'XAUUSD', asset: 'Forex', direction: 'LONG',
  strategy: 'Breakout', notes: '',
  entry: { price: '', lotSize: '', closePrice: '', fees: '', imageUrl: null, imagePath: null },
})

const card = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 20,
  marginBottom: 16,
  width: '100%',
  boxSizing: 'border-box',
}

export default function TradePage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { trades, addTrade, updateTrade } = useTrades()
  const navigate = useNavigate()
  const { t } = useLang()
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEdit && trades.length) {
      const tr = trades.find((x) => x.id === id)
      if (tr) {
        setForm({
          date: tr.date, symbol: tr.symbol, asset: tr.asset,
          direction: tr.direction, strategy: tr.strategy, notes: tr.notes || '',
          entry: {
            price: tr.entry?.price ?? '',
            lotSize: tr.entry?.lotSize ?? '',
            closePrice: tr.entry?.closePrice ?? '',
            fees: tr.entry?.fees ?? '',
            imageUrl: tr.entry?.imageUrl ?? null,
            imagePath: tr.entry?.imagePath ?? null,
          },
        })
      }
    }
  }, [isEdit, id, trades])

  function validate() {
    const e = {}
    if (!form.symbol.trim()) e.symbol = t('err_symbol')
    if (!form.entry.price) e.price = t('err_price')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSaving(true)
    try {
      const ep = +form.entry.price
      const cp = form.entry.closePrice ? +form.entry.closePrice : null
      const ls = form.entry.lotSize ? +form.entry.lotSize : null
      let profit = null
      if (ep && cp && ls) {
        profit = form.direction === 'SHORT' ? (ep - cp) * ls * 100 : (cp - ep) * ls * 100
      }
      const autoStatus = profit == null ? null : profit > 0 ? 'WIN' : profit < 0 ? 'LOSS' : null
      const trade = {
        date: form.date,
        symbol: form.symbol.toUpperCase().trim(),
        asset: form.asset,
        direction: form.direction,
        strategy: form.strategy,
        status: autoStatus,
        notes: form.notes,
        entry: {
          price: +form.entry.price,
          lotSize: form.entry.lotSize ? +form.entry.lotSize : null,
          closePrice: form.entry.closePrice ? +form.entry.closePrice : null,
          fees: +form.entry.fees || 0,
          imageUrl: form.entry.imageUrl || null,
          imagePath: form.entry.imagePath || null,
        },
      }
      if (isEdit) { await updateTrade(id, trade) } else { await addTrade(trade) }
      navigate('/')
    } catch (err) {
      alert('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <div style={{ maxWidth: 640, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-pri)', marginBottom: 20 }}>
          {isEdit ? t('edit_trade') : t('log_new_trade')}
        </h1>

        {/* Trade Info */}
        <div style={card}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-pri)', marginBottom: 16 }}>{t('trade_info')}</h2>

          {/* Stack all fields vertically on mobile, 2-col on wider screens */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label={t('label_date')} type="date" value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} />

            <div>
              <Input
                label={t('label_symbol')}
                placeholder={t('label_symbol_placeholder')}
                value={form.symbol}
                onChange={(v) => setForm((f) => ({ ...f, symbol: v.toUpperCase() }))}
              />
              {errors.symbol && <p style={{ color: 'var(--col-loss)', fontSize: 11, marginTop: 4 }}>{errors.symbol}</p>}
            </div>

            <Select label={t('label_asset')} value={form.asset} onChange={(v) => setForm((f) => ({ ...f, asset: v }))} options={ASSETS} />
            <Select label={t('label_strategy')} value={form.strategy} onChange={(v) => setForm((f) => ({ ...f, strategy: v }))} options={STRATEGIES} />

            {/* Direction */}
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                {t('label_direction')}
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['LONG', 'SHORT'].map((d) => (
                  <button key={d} onClick={() => setForm((f) => ({ ...f, direction: d }))}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-ui)',
                      background: form.direction === d
                        ? (d === 'LONG' ? 'var(--col-win-bg)' : 'var(--col-loss-bg)')
                        : 'var(--bg-base)',
                      border: `1px solid ${form.direction === d
                        ? (d === 'LONG' ? 'var(--col-win)' : 'var(--col-loss)')
                        : 'var(--border)'}`,
                      color: form.direction === d
                        ? (d === 'LONG' ? 'var(--col-win)' : 'var(--col-loss)')
                        : 'var(--text-mut)',
                    }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Position entry */}
        <PositionEntryForm form={form} setForm={setForm} />
        {errors.price && (
          <p style={{ color: 'var(--col-loss)', fontSize: 12, marginTop: -8, marginBottom: 16 }}>{errors.price}</p>
        )}

        {/* Notes */}
        <div style={card}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-pri)', marginBottom: 16 }}>{t('label_notes')}</h2>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={3}
            placeholder={t('notes_placeholder')}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--bg-panel)', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text-pri)', fontSize: 13, padding: '10px 12px',
              outline: 'none', transition: 'border-color 0.2s', resize: 'vertical',
              lineHeight: 1.6, fontFamily: 'var(--font-ui)',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--acc-main)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Button onClick={handleSubmit} disabled={saving} size="lg">
            {saving ? t('btn_saving') : isEdit ? t('btn_update') : t('btn_log')}
          </Button>
          <Button variant="ghost" onClick={() => navigate('/')}>{t('btn_cancel')}</Button>
        </div>
      </div>
    </Layout>
  )
}