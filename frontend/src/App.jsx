import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import Integration from './pages/Integration'
import Watch from './pages/Watch'

export default function App() {
    const [tab, setTab] = useState('watch')
    return (
        <div className="h-screen flex bg-gray-50">
            <Sidebar tab={tab} setTab={setTab} />
            <main className="flex-1 p-6">
                {tab === 'integration' ? <Integration /> : <Watch />}
            </main>
        </div>
    )
}
