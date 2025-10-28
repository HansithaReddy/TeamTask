import React, { useEffect, useState } from 'react'
import useAuth from '../hooks/useAuth'
import api from '../services/api.firebase'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import TaskCard from '../components/TaskCard'
import TaskDialog from '../components/TaskDialog'

export default function UserTasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  useEffect(()=>{ (async ()=> {
    setTasks(await api.getTasks())
    setUsers(await api.getUsers())
  })() }, [])

  const my = tasks.filter(t=> t.assignee === user.id)
  const onUpdate = (u) => setTasks(prev => prev.map(p=> p.id===u.id? u : p))
  const onDelete = async id => { await api.deleteTask(id); setTasks(prev => prev.filter(p=>p.id!==id)) }
  const onComment = (taskId, c) => setTasks(prev => prev.map(p => p.id===taskId? {...p, comments:[...(p.comments||[]), c]}: p))

  const [selectedTask, setSelectedTask] = useState(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white tracking-tight">My Tasks</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">All tasks assigned to you. Click a card for details and actions.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2">
            {my.length === 0 ? (
              <div className="col-span-full text-center text-gray-400 py-16 text-lg">No tasks assigned to you yet.</div>
            ) : (
              my.map(t => {
                const assigneeUser = users.find(u => u.id === t.assignee)
                return (
                  <div key={t.id} className="cursor-pointer" onClick={() => setSelectedTask(t)}>
                    <TaskCard task={{...t, assigneeName: assigneeUser ? assigneeUser.name : t.assignee}} onUpdate={onUpdate} onDelete={onDelete} onComment={onComment} />
                  </div>
                )
              })
            )}
          </div>
          {selectedTask && (
            <TaskDialog
              task={selectedTask}
              onClose={() => setSelectedTask(null)}
              onUpdate={u => { onUpdate(u); setSelectedTask(null); }}
              onComment={onComment}
            />
          )}
        </main>
      </div>
    </div>
  )
}
