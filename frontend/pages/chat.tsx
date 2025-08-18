
import { useState } from 'react'

export default function Chat() {
  const [q, setQ] = useState('')
  const [out, setOut] = useState('')
  async function send() {
    const res = await fetch('/api/chat', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({text:q, userId:'demo-user'})})
    const j = await res.json()
    setOut(JSON.stringify(j, null, 2))
  }
  return (
    <div style={{padding:20,fontFamily:'sans-serif'}}>
      <h2>Chat (stub)</h2>
      <textarea value={q} onChange={e=>setQ(e.target.value)} rows={6} cols={80} />
      <br/>
      <button onClick={send}>Send</button>
      <pre style={{whiteSpace:'pre-wrap'}}>{out}</pre>
    </div>
  )
}
