import React, { useEffect, useState } from 'react'
import useAuth from '../hooks/useAuth'
import api from '../services/api.firebase'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import Toast from '../components/Toast'
import { CompletionPie, ActivityLine, TaskProgressBar } from '../components/ChartAnalytics'

export default function Analytics(){
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [activities, setActivities] = useState([])
  const [users, setUsers] = useState([])
  const [toast, setToast] = useState({ show:false, message:'', type: 'success' })
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let mounted = true
    if (!user) return () => { mounted = false }
    ;(async ()=>{
      try{
        const [t, a, u] = await Promise.all([api.getTasks(user.groupId), api.getActivity(), api.getUsers(user.groupId)])
        if(!mounted) return
        setTasks(t)
        setActivities(a)
        setUsers(u)
      }catch(e){
        console.error(e)
        setToast({ show:true, message: e.message || 'Failed to load analytics', type: 'error' })
      }finally{
        if(mounted) setLoading(false)
      }
    })()
    return ()=> mounted = false
  }, [user])

  // compute metrics
  // For admin: all tasks, for user: only their tasks
  const isAdmin = user?.role === 'admin'
  const visibleTasks = isAdmin ? tasks : tasks.filter(t => t.assignee === user?.id || (t.assignees||[]).includes(user?.id) || t.createdBy === user?.id)
  const total = visibleTasks.length
  const done = visibleTasks.filter(t => t.status === 'Done').length
  const inProgress = visibleTasks.filter(t => t.status === 'In Progress').length
  const todo = visibleTasks.filter(t => t.status === 'To Do').length
  const completionRate = total ? Math.round((done/total)*100) : 0

  // tasks per priority
  const byPriority = { low:0, medium:0, high:0 }
  visibleTasks.forEach(t => byPriority[t.priority||'medium'] = (byPriority[t.priority||'medium']||0)+1)

  // top performing users (by tasks completed before due date)
  const userPerformance = {}
  tasks.forEach(task => {
    if (task.status === 'Done' && task.dueDate) {
      const completionDate = task.completedAt ? 
        new Date(task.completedAt?.seconds ? task.completedAt.seconds * 1000 : task.completedAt) :
        new Date()
      const dueDate = new Date(task.dueDate?.seconds ? task.dueDate.seconds * 1000 : task.dueDate)
      
      // Check if task was completed before or on due date
      if (completionDate <= dueDate) {
        const assigneeId = task.assignee || (task.assignees || [])[0]
        if (assigneeId) {
          userPerformance[assigneeId] = userPerformance[assigneeId] || { onTimeCount: 0, totalCount: 0 }
          userPerformance[assigneeId].onTimeCount++
        }
      }
      // Track total completed tasks
      if (task.assignee) {
        userPerformance[task.assignee] = userPerformance[task.assignee] || { onTimeCount: 0, totalCount: 0 }
        userPerformance[task.assignee].totalCount++
      }
      ;(task.assignees || []).forEach(assigneeId => {
        userPerformance[assigneeId] = userPerformance[assigneeId] || { onTimeCount: 0, totalCount: 0 }
        userPerformance[assigneeId].totalCount++
      })
    }
  })

  const topUsers = Object.entries(userPerformance)
    .map(([id, stats]) => ({
      id,
      name: users.find(u => u.id === id)?.name || id,
      onTimeCount: stats.onTimeCount,
      totalCount: stats.totalCount,
      onTimeRate: stats.totalCount > 0 ? (stats.onTimeCount / stats.totalCount) * 100 : 0
    }))
    .sort((a, b) => b.onTimeCount - a.onTimeCount || b.onTimeRate - a.onTimeRate)
    .slice(0, 5)

  // user-specific metrics
  // For user-specific metrics (used in user view only)
  const myTasks = visibleTasks
  const myDone = myTasks.filter(t => t.status === 'Done').length
  const myCompletionRate = myTasks.length ? Math.round((myDone/myTasks.length)*100) : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={()=>setToast({show:false,message:'',type:toast.type})} />
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <h2 className="text-xl font-semibold">Analytics</h2>
          <p className="text-sm text-gray-500 mt-1 mb-6">Overview of task and user activity{user?.role === 'admin' ? ' (admin view)' : ' (your activity)'}</p>

          {loading ? (
            <div className="p-6 bg-white dark:bg-gray-800 rounded shadow text-sm">Loading analytics...</div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
                  <div className="text-xs text-gray-500">{isAdmin ? 'Total tasks' : 'Your tasks'}</div>
                  <div className="text-2xl font-bold">{total}</div>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
                  <div className="text-xs text-gray-500">Completed</div>
                  <div className="text-2xl font-bold">{done} <span className="text-sm text-gray-400">({completionRate}%)</span></div>
                </div>
                {!isAdmin && (
                  <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
                    <div className="text-xs text-gray-500">Your completion</div>
                    <div className="text-2xl font-bold">{myCompletionRate}%</div>
                    <div className="text-xs text-gray-400">({myTasks.length} tasks)</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
                  <h3 className="text-sm font-medium mb-2">
                    {user?.role === 'admin' ? 'Overall Task Completion Status' : 'Your Task Completion Status'}
                  </h3>
                  <CompletionPie tasks={visibleTasks} />
                </div>


                <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
                  <h3 className="text-sm font-medium mb-2">
                    {user?.role === 'admin' ? 'Task Progress Over Time' : 'Your Task Progress Over Time'}
                  </h3>
                  <TaskProgressBar tasks={visibleTasks} />
                </div>

                {isAdmin && (
                  <div className="col-span-2 p-4 bg-white dark:bg-gray-800 rounded shadow">
                    <h3 className="text-sm font-medium mb-2">Top Performing Users</h3>
                    <ul className="space-y-2">
                      {topUsers.map(u => (
                        <li key={u.id} className="flex items-center justify-between">
                          <div className="text-sm">{u.name}</div>
                          <div className="text-sm">
                            <span className="font-medium text-emerald-600">{u.onTimeCount}</span>
                            <span className="text-gray-500"> tasks completed on time</span>
                          </div>
                        </li>
                      ))}
                      {topUsers.length === 0 && <li className="text-sm text-gray-500">No completed tasks yet</li>}
                    </ul>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
                  <div className="text-xs text-gray-500">{isAdmin ? 'Total To Do' : 'Your To Do Tasks'}</div>
                  <div className="text-lg font-bold">{todo}</div>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
                  <div className="text-xs text-gray-500">{isAdmin ? 'Total In Progress' : 'Your In Progress'}</div>
                  <div className="text-lg font-bold">{inProgress}</div>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
                  <div className="text-xs text-gray-500">{isAdmin ? 'Total High Priority' : 'Your High Priority'}</div>
                  <div className="text-lg font-bold">{byPriority.high}</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
