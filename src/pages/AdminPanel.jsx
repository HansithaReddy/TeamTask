import React, { useEffect, useState, useMemo } from 'react'
import useAuth from '../hooks/useAuth'
import api from '../services/api.firebase'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import Toast from '../components/Toast'
import Select from 'react-select'

export default function AdminPanel(){
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [groupsList, setGroupsList] = useState([])
  const [tasks, setTasks] = useState([])
  const [filterType, setFilterType] = useState('all')
  const [activity, setActivity] = useState([])
  const [form, setForm] = useState({ title:'', desc:'', assignee:'', assignees: [], due: '', priority: 'medium', taskType: 'individual', groupId: '' })
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
  // derive available groups (id + name) from groupsList
  const groupOptions = groupsList.map(g => ({ value: g.id, label: g.name || g.id }))

  useEffect(()=>{
    // Make task and user loading group-aware. Wait for user to be available.
    let unsub
    if (!user) return
    ;(async ()=>{
      const us = await api.getUsers()  // Remove groupId filter for admin panel
      console.log('Loaded users:', us)  // Debug log
      setUsers(us)
      // load groups so we can show group names instead of ids
      try{
        const gl = await api.getGroups()
        setGroupsList(gl)
      }catch(e){ console.warn('Could not load groups', e) }
      // initialize form.groupId from current user or available users
      setForm(prev => ({ ...prev, groupId: prev.groupId || user?.groupId || (us[0]?.groupId || '') }))
      setActivity(await api.getActivity())
      // subscribe to real-time tasks updates so admin edits propagate to users
      // Admins should see all tasks; regular users see only their group
      if (user && user.role === 'admin') {
        unsub = api.onTasksChanged(items => setTasks(items.map(it => ({ 
          ...it,
          taskType: it.taskType || 'individual', // ensure taskType exists for filtering
          assignees: it.assignees || (it.assignee ? [it.assignee] : []),
          assigneeNames: (it.assignees || [it.assignee]).map(id => us.find(u => u.id === id)?.name || '').filter(Boolean).join(', ')
        }))))
      } else {
        unsub = api.onTasksChanged(user.groupId, items => setTasks(items.map(it => ({ 
        ...it,
          taskType: it.taskType || 'individual', // ensure taskType exists for filtering
          // Convert old single assignee to array if needed
          assignees: it.assignees || (it.assignee ? [it.assignee] : []),
          // Map assignee IDs to names
          assigneeNames: (it.assignees || [it.assignee]).map(id => us.find(u => u.id === id)?.name || '').filter(Boolean).join(', ')
        }))))
      }
    })()
    return () => { if (unsub) unsub() }
  }, [user])

  const create = async () => {
    setError('')
    if (!form.title) {
      setError('Please provide a title')
      return
    }
    if (!user || !user.groupId) {
      setError('Your account is not associated with a group. Cannot create group-scoped task.')
      return
    }
    try {
      const selectedGroupId = form.groupId || user?.groupId
      let assigneeProfiles
      let assigneeNames
      let assigneeEmails
      if (form.taskType === 'individual') {
        const profile = users.find(u => u.id === form.assignee)
        assigneeProfiles = [profile]
        assigneeNames = profile ? [profile.name] : ['']
        assigneeEmails = profile ? [profile.email] : ['']
      } else if (form.taskType === 'group') {
        // group task: use selected group's member list instead of manual selection
        if (!selectedGroupId) {
          setError('Please select a group for the group task')
          return
        }
        const group = groupsList.find(g => g.id === selectedGroupId)
        const memberIds = (group && group.members) ? group.members : []
        if (memberIds.length < 2) {
          setError('Selected group must have at least 2 members')
          return
        }
        assigneeProfiles = memberIds.map(id => users.find(u => u.id === id)).filter(Boolean)
        assigneeNames = assigneeProfiles.map(p => p.name)
        assigneeEmails = assigneeProfiles.map(p => p.email)
        // set form.assignees for payload
        form.assignees = memberIds
      } else if (form.taskType === 'custom') {
        const memberIds = (form.assignees || [])
        if (!memberIds || memberIds.length < 1) {
          setError('Select at least one user to assign the task')
          return
        }
        assigneeProfiles = memberIds.map(id => users.find(u => u.id === id)).filter(Boolean)
        assigneeNames = assigneeProfiles.map(p => p.name)
        assigneeEmails = assigneeProfiles.map(p => p.email)
      }

      const payload = {
        ...form,
        status: 'To Do',
        createdBy: user.id,
        assignedBy: user.name,
        taskType: form.taskType,
        assigneeNames: assigneeNames.join(', '),
        assignees: form.taskType === 'individual' ? [form.assignee] : form.assignees,
        assigneeEmails,
        groupId: form.taskType === 'group' ? selectedGroupId : null,
        task_members: form.taskType === 'individual' ? [form.assignee] : form.assignees
      }
      
      const t = await api.createTask(payload)
      setTasks(prev => [{ id: t.id, ...payload }, ...prev])
      setToast({ show: true, message: 'Task created', type: 'success' })
  setForm({ title:'', desc:'', assignee:'', assignees: [], due: '', priority: 'medium', taskType: 'individual', groupId: user?.groupId || '' })
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
      
      // Validate assignees depending on task type
      if (task.taskType === 'group' && (!task.assignees || task.assignees.length < 2)) {
        setToast({ show: true, message: 'Group tasks must have at least 2 members', type: 'error' })
        return
      }
      if (task.taskType === 'custom' && (!task.assignees || task.assignees.length < 1)) {
        setToast({ show: true, message: 'Custom tasks must have at least 1 assignee', type: 'error' })
        return
      }
      // For individual tasks, ensure assignee is set
      if (task.taskType === 'individual' && !task.assignee) {
        setToast({ show: true, message: 'Please select an assignee', type: 'error' })
        return
      }

      const assigneeNames = (task.taskType === 'group' || task.taskType === 'custom')
        ? (task.assignees || []).map(id => users.find(u => u.id === id)?.name || '').filter(Boolean).join(', ')
        : users.find(u => u.id === task.assignee)?.name || ''

      const updatePayload = {
        ...task,
        assigneeNames,
        // Ensure task_members is updated for group/custom and individual tasks
        task_members: (task.taskType === 'group' || task.taskType === 'custom') ? task.assignees : [task.assignee]
      }

      await api.updateTask(id, updatePayload)
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updatePayload } : t))
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
    const filtered = filterType && filterType !== 'all' ? tasks.filter(t => (t.taskType || 'individual') === filterType) : tasks
    const sorted = [...filtered].sort((a,b)=>{
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
  }, [tasks, sortBy, sortDir, filterType])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={()=>setToast({show:false,message:'',type:toast.type})} />
      <Navbar />
      <div className="flex flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6">
          <h2 className="text-xl font-semibold">Admin Panel</h2>
          <div className="mt-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Task</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add a new task and assign it to team members</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-4">
              <div className="md:col-span-2">
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
                  Task Type
                </label>
                <select
                  value={form.taskType}
                  onChange={e => setForm({ ...form, taskType: e.target.value, assignees: [], assignee: '' })}
                  className="w-full p-3 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-shadow"
                >
                  <option value="individual">Individual Task</option>
                  <option value="group">Group Task</option>
                  <option value="custom">Custom Assignment</option>
                </select>
              </div>

              {form.taskType === 'group' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Group</label>
                  {groupOptions.length > 0 ? (
                    <select
                      value={form.groupId || ''}
                      onChange={e => setForm(prev => ({ ...prev, groupId: e.target.value }))}
                      className="w-full p-3 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-shadow"
                    >
                      <option value="">Select group</option>
                {groupOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  ) : (
                    <div className="text-sm text-gray-500">No groups detected. Ensure users have a groupId on their profiles.</div>
                  )}
                </div>
              )}

              {form.taskType === 'individual' ? (
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
              ) : null}

              {form.taskType === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assign to Users</label>
                  {console.log('Current users for select:', users)}
                  <Select
                    isMulti
                    value={users.filter(u => (form.assignees || []).includes(u.id)).map(u => ({ value: u.id, label: `${u.name} (${u.email})` }))}
                    onChange={selected => {
                      console.log('Selected users:', selected);
                      setForm({ ...form, assignees: (selected || []).map(s => s.value) });
                    }}
                    options={users.map(u => ({ value: u.id, label: `${u.name} (${u.email})` }))}
                    placeholder="Select users to assign..."
                    className="react-select-container"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base) => ({ 
                        ...base, 
                        minHeight: '40px',
                        backgroundColor: 'var(--bg-input, white)',
                        borderColor: 'var(--border-color, #e2e8f0)',
                      }),
                      menu: (base) => ({ 
                        ...base, 
                        backgroundColor: 'var(--bg-input, white)',
                        zIndex: 50 
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isFocused 
                          ? 'var(--bg-hover, #f7fafc)'
                          : 'transparent',
                        ':active': {
                          backgroundColor: 'var(--bg-active, #edf2f7)'
                        }
                      })
                    }}
                  />
                </div>
              )}

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
                  min={new Date().toISOString().slice(0, 16)}
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
                  disabled={
                    !form.title || (
                      form.taskType === 'individual'
                        ? !form.assignee
                        : form.taskType === 'group'
                          ? !(form.groupId && groupsList.find(g => g.id === form.groupId && (g.members || []).length >= 2))
                          : !(form.assignees && form.assignees.length >= 1)
                    )
                  }
                  className="px-6 py-3 text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  Create Task
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
              <div className="flex items-center justify-between w-full sm:w-auto">
                <h3 className="text-lg font-medium">All Tasks</h3>
                <div className="text-sm text-muted sm:ml-4">{tasks.length} total</div>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 mr-2">Filter</label>
                  <select value={filterType} onChange={e=>setFilterType(e.target.value)} className="p-2 rounded border dark:bg-gray-800 dark:border-gray-700 text-sm">
                    <option value="all">All</option>
                    <option value="individual">Individual</option>
                    <option value="group">Group</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select value={assignTo} onChange={e=>setAssignTo(e.target.value)} className="flex-1 sm:flex-none p-2 text-sm rounded border dark:bg-gray-800 dark:border-gray-700">
                    <option value="">Assign selected to...</option>
                    {users.map(u=> <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  <button onClick={bulkAssign} className="px-3 py-2 text-sm rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50">Assign</button>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="dropdown relative">
                    <button className="px-3 py-2 text-sm rounded border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      Export
                      <span className="ml-1">▼</span>
                    </button>
                    <div className="hidden hover:block focus:block absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white dark:bg-gray-800 border dark:border-gray-700">
                      <button onClick={()=>exportCSV(false)} className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700">Export All Tasks</button>
                      <button onClick={()=>exportCSV(true)} className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700">Export Selected Tasks</button>
                    </div>
                  </div>
                  <button onClick={deleteSelected} className="px-3 py-2 text-sm rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50">Delete Selected</button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
              <table className="w-full table-auto text-sm">
                <thead>
                  <tr className="text-left bg-gray-50 dark:bg-gray-900">
                    <th className="p-2 w-12 sticky left-0 bg-gray-50 dark:bg-gray-900"> 
                      <input type="checkbox" 
                        onChange={e=> setSelected(e.target.checked ? tasks.map(t=>t.id) : [])} 
                        checked={selected.length===tasks.length && tasks.length>0} 
                      /> 
                    </th>
                    <th className="p-2 w-48 cursor-pointer whitespace-nowrap" onClick={()=>changeSort('title')}>
                      <div className="flex items-center gap-1">
                        Title {sortBy==='title' ? (sortDir==='asc'?'▲':'▼') : ''}
                      </div>
                    </th>
                    <th className="p-2 w-48 cursor-pointer hidden sm:table-cell" onClick={()=>changeSort('assignees')}>
                      <div className="flex items-center gap-1">
                        Assignees {sortBy==='assignees' ? (sortDir==='asc'?'▲':'▼') : ''}
                      </div>
                    </th>
                    <th className="p-2 w-56 cursor-pointer hidden md:table-cell" onClick={()=>changeSort('due')}>
                      <div className="flex items-center gap-1">
                        Due {sortBy==='due' ? (sortDir==='asc'?'▲':'▼') : ''}
                      </div>
                    </th>
                    <th className="p-2 w-32 cursor-pointer hidden sm:table-cell" onClick={()=>changeSort('priority')}>
                      <div className="flex items-center gap-1">
                        Priority {sortBy==='priority' ? (sortDir==='asc'?'▲':'▼') : ''}
                      </div>
                    </th>
                    <th className="p-2 w-32 cursor-pointer" onClick={()=>changeSort('status')}>
                      <div className="flex items-center gap-1">
                        Status {sortBy==='status' ? (sortDir==='asc'?'▲':'▼') : ''}
                      </div>
                    </th>
                    <th className="p-2 w-32 sticky right-0 bg-gray-50 dark:bg-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTasks.map(t => (
                    <tr key={t.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-2 align-top sticky left-0 bg-white dark:bg-gray-800">
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
                          (t.taskType === 'group' || t.taskType === 'custom') ? (
                            <Select
                              isMulti
                              value={users
                                .filter(u => (editing[t.id].assignees || []).includes(u.id))
                                .map(u => ({ value: u.id, label: u.name }))
                              }
                              onChange={selected => {
                                const selectedUsers = selected || []
                                setEditing(prev => ({
                                  ...prev,
                                  [t.id]: {
                                    ...prev[t.id],
                                    assignees: selectedUsers.map(s => s.value),
                                    assigneeNames: selectedUsers.map(s => s.label).join(', ')
                                  }
                                }))
                              }}
                              options={users.map(u => ({ value: u.id, label: u.name }))}
                              placeholder={t.taskType === 'group' ? 'Select team members...' : 'Select users...'}
                              className="react-select-container"
                              classNamePrefix="react-select"
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  minHeight: '36px',
                                  backgroundColor: 'var(--bg-input, white)',
                                  borderColor: 'var(--border-color, #e2e8f0)',
                                }),
                                menu: (base) => ({
                                  ...base,
                                  backgroundColor: 'var(--bg-input, white)',
                                  zIndex: 50
                                }),
                                option: (base, state) => ({
                                  ...base,
                                  backgroundColor: state.isFocused 
                                    ? 'var(--bg-hover, #f7fafc)'
                                    : 'transparent',
                                  ':active': {
                                    backgroundColor: 'var(--bg-active, #edf2f7)'
                                  }
                                })
                              }}
                            />
                          ) : (
                            <Select
                              value={
                                editing[t.id].assignee
                                  ? {
                                      value: editing[t.id].assignee,
                                      label: users.find(u => u.id === editing[t.id].assignee)?.name || ''
                                    }
                                  : null
                              }
                              onChange={selected => {
                                setEditing(prev => ({
                                  ...prev,
                                  [t.id]: {
                                    ...prev[t.id],
                                    assignee: selected?.value || '',
                                    assignees: selected ? [selected.value] : [],
                                    assigneeNames: selected?.label || ''
                                  }
                                }))
                              }}
                              options={[
                                { value: '', label: 'Unassigned' },
                                ...users.map(u => ({ value: u.id, label: u.name }))
                              ]}
                              placeholder="Select assignee..."
                              className="react-select-container"
                              classNamePrefix="react-select"
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  minHeight: '36px',
                                  backgroundColor: 'var(--bg-input, white)',
                                  borderColor: 'var(--border-color, #e2e8f0)',
                                }),
                                menu: (base) => ({
                                  ...base,
                                  backgroundColor: 'var(--bg-input, white)',
                                  zIndex: 50
                                }),
                                option: (base, state) => ({
                                  ...base,
                                  backgroundColor: state.isFocused 
                                    ? 'var(--bg-hover, #f7fafc)'
                                    : 'transparent',
                                  ':active': {
                                    backgroundColor: 'var(--bg-active, #edf2f7)'
                                  }
                                })
                              }}
                            />
                          )
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{t.assigneeNames || t.assigneeName || 'Unassigned'}</span>
                            {t.taskType === 'group' && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                {groupsList.find(g => g.id === t.groupId)?.name || 'Group'}
                              </span>
                            )}
                            {t.taskType === 'custom' && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                Custom
                              </span>
                            )}
                          </div>
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
                            min={new Date().toISOString().slice(0, 16)}
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
