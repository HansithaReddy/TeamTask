import React, { useEffect, useState } from 'react'
import useAuth from '../hooks/useAuth'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import TaskCardSimple from '../components/TaskCardSimple'
import TaskDialog from '../components/TaskDialog'
import api from '../services/api.firebase'
import { motion } from 'framer-motion'

export default function Dashboard(){
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')

  useEffect(()=>{
    let unsub
    ;(async ()=>{
      const us = await api.getUsers()
      const map = {}
      us.forEach(u=> map[u.id]=u.name)
      unsub = api.onTasksChanged(items => setTasks(items.map(it=> ({ ...it, assigneeName: it.assigneeName || map[it.assignee] || it.assignee }))))
    })()
    return () => unsub && unsub()
  }, [])

  const visible = user?.role==='admin' ? tasks : tasks.filter(t => t.assignee === user?.id)
  const filtered = visible
    .filter(t => search ? (t.title || '').toString().toLowerCase().includes(search.toLowerCase()) : true)
    .filter(t => statusFilter === 'All' ? true : (t.status || '').toString() === statusFilter)
    .filter(t => {
      if (priorityFilter === 'All') return true
      const taskPri = (t.priority || '').toString().toLowerCase()
      const selPri = priorityFilter.toString().toLowerCase()
      return taskPri === selPri
    })

  const dueTasks = visible.filter(t => t.status !== 'Done' && new Date(t.due) < new Date()).length
  const completedTasks = visible.filter(t => t.status === 'Done').length

  const onUpdate = (updated) => setTasks(prev => prev.map(p=> p.id===updated.id? updated: p))
  const onDelete = async (id) => { await api.deleteTask(id); setTasks(prev => prev.filter(p=>p.id!==id)) }
  const onComment = (taskId, c) => setTasks(prev => prev.map(p => p.id===taskId? {...p, comments:[...(p.comments||[]), c]}: p))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <motion.div 
            initial={{ opacity: 0, y: 6 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: .36 }} 
            className="mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm text-gray-500 dark:text-gray-400">Due Tasks</h4>
                  <div className="text-2xl font-semibold text-red-600 dark:text-red-400 mt-1">{dueTasks}</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="card p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm text-gray-500 dark:text-gray-400">Completed Tasks</h4>
                  <div className="text-2xl font-semibold text-green-600 dark:text-green-400 mt-1">{completedTasks}</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Tasks</h3>
            <div className="flex gap-3 items-center">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search tasks..."
                  className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)} 
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="All">All</option>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>

              <select 
                value={priorityFilter} 
                onChange={e => setPriorityFilter(e.target.value)} 
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="All">All</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>

              <button
                type="button"
                onClick={() => { setSearch(''); setStatusFilter('All'); setPriorityFilter('All') }}
                className="ml-2 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                Clear
              </button>

              <div className="ml-4 text-sm text-muted">Showing {filtered.length} tasks</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(t => (
              <TaskCardSimple 
                key={t.id} 
                task={t} 
                onClick={() => setSelectedTask(t)} 
              />
            ))}
          </div>
        </main>
          {selectedTask && (
            <TaskDialog
              task={selectedTask}
              onClose={() => setSelectedTask(null)}
              onUpdate={task => {
                onUpdate(task);
                setSelectedTask(task);
              }}
              onDelete={id => {
                onDelete(id);
                setSelectedTask(null);
              }}
              onComment={onComment}
            />
          )}
      </div>
    </div>
  )
}
