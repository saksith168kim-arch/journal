// src/pages/TradePage.jsx  (used for both New and Edit)
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
  symbol: '', asset: 'Stocks', direction: 'LONG',
  strategy: 'Breakout', notes: '',
  entry: { price: '', lotSize: '', closePrice: '', fees: '', imageUrl: null, imagePath: null },
})

export default function TradePage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { trades, addTrade, updateTrade } = useTrades()
  const navigate = useNavigate()
  const { t } = useLang()
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  // Load existing trade for edit
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
      if (isEdit) {
        await updateTrade(id, trade)
      } else {
        await addTrade(trade)
      }
      navigate('/')
    } catch (err) {
      alert('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-[20px] font-extrabold text-text-primary mb-6">
          {isEdit ? t('edit_trade') : t('log_new_trade')}
        </h1>

        {/* Trade Info */}
        <div className="bg-bg-card border border-border rounded-xl p-5 mb-4">
          <h2 className="text-[14px] font-extrabold text-text-primary mb-4">{t('trade_info')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={t('label_date')} type="date" value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} />
            <div>
              <Input
                label={t('label_symbol')}
                placeholder={t('label_symbol_placeholder')}
                value={form.symbol}
                onChange={(v) => setForm((f) => ({ ...f, symbol: v.toUpperCase() }))}
              />
              {errors.symbol && <p className="text-accent-red text-[11px] mt-1">{errors.symbol}</p>}
            </div>
            <Select label={t('label_asset')} value={form.asset} onChange={(v) => setForm((f) => ({ ...f, asset: v }))} options={ASSETS} />
            <Select label={t('label_strategy')} value={form.strategy} onChange={(v) => setForm((f) => ({ ...f, strategy: v }))} options={STRATEGIES} />

            {/* Direction toggle */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] text-text-dim uppercase mb-2">{t('label_direction')}</label>
              <div className="flex gap-2">
                {['LONG', 'SHORT'].map((d) => (
                  <button key={d} onClick={() => setForm((f) => ({ ...f, direction: d }))}
                    className="flex-1 py-2.5 rounded-lg text-[12px] font-bold cursor-pointer transition-all border"
                    style={{
                      background: form.direction === d ? (d === 'LONG' ? '#0d2e1f' : '#2e0d1a') : '#060c16',
                      borderColor: form.direction === d ? (d === 'LONG' ? '#00e5a0' : '#ff4d6d') : '#1a2a40',
                      color: form.direction === d ? (d === 'LONG' ? '#00e5a0' : '#ff4d6d') : '#3a5a7a',
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
          <p className="text-accent-red text-[12px] -mt-2 mb-4">{errors.price}</p>
        )}

        {/* Notes */}
        <div className="bg-bg-card border border-border rounded-xl p-5 mb-6">
          <h2 className="text-[14px] font-extrabold text-text-primary mb-4">{t('label_notes')}</h2>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={3}
            placeholder={t('notes_placeholder')}
            className="w-full bg-bg-panel border border-border rounded-lg text-text-primary text-[13px] px-3 py-2.5 outline-none focus:border-accent-green transition-colors resize-y leading-relaxed"
          />
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={saving} size="lg">
            {saving ? t('btn_saving') : isEdit ? t('btn_update') : t('btn_log')}
          </Button>
          <Button variant="ghost" onClick={() => navigate('/')}>{t('btn_cancel')}</Button>
        </div>
      </div>
    </Layout>
  )
}
