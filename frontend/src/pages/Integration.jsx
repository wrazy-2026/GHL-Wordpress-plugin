import React, { useState, useEffect } from 'react'

export default function Integration() {
    const [apiKey, setApiKey] = useState('')
    const [subId, setSubId] = useState('')
    const [webhook, setWebhook] = useState('')

    useEffect(() => {
        setApiKey(localStorage.getItem('ghl_apiKey') || '')
        setSubId(localStorage.getItem('ghl_subId') || '')
        setWebhook(localStorage.getItem('export_webhook') || '')
    }, [])

    const save = () => {
        localStorage.setItem('ghl_apiKey', apiKey)
        localStorage.setItem('ghl_subId', subId)
        localStorage.setItem('export_webhook', webhook)
        alert('Saved')
    }

    return (
        <div>
            <h1 className="text-2xl font-semibold mb-4">Integration</h1>
            <div className="max-w-md space-y-4">
                <div>
                    <label className="block text-sm font-medium">GHL API Key</label>
                    <input value={apiKey} onChange={e => setApiKey(e.target.value)} className="mt-1 block w-full border rounded p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium">Subaccount ID</label>
                    <input value={subId} onChange={e => setSubId(e.target.value)} className="mt-1 block w-full border rounded p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium">Export Webhook URL</label>
                    <input value={webhook} onChange={e => setWebhook(e.target.value)} className="mt-1 block w-full border rounded p-2" />
                </div>
                <div>
                    <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
                </div>
            </div>
        </div>
    )
}
