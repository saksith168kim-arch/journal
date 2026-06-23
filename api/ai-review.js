// api/ai-review.js  –  Vercel Serverless Function
// The API key lives ONLY here (server-side). The browser never sees it.

export default async function handler(req, res) {
    // ── 1. Only allow POST ────────────────────────────────────────────────────
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    // ── 2. Grab keys from server-side env ─────────────────────────────────────
    const apiKey = process.env.ANTHROPIC_API_KEY
    const botToken = process.env.BOT_TOKEN
    const chatId = process.env.CHAT_ID

    if (!apiKey) {
        return res.status(500).json({ error: 'Server misconfiguration: API key missing' })
    }

    const market = req.headers['x-market'] || 'Unknown'

    // ── 3. Forward the request body straight to Anthropic ────────────────────
    try {
        const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify(req.body),
        })

        const data = await anthropicRes.json()

        // ── 4. If success, check for Telegram signal ──────────────────────────
        if (anthropicRes.ok && data.content && data.content[0] && botToken && chatId) {
            try {
                let rawText = data.content.map(b => b.text || '').join('').trim()
                // Clean markdown if present
                rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
                
                let analysis
                try { 
                    analysis = JSON.parse(rawText) 
                } catch { 
                    const m = rawText.match(/\{[\s\S]*\}/)
                    if (m) analysis = JSON.parse(m[0])
                }

                if (analysis && analysis.confidence >= 70 && (analysis.signal === 'BUY' || analysis.signal === 'SELL')) {
                    const message = `🚨 *AI TRADE SIGNAL* 🚨\n\n` +
                        `📊 *Symbol:* ${market}\n` +
                        `⏰ *Timeframe:* ${analysis.timeframe || 'Unknown'}\n` +
                        `📈 *Signal:* ${analysis.signal}\n\n` +
                        `🎯 *Entry:* ${analysis.entry}\n` +
                        `🛑 *Stop Loss:* ${analysis.stopLoss}\n\n` +
                        `✅ *TP1:* ${analysis.tp1}\n` +
                        `✅ *TP2:* ${analysis.tp2}\n` +
                        `✅ *TP3:* ${analysis.tp3 || 'N/A'}\n\n` +
                        `📊 *Confidence:* ${analysis.confidence}%\n` +
                        `⚡ *Risk Reward:* ${analysis.riskReward}\n` +
                        `📈 *Trend:* ${analysis.trend}`;

                    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: chatId,
                            text: message,
                            parse_mode: 'Markdown'
                        })
                    })
                }
            } catch (teleErr) {
                console.error('Telegram error:', teleErr)
                // We don't fail the main request if telegram fails
            }
        }

        // ── 5. Pass Anthropic's status & body back to the browser ───────────────
        return res.status(anthropicRes.status).json(data)

    } catch (err) {
        console.error('Proxy error:', err)
        return res.status(502).json({ error: 'Failed to reach Anthropic API' })
    }
}