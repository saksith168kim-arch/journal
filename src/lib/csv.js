// src/lib/csv.js
import Papa from 'papaparse'

// ── Export ────────────────────────────────────────────────────
export function exportTradesToCSV(trades) {
  const rows = trades.map((t) => ({
    id: t.id,
    date: t.date,
    symbol: t.symbol,
    asset: t.asset,
    direction: t.direction,
    strategy: t.strategy,
    status: t.status,
    entry_price: t.entry?.price ?? '',
    entry_quantity: t.entry?.quantity ?? '',
    stop_loss: t.entry?.stopLoss ?? '',
    entry_fees: t.entry?.fees ?? '',
    tp1_price: t.entry?.takeProfits?.[0]?.price ?? '',
    tp1_qty: t.entry?.takeProfits?.[0]?.quantity ?? '',
    tp2_price: t.entry?.takeProfits?.[1]?.price ?? '',
    tp2_qty: t.entry?.takeProfits?.[1]?.quantity ?? '',
    tp3_price: t.entry?.takeProfits?.[2]?.price ?? '',
    tp3_qty: t.entry?.takeProfits?.[2]?.quantity ?? '',
    exits_json: JSON.stringify(t.exits ?? []),
    notes: t.notes ?? '',
  }))

  const csv = Papa.unparse(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `tradelog_export_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// ── Import ────────────────────────────────────────────────────
export function importTradesFromCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        try {
          const trades = result.data.map((row) => {
            const takeProfits = []
            if (row.tp1_price) takeProfits.push({ id: 1, price: +row.tp1_price, quantity: +row.tp1_qty || 0 })
            if (row.tp2_price) takeProfits.push({ id: 2, price: +row.tp2_price, quantity: +row.tp2_qty || 0 })
            if (row.tp3_price) takeProfits.push({ id: 3, price: +row.tp3_price, quantity: +row.tp3_qty || 0 })

            let exits = []
            try { exits = JSON.parse(row.exits_json || '[]') } catch {}

            return {
              id: row.id || crypto.randomUUID(),
              date: row.date,
              symbol: row.symbol,
              asset: row.asset || 'Stocks',
              direction: row.direction || 'LONG',
              strategy: row.strategy || 'Custom',
              status: row.status || 'OPEN',
              notes: row.notes || '',
              entry: {
                price: +row.entry_price || 0,
                quantity: +row.entry_quantity || 0,
                stopLoss: row.stop_loss ? +row.stop_loss : null,
                fees: +row.entry_fees || 0,
                takeProfits,
              },
              exits,
            }
          })
          resolve(trades)
        } catch (err) {
          reject(err)
        }
      },
      error: reject,
    })
  })
}
