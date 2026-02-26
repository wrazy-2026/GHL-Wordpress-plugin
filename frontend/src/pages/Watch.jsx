import React, { useState } from 'react'
import { fetchGHLContent, exportToWebhook, pollResponses } from '../services/ghlService'

export default function Watch() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(false)

    const fetch = async () => {
        setLoading(true)
        try {
            const res = await fetchGHLContent()
            setItems(res)
        } catch (e) {
            alert('Fetch failed: ' + e.message)
        } finally { setLoading(false) }
    }

    const handleExport = async (item, idx) => {
        const id = item.id
        // mark as pending
        const newItems = [...items]
        newItems[idx] = { ...item, status: 'exporting' }
        setItems(newItems)
        try {
            await exportToWebhook(item)
            // start polling server for response
            const response = await pollResponses(item.id)
            const updated = [...newItems]
            updated[idx] = { ...item, status: 'done', wordpressLink: response?.wordpressLink || '' }
            setItems(updated)
        } catch (e) {
            const updated = [...newItems]
            updated[idx] = { ...item, status: 'error' }
            setItems(updated)
            console.error(e)
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold mb-4">Watch</h1>
                <div>
                    <button onClick={fetch} className="px-4 py-2 bg-green-600 text-white rounded">Fetch New Content</button>
                </div>
            </div>

            <div className="mt-4">
                <table className="w-full table-auto border-collapse">
                    <thead>
                        <tr className="text-left border-b">
                            <th className="p-2">Type</th>
                            <th className="p-2">Title</th>
                            <th className="p-2">Link on GHL</th>
                            <th className="p-2">Export</th>
                            <th className="p-2">WordPress Link</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((it, i) => (
                            <tr key={it.id} className="border-b">
                                <td className="p-2">{it.type}</td>
                                <td className="p-2">{it.title}</td>
                                <td className="p-2 text-blue-600 underline">
                                    {it.link ? (
                                        <a href={it.link} target="_blank" rel="noreferrer" title={it.link}>
                                            {it.link.length > 40 ? it.link.substring(0, 40) + '...' : it.link}
                                        </a>
                                    ) : (
                                        <span className="text-gray-400 no-underline">N/A</span>
                                    )}
                                </td>
                                <td className="p-2">
                                    <button disabled={it.status === 'exporting'} onClick={() => handleExport(it, i)} className="px-3 py-1 bg-blue-600 text-white rounded">Export</button>
                                </td>
                                <td className="p-2">{it.wordpressLink || (it.status === 'exporting' ? 'Publishing...' : '')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
