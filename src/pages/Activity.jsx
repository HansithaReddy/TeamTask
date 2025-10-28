import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import Toast from '../components/Toast'
import api from '../services/api.firebase'
import useAuth from '../hooks/useAuth'

export default function Activity(){
  const { user } = useAuth()
  const [activities, setActivities] = useState([])
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [usersMap, setUsersMap] = useState({})

  useEffect(()=>{
    let mounted = true
    ;(async ()=>{
      try {
        const [items, users] = await Promise.all([api.getActivity(), api.getUsers()])
        if (!mounted) return

        // build users map for quick lookup
        const map = {}
        users.forEach(u => { map[u.id] = u })
        setUsersMap(map)

        // filter items for non-admin users: show only entries related to the user
        const filtered = (user?.role === 'admin') ? items : items.filter(a => {
          // match by explicit fields
          if (a.userId && a.userId === user?.id) return true
          if (a.createdBy && a.createdBy === user?.id) return true
          const meta = a.meta || {}
          // meta may include email, assignees array, authorId, taskId etc.
          if (meta.email && user?.email && meta.email.toLowerCase() === user.email.toLowerCase()) return true
          if (Array.isArray(meta.assignees) && meta.assignees.includes(user?.id)) return true
          if (meta.assignee && meta.assignee === user?.id) return true
          if (meta.authorId && meta.authorId === user?.id) return true
          if (a.taskId && Array.isArray(meta.assignees) && meta.assignees.includes(user?.id)) return true
          return false
        })

        setActivities(filtered)
      } catch (e) {
        console.error(e)
        setToast({ show: true, message: e.message || 'Failed to load activity', type: 'error' })
      }
    })()
    return ()=>{ mounted = false }
  }, [user])

  const renderMessage = (a) => {
    const meta = a.meta || {}
    const actor = usersMap[a.createdBy]?.name || a.createdBy
    switch(a.action){
      case 'create-user': return `${actor ? actor + ' — ' : ''}New user \"${meta.name || meta.email || a.userId}\" was created`;
      case 'delete-user': return `${actor ? actor + ' — ' : ''}User \"${meta.name || a.userId}\" was deleted`;
      case 'create': return `${actor ? actor + ' — ' : ''}Task \"${meta.title || meta.id || a.taskId}\" was created`;
      case 'update': return `${actor ? actor + ' — ' : ''}Task \"${meta.title || a.taskId}\" was updated`;
      case 'delete': return `${actor ? actor + ' — ' : ''}Task \"${meta.title || a.taskId}\" was deleted`;
      case 'comment': return `${actor ? actor + ' — ' : ''}Comment added to task ${a.taskId}`;
      default: return `${actor ? actor + ' — ' : ''}${a.action || 'Activity'}`
    }
  }

  const fmt = (ts) => {
    if (!ts) return ''
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts)
      return d.toLocaleString()
    } catch (e) {
      return String(ts)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={()=>setToast({show:false,message:'',type:toast.type})} />
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <h2 className="text-xl font-semibold">Activity Log</h2>
          <p className="text-sm text-gray-500 mt-1 mb-4">Recent actions across the app (tasks, users, comments)</p>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {activities.length === 0 && (
                <li className="p-4 text-sm text-gray-500">No recent activity</li>
              )}
              {activities.map(a => (
                <li key={a.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm text-gray-900 dark:text-gray-100">{renderMessage(a)}</div>
                      {a.meta && a.meta.name && (
                        <div className="text-xs text-gray-500">Details: {JSON.stringify(a.meta)}</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">{fmt(a.timestamp)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </main>
      </div>
    </div>
  )
}
