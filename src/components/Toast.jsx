import React, { useEffect } from 'react'

export default function Toast({ show, message, type = 'info', onClose }){
  useEffect(()=>{ if(!show) return; const t = setTimeout(onClose, 3000); return ()=>clearTimeout(t) }, [show])
  if(!show) return null
  return (
    <div className={`fixed right-4 top-6 z-50 max-w-sm w-full px-4 py-3 rounded shadow-lg ${type==='success' ? 'bg-green-50 text-green-800' : type==='error' ? 'bg-red-50 text-red-800' : 'bg-white text-gray-800'}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 text-sm">{message}</div>
        <button onClick={onClose} className="text-sm opacity-70">Close</button>
      </div>
    </div>
  )
}
