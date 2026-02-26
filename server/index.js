const express = require('express')
const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const app = express()
app.use(cors())
app.use(bodyParser.json())

// Serve frontend static files when available (production build)
const publicDir = path.join(__dirname, 'public')
if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir))
    app.get('*', (req, res) => {
        res.sendFile(path.join(publicDir, 'index.html'))
    })
}

// In-memory store for responses: { id -> { wordpressLink, receivedAt, payload }}
const responses = {}

// Endpoint used by frontend to initiate export: server will forward to configured webhook
app.post('/api/export', async (req, res) => {
    const { id, item, webhookUrl } = req.body
    if (!id || !webhookUrl) return res.status(400).json({ error: 'missing id or webhookUrl' })
    try {
        // forward to webhook (fire-and-forget)
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, item })
        })
        // mark pending
        responses[id] = responses[id] || { wordpressLink: null }
        return res.json({ ok: true })
    } catch (e) {
        console.error('forward failed', e)
        return res.status(500).json({ error: e.message })
    }
})

// External webhook target: when external system responds with WordPress link, POST here
// Example payload: { id: '...', wordpressLink: 'https://...', any: '...' }
app.post('/webhook/receive', (req, res) => {
    const { id, wordpressLink } = req.body
    if (!id) return res.status(400).json({ error: 'missing id' })
    responses[id] = responses[id] || {}
    responses[id].wordpressLink = wordpressLink || null
    responses[id].payload = req.body
    responses[id].receivedAt = new Date().toISOString()
    console.log('Received webhook response for', id)
    res.json({ ok: true })
})

// Frontend polling endpoint
app.get('/api/responses', (req, res) => {
    const id = req.query.id
    if (!id) return res.status(400).json({ error: 'missing id query' })
    return res.json(responses[id] || {})
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log('Server listening on', PORT))
