import axios from 'axios'

const SERVER_BASE = ''

export async function fetchGHLContent() {
    const apiKey = localStorage.getItem('ghl_apiKey')
    const subId = localStorage.getItem('ghl_subId')
    if (!apiKey || !subId) throw new Error('Missing API key or subaccount ID in Integration')

    const v1Headers = { Authorization: `Bearer ${apiKey}` }
    const v2Headers = { Authorization: `Bearer ${apiKey}`, Version: '2021-07-28' }
    const results = []

    // Helper to format proper absolute URL
    const buildUrl = (parent, step) => {
        let domain = ''
        const domainObj = parent.domain || parent.selectedDomain || null
        if (typeof domainObj === 'string') domain = domainObj
        else if (domainObj) domain = domainObj.url || domainObj.name || domainObj.domain || domainObj.domainName || ''

        // Heuristic: Extract domain from name if present in parentheses (common in GHL)
        if (!domain && parent.name) {
            const match = parent.name.match(/\(([^)]+)\)/)
            if (match && match[1].includes('.')) {
                domain = match[1]
            }
        }

        // Prioritize path/slug for construction
        let path = step.path || step.slug || ''
        let stepUrl = step.url || step.canonicalUrl || step.liveUrl || step.canonicalLink || ''

        // If stepUrl is an internal GHL link, and we have a path, use the path instead
        if (stepUrl.includes('app.gohighlevel.com') && path) {
            stepUrl = path
        }

        if (stepUrl && !stepUrl.startsWith('http')) {
            // It's a path
            if (domain) {
                const cleanDomain = domain.replace(/^https?:\/\//, '')
                return `https://${cleanDomain}/${stepUrl.startsWith('/') ? stepUrl.substring(1) : stepUrl}`
            } else {
                // Fallback to preview link if no domain
                return 'https://app.gohighlevel.com/v2/preview/path' + (stepUrl.startsWith('/') ? '' : '/') + stepUrl
            }
        }

        // If it's already a full URL but we have a domain, and it's an internal link, swap the domain
        if (stepUrl.startsWith('http') && stepUrl.includes('app.gohighlevel.com') && domain) {
            try {
                const urlObj = new URL(stepUrl)
                const cleanDomain = domain.replace(/^https?:\/\//, '')
                return `https://${cleanDomain}${urlObj.pathname}${urlObj.search}`
            } catch (e) { /* ignore */ }
        }

        return stepUrl || path || ''
    }

    // 1. Fetch Funnels
    try {
        const funnelsStr = await axios.get(`https://services.leadconnectorhq.com/funnels/funnel/list?locationId=${subId}`, { headers: v2Headers }).catch(() => null)
        const funnels = funnelsStr || await axios.get(`https://rest.gohighlevel.com/v1/funnels?locationId=${subId}`, { headers: v1Headers })
        const arr = funnels?.data?.funnels || funnels?.data || []
        if (Array.isArray(arr)) {
            arr.forEach(f => {
                const pages = f.steps || f.pages || []
                if (pages.length > 0) {
                    pages.forEach(step => {
                        results.push({
                            id: step.id || step._id,
                            type: 'funnel_page',
                            title: `${f.name || f.title || 'Funnel'} > ${step.name || step.title || 'Page'}`,
                            link: buildUrl(f, step),
                            data: step
                        })
                    })
                } else {
                    results.push({ id: f.id || f._id, type: 'funnel', title: f.name || 'Funnel', link: typeof f.domain === 'string' ? f.domain : (f.domain?.url || ''), data: f })
                }
            })
        }
    } catch (e) { console.warn('Funnels error', e.response?.data || e.message) }

    // 2. Fetch Websites
    try {
        const websitesStr = await axios.get(`https://services.leadconnectorhq.com/funnels/funnel/list?locationId=${subId}&type=website`, { headers: v2Headers }).catch(() => null)
        const websites = websitesStr || await axios.get(`https://rest.gohighlevel.com/v1/websites?locationId=${subId}`, { headers: v1Headers })
        const arr = websites?.data?.websites || websites?.data?.funnels || websites?.data || []
        if (Array.isArray(arr)) {
            arr.forEach(w => {
                const pages = w.pages || w.steps || []
                if (pages.length > 0) {
                    pages.forEach(step => {
                        results.push({
                            id: step.id || step._id,
                            type: 'website_page',
                            title: `${w.name || w.title || 'Website'} > ${step.name || step.title || 'Page'}`,
                            link: buildUrl(w, step),
                            data: step
                        })
                    })
                } else {
                    results.push({ id: w.id || w._id, type: 'website', title: w.name || w.title || 'Website', link: buildUrl(w, { url: '/' }), data: w })
                }
            })
        }
    } catch (e) { console.warn('Websites error', e.response?.data || e.message) }

    // 3. Fetch Blog Posts
    try {
        const blogsRes = await axios.get(`https://services.leadconnectorhq.com/blogs/site/all?locationId=${subId}&limit=100&skip=0`, { headers: v2Headers }).catch(() => null)
        if (blogsRes && Array.isArray(blogsRes.data.blogs)) {
            for (const blog of blogsRes.data.blogs) {
                const postsRes = await axios.get(`https://services.leadconnectorhq.com/blogs/posts/all?locationId=${subId}&blogId=${blog._id}&limit=100&offset=0`, { headers: v2Headers }).catch(() => null)
                const postsArr = postsRes?.data?.posts || postsRes?.data || []
                if (Array.isArray(postsArr)) {
                    postsArr.forEach(p => {
                        let link = p.canonicalLink || p.canonicalUrl || p.url || p.customUrl || ''
                        if (!link && p.slug) link = buildUrl(blog, { url: '/post/' + p.slug })
                        results.push({ id: p._id || p.id, type: 'blog_post', title: p.title || p.name || 'Blog Post', link, data: p })
                    })
                }
            }
        } else {
            // Fallback to v1
            const posts = await axios.get(`https://rest.gohighlevel.com/v1/blog-posts?locationId=${subId}`, { headers: v1Headers })
            if (Array.isArray(posts.data.blogPosts)) {
                posts.data.blogPosts.forEach(p => {
                    const link = p.canonicalLink || p.canonicalUrl || p.url || ''
                    results.push({ id: p.id, type: 'blog_post', title: p.title || p.slug || 'Untitled', link, data: p })
                })
            }
        }
    } catch (e) { console.warn('Blogs error', e.response?.data || e.message) }

    // Deduplicate
    const uniq = Array.from(new Map(results.map(r => [String(r.id), { ...r }])).values())
    return uniq
}

export async function exportToWebhook(item) {
    const webhook = localStorage.getItem('export_webhook')
    if (!webhook) throw new Error('Export webhook not configured in Integration')

    // Notify server to forward and watch for response
    await axios.post(`${SERVER_BASE}/api/export`, { id: item.id, item, webhookUrl: webhook })
}

export async function pollResponses(id, timeoutMs = 60000) {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
        const res = await axios.get(`${SERVER_BASE}/api/responses?id=${encodeURIComponent(id)}`)
        if (res.data && res.data.wordpressLink) {
            return res.data
        }
        // wait 2s
        await new Promise(r => setTimeout(r, 2000))
    }
    return null
}
