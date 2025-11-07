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
  const [activeTab, setActiveTab] = useState('my') // 'my' | 'group' | 'custom'
  useEffect(()=>{
    if (!user) return
    ;(async ()=> {
      try {
        // load users first so we can map assignee ids -> names when normalizing tasks
        const us = await api.getUsers()
        setUsers(us)
        const raw = await api.getTasks()
        
        const normalized = raw.map(t => {
          // Gather all possible assignees
          const assignees = [
            ...(t.assignees || []),
            ...(t.task_members || []),
            ...(t.assignee ? [t.assignee] : [])
          ].filter((id, index, self) => self.indexOf(id) === index) // Remove duplicates
          
          const assigneeNames = assignees.map(id => us.find(u => u.id === id)?.name || id).filter(Boolean).join(', ')
          
          // Determine task type with proper fallbacks
          let taskType = t.taskType
          if (!taskType) {
            if (assignees.length > 1) {
              taskType = 'group'
            } else {
              taskType = 'individual'
            }
          }
          
          console.log('Processing task:', {
            id: t.id,
            title: t.title,
            type: taskType,
            assignees,
            userId: user.id,
            isAssigned: assignees.includes(user.id)
          })
          
          return {
            ...t,
            assignees,
            assigneeNames,
            taskType
          }
        })
        
        setTasks(normalized)
        console.log('Total tasks loaded:', normalized.length)
      } catch (error) {
        console.error('Error loading tasks:', error)
      }
    })()
  }, [user])

  // Filter tasks based on user's involvement with improved logging
  const userTasks = tasks.filter(t => {
    // Check all possible ways a user could be assigned
    const isAssigned = [
      t.assignee === user?.id,                           // Direct assignee
      t.assignees?.includes(user?.id),                   // In assignees array
      t.task_members?.includes(user?.id),                // In task_members array
      t.created_by === user?.id                          // Created by user
    ].some(Boolean)

    console.log('Task visibility check:', {
      taskId: t.id,
      title: t.title,
      type: t.taskType,
      isAssigned,
      userId: user?.id,
      assignee: t.assignee,
      assignees: t.assignees,
      taskMembers: t.task_members
    })

    return isAssigned
  })

  console.log('Filtered user tasks:', userTasks.length)

  // Separate tasks by type with logging
  const individualTasks = userTasks.filter(t => {
    const isIndividual = t.taskType === 'individual' || !t.taskType
    console.log('Individual task check:', { taskId: t.id, type: t.taskType, isIndividual })
    return isIndividual
  })

  const groupTasks = userTasks.filter(t => {
    const isGroup = t.taskType === 'group'
    console.log('Group task check:', { taskId: t.id, type: t.taskType, isGroup })
    return isGroup
  })

  const customTasks = userTasks.filter(t => {
    const isCustom = t.taskType === 'custom'
    console.log('Custom task check:', { taskId: t.id, type: t.taskType, isCustom })
    return isCustom
  })

  console.log('Task counts:', {
    individual: individualTasks.length,
    group: groupTasks.length,
    custom: customTasks.length
  })

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
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white tracking-tight">Tasks</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('my')}
                className={`px-3 py-1 rounded ${activeTab === 'my' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border'}`}>
                Individual Tasks
              </button>
              <button
                onClick={() => setActiveTab('group')}
                className={`px-3 py-1 rounded ${activeTab === 'group' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border'}`}>
                Group Tasks
              </button>
              <button
                onClick={() => setActiveTab('custom')}
                className={`px-3 py-1 rounded ${activeTab === 'custom' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border'}`}>
                Custom Tasks
              </button>
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">View and manage your individual, group, and custom tasks.</p>

          <div className="space-y-8">
            {activeTab === 'my' && (
              <div>
                <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
                  Individual Tasks ({individualTasks.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {individualTasks.length === 0 ? (
                    <div className="col-span-full text-center text-gray-400 py-8 text-lg">No individual tasks assigned to you.</div>
                  ) : (
                    individualTasks.map(t => (
                      <div key={t.id} className="cursor-pointer bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow" onClick={() => setSelectedTask(t)}>
                        <TaskCard 
                          task={t} 
                          onUpdate={onUpdate} 
                          onDelete={onDelete} 
                          onComment={onComment}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'group' && (
              <div>
                <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
                  Group Tasks ({groupTasks.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {groupTasks.length === 0 ? (
                    <div className="col-span-full text-center text-gray-400 py-8 text-lg">No group tasks assigned to you.</div>
                  ) : (
                    groupTasks.map(t => (
                      <div key={t.id} className="cursor-pointer bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow" onClick={() => setSelectedTask(t)}>
                        <TaskCard 
                          task={t} 
                          onUpdate={onUpdate} 
                          onDelete={onDelete} 
                          onComment={onComment}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'custom' && (
              <div>
                <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
                  Custom Tasks ({customTasks.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {customTasks.length === 0 ? (
                    <div className="col-span-full text-center text-gray-400 py-8 text-lg">No custom tasks assigned to you.</div>
                  ) : (
                    customTasks.map(t => (
                      <div key={t.id} className="cursor-pointer bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow" onClick={() => setSelectedTask(t)}>
                        <TaskCard 
                          task={t} 
                          onUpdate={onUpdate} 
                          onDelete={onDelete} 
                          onComment={onComment}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
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
