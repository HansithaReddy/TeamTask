import React, { useState } from 'react'
import api from '../services/api.firebase'
import useAuth from '../hooks/useAuth'
import { motion } from 'framer-motion'

export default function TaskCard({ task, onUpdate, onDelete, onComment }){
  const { user } = useAuth()
  const [comment, setComment] = useState('')

  const canEdit = user?.role === 'admin' || task.assignee === user?.id

  const changeStatus = async (newStatus) => {
    const updated = await api.updateTask(task.id, { status: newStatus })
    onUpdate(updated)
  }
  const addComment = async () => {
    if(!comment) return
    const c = await api.addComment(task.id, { text: comment, authorId: user.id })
    setComment('')
    onComment(task.id, c)
  }

  return (
    <motion.div 
      whileHover={{ y: -8, boxShadow: '0 8px 32px 0 rgba(31, 41, 55, 0.15)' }}
      className="card p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-md hover:shadow-xl transition-all duration-200 group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{task.title}</h3>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold tracking-wide uppercase shadow-sm border ${
              task.priority==='high'? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700' : 
              task.priority==='medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700' : 
              'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
            }`}>{task.priority}</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-2 line-clamp-3">{task.desc}</p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Due: {task.due? new Date(task.due).toLocaleDateString() : '—'}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Assigned by: {task.assignedBy || 'Unknown'}</span>
            </div>

          </div>
        </div>
        <div className="flex flex-col items-end gap-2 min-w-[120px]">
          {canEdit && (
            <div className="flex gap-2 mb-2">
              {['To Do','In Progress','Done'].map(s=> (
                <button 
                  key={s} 
                  onClick={()=>changeStatus(s)} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-sm ${
                    task.status === s 
                      ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Comments</div>
        <div className="space-y-2 max-h-32 overflow-auto pr-2 custom-scrollbar">
          {(task.comments||[]).map(c=> (
            <div key={c.id} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs">{c.text}</p>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {new Date(c.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
        {task.assignee === user?.id && (
          <div className="mt-3 flex gap-2">
            <input 
              value={comment} 
              onChange={e=>setComment(e.target.value)} 
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-xs" 
              placeholder="Add a comment..." 
            />
            <button 
              onClick={addComment} 
              className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-xs"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {user?.role === 'admin' && (
        <div className="mt-3 flex gap-2">
          <button onClick={() => onDelete(task.id)} className="px-3 py-1 rounded bg-red-500 text-white text-xs">Delete</button>
        </div>
      )}
    </motion.div>
  )
}
