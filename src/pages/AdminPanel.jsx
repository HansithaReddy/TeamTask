import React, { useEffect, useState, useMemo } from 'react'
import useAuth from '../hooks/useAuth'
import api from '../services/api.firebase'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import Toast from '../components/Toast'

export default function AdminPanel(){
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [tasks, setTasks] = useState([])
  const [activity, setActivity] = useState([])
  const [form, setForm] = useState({ title:'', desc:'', assignee:'', due: '', priority: 'medium' })
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'user' })
  const [error, setError] = useState('')
  const [selected, setSelected] = useState([])
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [showAddUser, setShowAddUser] = useState(false)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState('desc')
  const [assignTo, setAssignTo] = useState('')
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false)
  const [editing, setEditing] = useState({})

  useEffect(()=>{
    let unsub
    ;(async ()=>{
      const us = await api.getUsers()
      setUsers(us)
      setActivity(await api.getActivity())
      // subscribe to real-time tasks updates so admin edits propagate to users
      unsub = api.onTasksChanged(items => setTasks(items.map(it => ({ 
        ...it,
        // Convert old single assignee to array if needed
        assignees: it.assignees || (it.assignee ? [it.assignee] : []),
        // Map assignee IDs to names
        assigneeNames: (it.assignees || [it.assignee]).map(id => us.find(u => u.id === id)?.name || '').filter(Boolean).join(', ')
      }))))
    })()
    return () => { if (unsub) unsub() }
  }, [])

  const create = async () => {
    setError('')
    if (!form.title || !form.assignee) {
      setError('Please provide a title and select an assignee.')
      return
    }
    try {
      const assigneeProfile = users.find(u => u.id === form.assignee)
      const assigneeName = assigneeProfile ? assigneeProfile.name : ''
      const payload = {
        ...form,
        status: 'To Do',
        createdBy: user.id,
        assignedBy: user.name,
        assigneeName,
        assignee: form.assignee,
        assigneeEmail: assigneeProfile?.email || ''
      }
      const t = await api.createTask(payload)
      setTasks(prev => [{ id: t.id, ...payload }, ...prev])
      setToast({ show: true, message: 'Task created', type: 'success' })
      setForm({ title:'', desc:'', assignee:'', due: '', priority: 'medium' })
    } catch (e) {
      console.error(e)
      setError(e.message || 'Failed to create task')
    }
  }

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  }

  const deleteSelected = async () => {
    if (!selected.length) return
    if (!confirm(`Delete ${selected.length} tasks?`)) return
    await Promise.all(selected.map(id => api.deleteTask(id)))
    setTasks(prev => prev.filter(t=>!selected.includes(t.id)))
    setSelected([])
    setToast({ show: true, message: 'Deleted selected tasks', type: 'success' })
  }

  const updateTask = async (id) => {
    try {
      const task = editing[id]
      if (!task) return
      const assigneeNames = task.assignees.map(id => users.find(u => u.id === id)?.name || '').filter(Boolean).join(', ')
      await api.updateTask(id, { ...task, assigneeNames })
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...task, assigneeNames } : t))
      setEditing(prev => ({ ...prev, [id]: undefined }))
      setToast({ show: true, message: 'Task updated', type: 'success' })
    } catch (e) {
      console.error(e)
      setToast({ show: true, message: e.message || 'Failed to update task', type: 'error' })
    }
  }

  const createUser = async () => {
    try {
      if (!userForm.name || !userForm.email) {
        setError('Please provide name and email')
        return
      }
      await api.createUser({ ...userForm })
      const updatedUsers = await api.getUsers()
      setUsers(updatedUsers)
      setUserForm({ name: '', email: '', role: 'user' })
      setShowAddUser(false)
      setToast({ show: true, message: 'User created successfully', type: 'success' })
    } catch (e) {
      console.error(e)
      setToast({ show: true, message: e.message || 'Failed to create user', type: 'error' })
    }
  }

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      await api.deleteUser(userId)
      setUsers(prev => prev.filter(u => u.id !== userId))
      setToast({ show: true, message: 'User deleted successfully', type: 'success' })
    } catch (e) {
      console.error(e)
      setToast({ show: true, message: e.message || 'Failed to delete user', type: 'error' })
    }
  }


  const exportCSV = (onlySelected = false) => {
    const rows = (onlySelected ? tasks.filter(t=>selected.includes(t.id)) : tasks)
    if (!rows.length) { setToast({ show: true, message: 'No tasks to export', type: 'error' }); return }
    const headers = ['id','title','assignee','assigneeName','due','priority','status','createdBy','assignedBy']
    const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => `"${(r[h]||'').toString().replace(/"/g,'""')}"`).join(','))).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tasks-${onlySelected? 'selected' : 'all' }.csv`
    a.click()
    URL.revokeObjectURL(url)
    setToast({ show: true, message: 'CSV exported', type: 'success' })
  }

  const bulkAssign = async () => {
    if (!selected.length) { setToast({ show: true, message: 'No tasks selected', type: 'error' }); return }
    if (!assignTo) { setToast({ show: true, message: 'Select a user to assign', type: 'error' }); return }
    const ass = users.find(u=>u.id===assignTo)
    await Promise.all(selected.map(id => api.updateTask(id, { assignee: assignTo, assigneeName: ass?.name || '' })))
    // notify new assignee
    if (ass?.email) api.notifyAssignee(ass.email, { info: 'bulk assigned', ids: selected })
    setToast({ show: true, message: 'Assigned selected tasks', type: 'success' })
    setSelected([])
  }

  const changeSort = (col) => {
    if (sortBy === col) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  const sortedTasks = useMemo(() => {
    const sorted = [...tasks].sort((a,b)=>{
      const av = (a[sortBy]||'')
      const bv = (b[sortBy]||'')
      if (sortBy === 'due' || sortBy === 'createdAt'){
        const ad = a[sortBy] ? new Date(a[sortBy]) : 0
        const bd = b[sortBy] ? new Date(b[sortBy]) : 0
        return sortDir==='asc' ? ad - bd : bd - ad
      }
      const as = av.toString().toLowerCase()
      const bs = bv.toString().toLowerCase()
      if (as < bs) return sortDir==='asc' ? -1 : 1
      if (as > bs) return sortDir==='asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [tasks, sortBy, sortDir])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={()=>setToast({show:false,message:'',type:toast.type})} />
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <h2 className="text-xl font-semibold">Admin Panel</h2>
          <div className="mt-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Task</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add a new task and assign it to team members</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Task Title
                </label>
                <input
                  value={form.title}
                  onChange={e=>setForm({...form, title: e.target.value})}
                  placeholder="Enter task title"
                  className="w-full p-3 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assignee
                </label>
                <select
                  value={form.assignee || ''}
                  onChange={e => setForm({ ...form, assignee: e.target.value })}
                  className="w-full p-3 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-shadow"
                >
                  <option value="">Select assignee</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={form.desc}
                  onChange={e=>setForm({...form, desc: e.target.value})}
                  placeholder="Enter task description"
                  rows={4}
                  className="w-full p-3 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-shadow resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Due Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={form.due}
                  onChange={e=>setForm({...form, due: e.target.value})}
                  className="w-full p-3 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <div className="relative">
                  <select
                    value={form.priority}
                    onChange={e=>setForm({...form, priority: e.target.value})}
                    className="w-full p-3 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-shadow appearance-none"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>

              {error && (
                <div className="lg:col-span-2 text-sm text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-950/50 px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <div className="lg:col-span-2">
                <button
                  type="button"
                  onClick={e => { e.preventDefault(); create(); }}
                  disabled={!form.title || !form.assignee}
                  className="px-6 py-3 text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  Create Task
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2 gap-4">
              <h3 className="text-lg font-medium">All Tasks</h3>
              <div className="flex items-center gap-2">
                <select value={assignTo} onChange={e=>setAssignTo(e.target.value)} className="p-2 rounded border">
                  <option value="">Assign selected to...</option>
                  {users.map(u=> <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <button onClick={bulkAssign} className="px-3 py-1 rounded bg-blue-100 text-blue-700">Assign</button>
                <button onClick={()=>exportCSV(false)} className="px-3 py-1 rounded border">Export CSV</button>
                <button onClick={()=>exportCSV(true)} className="px-3 py-1 rounded border">Export selected CSV</button>
                <button onClick={deleteSelected} className="px-3 py-1 rounded bg-red-100 text-red-700">Delete selected</button>
                <div className="text-sm text-muted">{tasks.length} total</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full table-auto text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="p-2 w-12"> <input type="checkbox" onChange={e=> setSelected(e.target.checked ? tasks.map(t=>t.id) : [])} checked={selected.length===tasks.length && tasks.length>0} /> </th>
                    <th className="p-2 w-48 cursor-pointer" onClick={()=>changeSort('title')}>Title {sortBy==='title' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                    <th className="p-2 w-48 cursor-pointer" onClick={()=>changeSort('assignees')}>Assignees {sortBy==='assignees' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                    <th className="p-2 w-56 cursor-pointer" onClick={()=>changeSort('due')}>Due {sortBy==='due' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                    <th className="p-2 w-32 cursor-pointer" onClick={()=>changeSort('priority')}>Priority {sortBy==='priority' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                    <th className="p-2 w-32 cursor-pointer" onClick={()=>changeSort('status')}>Status {sortBy==='status' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                    <th className="p-2 w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTasks.map(t => (
                    <tr key={t.id} className="border-t">
                      <td className="p-2 align-top">
                        <input type="checkbox" checked={selected.includes(t.id)} onChange={()=>toggleSelect(t.id)} />
                      </td>
                      <td className="p-2 align-top">
                        <div className="font-medium">
                          {editing[t.id] ? (
                            <input
                              type="text"
                              value={editing[t.id].title}
                              onChange={e => setEditing(prev => ({
                                ...prev,
                                [t.id]: { ...prev[t.id], title: e.target.value }
                              }))}
                              className="w-full p-1 rounded border"
                            />
                          ) : (
                            t.title
                          )}
                        </div>
                      </td>
                      <td className="p-2 align-top">
                        {editing[t.id] ? (
                          <select
                            value={editing[t.id].assignee || ''}
                            onChange={e => setEditing(prev => ({
                              ...prev,
                              [t.id]: { ...prev[t.id], assignee: e.target.value }
                            }))}
                            className="w-full p-2 rounded border"
                          >
                            <option value="">Unassigned</option>
                            {users.map(user => (
                              <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                          </select>
                        ) : (
                          (() => {
                            const u = users.find(u => u.id === t.assignee)
                            return u ? u.name : <span className="text-gray-400">Unassigned</span>
                          })()
                        )}
                      </td>
                      <td className="p-2 align-top">
                        {editing[t.id] ? (
                          <input
                            type="datetime-local"
                            value={editing[t.id].due || ''}
                            onChange={e => setEditing(prev => ({
                              ...prev,
                              [t.id]: { ...prev[t.id], due: e.target.value }
                            }))}
                            className="p-1 rounded border"
                          />
                        ) : (
                          <div>{t.due ? new Date(t.due).toLocaleString() : '—'}</div>
                        )}
                      </td>
                      <td className="p-2 align-top">
                        {editing[t.id] ? (
                          <select
                            value={editing[t.id].priority || 'medium'}
                            onChange={e => setEditing(prev => ({
                              ...prev,
                              [t.id]: { ...prev[t.id], priority: e.target.value }
                            }))}
                            className="p-1 rounded border"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        ) : (
                          <div className="capitalize">{t.priority}</div>
                        )}
                      </td>
                      <td className="p-2 align-top">
                        {editing[t.id] ? (
                          <select
                            value={editing[t.id].status || 'To Do'}
                            onChange={e => setEditing(prev => ({
                              ...prev,
                              [t.id]: { ...prev[t.id], status: e.target.value }
                            }))}
                            className="p-1 rounded border"
                          >
                            <option>To Do</option>
                            <option>In Progress</option>
                            <option>Done</option>
                          </select>
                        ) : (
                          <div>{t.status}</div>
                        )}
                      </td>
                      <td className="p-2 align-top">
                        <div className="flex space-x-2">
                          {editing[t.id] ? (
                            <>
                              <button
                                onClick={() => updateTask(t.id)}
                                className="p-1 text-green-600 hover:text-green-800"
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setEditing(prev => ({ ...prev, [t.id]: undefined }))}
                                className="p-1 text-gray-600 hover:text-gray-800"
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditing(prev => ({
                                  ...prev,
                                  [t.id]: {
                                    ...t,
                                    showDropdown: false
                                  }
                                }))}
                                className="p-1 text-blue-600 hover:text-blue-800"
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Delete this task?')) {
                                    api.deleteTask(t.id).then(() => {
                                      setTasks(prev => prev.filter(task => task.id !== t.id));
                                      setToast({ show: true, message: 'Task deleted', type: 'success' });
                                    });
                                  }
                                }}
                                className="p-1 text-red-600 hover:text-red-800"
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
