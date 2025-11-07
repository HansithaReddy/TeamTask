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
      unsub = api.onTasksChanged(items => setTasks(items.map(it=> {
        const assignees = it.assignees || it.task_members || (it.assignee ? [it.assignee] : [])
        const assigneeNames = (assignees || []).map(id => map[id] || id).filter(Boolean).join(', ')
        const taskType = it.taskType || (assignees && assignees.length > 1 ? 'group' : 'individual')
        return {
          ...it,
          assignees,
          assigneeNames,
          taskType,
          assigneeName: it.assigneeName || map[it.assignee] || it.assignee
        }
      })))
    })()
    return () => unsub && unsub()
  }, [])

  const visible = user?.role === 'admin' 
    ? tasks 
    : tasks.filter(t => {
        // Check if user is assignee or part of assignees array
        const isAssigned = t.assignee === user?.id || (t.assignees && t.assignees.includes(user?.id))
        // For group tasks, check if user is in task_members
        const isGroupMember = t.task_members && t.task_members.includes(user?.id)
        return isAssigned || isGroupMember
      })

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Individual Tasks Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col min-h-[120px] h-fit">
              <h3 className="text-lg font-medium p-4 flex items-center gap-2 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-t-lg border-b border-gray-100 dark:border-gray-700 z-10">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Individual Tasks
                <span className="text-sm text-gray-500">({filtered.filter(t => t.taskType === 'individual').length})</span>
              </h3>
              <div className={`flex-1 px-4 py-2 space-y-4 ${filtered.filter(t => t.taskType === 'individual').length > 2 ? 'max-h-[400px] overflow-y-auto custom-scrollbar pr-2' : ''}`}>
                {filtered.filter(t => t.taskType === 'individual').map((t, i) => (
                  <div key={t.id} className="animate-fade-in">
                    <TaskCardSimple 
                      task={t} 
                      onClick={() => setSelectedTask(t)} 
                    />
                  </div>
                ))}
                {filtered.filter(t => t.taskType === 'individual').length === 0 && (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                    No individual tasks found
                  </div>
                )}
              </div>
            </div>

            {/* Group Tasks Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col min-h-[120px] h-fit">
              <h3 className="text-lg font-medium p-4 flex items-center gap-2 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-t-lg border-b border-gray-100 dark:border-gray-700 z-10">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Group Tasks
                <span className="text-sm text-gray-500">({filtered.filter(t => t.taskType === 'group').length})</span>
              </h3>
              <div className={`flex-1 px-4 py-2 space-y-4 ${filtered.filter(t => t.taskType === 'group').length > 2 ? 'max-h-[400px] overflow-y-auto custom-scrollbar pr-2' : ''}`}>
                {filtered.filter(t => t.taskType === 'group').map((t, i) => (
                  <div key={t.id} className="animate-fade-in">
                    <TaskCardSimple 
                      task={t} 
                      onClick={() => setSelectedTask(t)} 
                    />
                  </div>
                ))}
                {filtered.filter(t => t.taskType === 'group').length === 0 && (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                    No group tasks found
                  </div>
                )}
              </div>
            </div>

            {/* Custom Tasks Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col min-h-[120px] h-fit">
              <h3 className="text-lg font-medium p-4 flex items-center gap-2 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-t-lg border-b border-gray-100 dark:border-gray-700 z-10">
                <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Custom Tasks
                <span className="text-sm text-gray-500">({filtered.filter(t => t.taskType === 'custom').length})</span>
              </h3>
              <div className={`flex-1 px-4 py-2 space-y-4 ${filtered.filter(t => t.taskType === 'custom').length > 2 ? 'max-h-[400px] overflow-y-auto custom-scrollbar pr-2' : ''}`}>
                {filtered.filter(t => t.taskType === 'custom').map((t, i) => (
                  <div key={t.id} className="animate-fade-in">
                    <TaskCardSimple 
                      task={t} 
                      onClick={() => setSelectedTask(t)} 
                    />
                  </div>
                ))}
                {filtered.filter(t => t.taskType === 'custom').length === 0 && (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                    No custom tasks found
                  </div>
                )}
              </div>
            </div>
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
