import React, { useState } from 'react'
import { fetchGHLContent, exportToWebhook, pollResponses } from '../services/ghlService'

export default function Watch() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('sites')

    const fetch = async () => {
        setLoading(true)
        try {
            const res = await fetchGHLContent()
            setItems(res)
        } catch (e) {
            alert('Fetch failed: ' + e.message)
        } finally { setLoading(false) }
    }

    const getFilteredItems = () => {
        const typeMap = {
            sites: ['website', 'website_page'],
            funnels: ['funnel', 'funnel_page'],
            blogs: ['blog_post']
        }
        return items.filter(item => typeMap[activeTab].includes(item.type))
    }

    const buildLiveLink = (item) => {
        const locationLink = localStorage.getItem('ghl_locationLink')
        if (!locationLink) return item.link

        try {
            const locationUrl = new URL(locationLink)
            const itemUrl = new URL(item.link, locationLink)
            return item.link.startsWith('http') ? item.link : `${locationUrl.origin}${item.link}`
        } catch (e) {
            return item.link
        }
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

            <div className="mb-4">
                <div className="flex gap-2 border-b">
                    <button
                        onClick={() => setActiveTab('sites')}
                        className={`px-4 py-2 font-medium ${activeTab === 'sites' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                    >
                        Sites
                    </button>
                    <button
                        onClick={() => setActiveTab('funnels')}
                        className={`px-4 py-2 font-medium ${activeTab === 'funnels' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                    >
                        Funnels
                    </button>
                    <button
                        onClick={() => setActiveTab('blogs')}
                        className={`px-4 py-2 font-medium ${activeTab === 'blogs' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                    >
                        Blogs
                    </button>
                </div>
            </div>

            <div className="mt-4">
                <table className="w-full table-auto border-collapse">
                    <thead>
                        <tr className="text-left border-b">
                            <th className="p-2">Type</th>
                            <th className="p-2">Title</th>
                            <th className="p-2">Live Link</th>
                            <th className="p-2">Export</th>
                            <th className="p-2">WordPress Link</th>
                        </tr>
                    </thead>
                    <tbody>
                        {getFilteredItems().map((it, i) => (
                            <tr key={it.id} className="border-b">
                                <td className="p-2">{it.type}</td>
                                <td className="p-2">{it.title}</td>
                                <td className="p-2 text-blue-600 underline">
                                    {it.link ? (
                                        <a href={buildLiveLink(it)} target="_blank" rel="noreferrer" title={buildLiveLink(it)}>
                                            {buildLiveLink(it).length > 40 ? buildLiveLink(it).substring(0, 40) + '...' : buildLiveLink(it)}
                                        </a>
                                    ) : (
                                        <span className="text-gray-400 no-underline">N/A</span>
                                    )}
                                </td>
                                <td className="p-2">
                                    <button disabled={it.status === 'exporting'} onClick={() => handleExport(it, items.indexOf(it))} className="px-3 py-1 bg-blue-600 text-white rounded">Export</button>
                                </td>
                                <td className="p-2">{it.wordpressLink || (it.status === 'exporting' ? 'Publishing...' : '')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {getFilteredItems().length === 0 && (
                    <p className="text-gray-500 mt-4 text-center">No items found for this tab. Click "Fetch New Content" to load data.</p>
                )}
            </div>
        </div>
    )
}
