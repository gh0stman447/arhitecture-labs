'use client'

import { useEffect, useState } from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default function DocsPage() {
  const [spec, setSpec] = useState(null)

  useEffect(() => {
    fetch('/api/docs').then(r => r.json()).then(setSpec)
  }, [])

  if (!spec) return <div className="p-8">Loading docs...</div>

  return (
    <div style={{ colorScheme: 'light', background: '#fff', minHeight: '100vh' }}>
      <SwaggerUI spec={spec} />
    </div>
  )
}
