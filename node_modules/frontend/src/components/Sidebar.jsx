import React from 'react'

export default function Sidebar({ tab, setTab }) {
    return (
        <aside className="w-64 bg-white border-r">
            <div className="p-4 text-2xl font-semibold">GHL Exporter</div>
            <nav className="p-2">
                <button
                    className={`w-full text-left px-4 py-2 rounded ${tab === 'integration' ? 'bg-blue-50' : ''}`}
                    onClick={() => setTab('integration')}
                >Integration</button>
                <button
                    className={`w-full text-left px-4 py-2 mt-2 rounded ${tab === 'watch' ? 'bg-blue-50' : ''}`}
                    onClick={() => setTab('watch')}
                >Watch</button>
            </nav>
        </aside>
    )
}
