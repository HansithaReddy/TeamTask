import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import useAuth from '../hooks/useAuth'
import api from '../services/api.firebase'
import Select from 'react-select'

export default function Groups(){
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [members, setMembers] = useState([])
  const [toast, setToast] = useState(null)
  const [expandedGroups, setExpandedGroups] = useState(new Set())

  useEffect(()=>{
    let mounted = true
    ;(async ()=>{
      try{
        const [g, u] = await Promise.all([api.getGroups(), api.getUsers()])
        if(!mounted) return
        setGroups(g)
        setUsers(u)
      }catch(e){
        console.error('Failed to load groups/users', e)
      }finally{ setLoading(false) }
    })()
    return ()=> mounted = false
  }, [])

  // Handlers for create / edit / delete flows
  function startCreate(){
    setCreating(true)
    setEditing(null)
    setName('')
    setMembers([])
    setToast(null)
  }

  function startEdit(group){
    setEditing(group)
    setCreating(false)
    setName(group.name || '')
    // convert member ids to react-select option objects
    const opts = (group.members || []).map(id => {
      const u = users.find(u => u.id === id)
      return { value: id, label: u ? `${u.name} (${u.email})` : id }
    })
    setMembers(opts)
    setToast(null)
  }

  function cancel(){
    setCreating(false)
    setEditing(null)
    setName('')
    setMembers([])
    setToast(null)
  }

  async function create(){
    if(!name || name.trim() === ''){ setToast({ type: 'error', message: 'Name is required' }); return }
    const memberIds = (members || []).map(m => m.value)
    if((memberIds || []).length < 2){ setToast({ type: 'error', message: 'A team must have at least 2 members' }); return }
    try{
      const created = await api.createGroup({ name: name.trim(), members: memberIds })
      // set users' groupId to this new group
      await Promise.all(memberIds.map(id => api.setUserGroup(id, created.id)))
      // refresh local lists
      const fresh = await api.getGroups()
      setGroups(fresh)
      setToast({ type: 'success', message: 'Team created' })
      cancel()
    }catch(e){
      console.error('create group failed', e)
      setToast({ type: 'error', message: e.message || 'Failed to create team' })
    }
  }

  async function saveEdit(){
    if(!editing) return
    const memberIds = (members || []).map(m => m.value)
    try{
      await api.updateGroup(editing.id, { name: name.trim(), members: memberIds })
      // sync user groupId for members: set groupId for selected, clear for removed
      const prev = editing.members || []
      const added = memberIds.filter(id => !prev.includes(id))
      const removed = prev.filter(id => !memberIds.includes(id))
      await Promise.all(added.map(id => api.setUserGroup(id, editing.id)))
      await Promise.all(removed.map(id => api.setUserGroup(id, null)))
      const fresh = await api.getGroups()
      setGroups(fresh)
      setToast({ type: 'success', message: 'Team updated' })
      cancel()
    }catch(e){
      console.error('saveEdit failed', e)
      setToast({ type: 'error', message: e.message || 'Failed to save' })
    }
  }

  async function remove(group){
    if(!group) return
    if(!confirm(`Delete team "${group.name || group.id}"? This will remove the group but not the users.`)) return
    try{
      // clear groupId for all members
      const membersIds = group.members || []
      await Promise.all(membersIds.map(id => api.setUserGroup(id, null)))
      await api.deleteGroup(group.id)
      const fresh = await api.getGroups()
      setGroups(fresh)
      setToast({ type: 'success', message: 'Team deleted' })
      cancel()
    }catch(e){
      console.error('delete group failed', e)
      setToast({ type: 'error', message: e.message || 'Failed to delete' })
    }
  }

  function toggleExpanded(id){
    setExpandedGroups(prev => {
      const s = new Set(prev)
      if(s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

  function handleKeyToggle(e, id){
    if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpanded(id) }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Groups</h2>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">{groups.length} groups</div>
              <button onClick={startCreate} className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700">New Group</button>
            </div>
          </div>

          {/* Create / Edit form (shown when creating or editing) */}
          {(creating || editing) && (
            <div className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">{creating ? 'Create Group' : 'Edit Group'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <input value={name} onChange={e=>setName(e.target.value)} className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Members</label>
                  <Select isMulti options={users.map(u=>({ value: u.id, label: `${u.name} (${u.email})` }))} value={members} onChange={setMembers} classNamePrefix="react-select" />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                {creating ? (
                  <button onClick={create} className="px-4 py-2 rounded bg-blue-600 text-white">Create Group</button>
                ) : (
                  <button onClick={saveEdit} className="px-4 py-2 rounded bg-blue-600 text-white">Save Changes</button>
                )}
                <button onClick={cancel} className="px-4 py-2 rounded border">Cancel</button>
              </div>

              {toast && (
                <div className={`mt-4 p-2 rounded ${toast.type==='success'?'bg-green-50 text-green-700':'bg-red-50 text-red-700'}`}>{toast.message}</div>
              )}
            </div>
          )}

          {/* Groups table */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Members</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {groups.map(g => (
                  <tr key={g.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{g.name || g.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{(g.members||[]).length} members</div>
                      <div className="mt-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {((expandedGroups.has(g.id) ? (g.members||[]) : (g.members||[]).slice(0,3)) || []).map(id => {
                            const u = users.find(u => u.id === id)
                            return (
                              <span key={id} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs text-gray-700 dark:text-gray-200">{u ? u.name : id}</span>
                            )
                          })}
                          {(g.members||[]).length > 3 && (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={() => toggleExpanded(g.id)}
                              onKeyDown={(e) => handleKeyToggle(e, g.id)}
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200"
                            >
                              {expandedGroups.has(g.id) ? 'Show less' : `+${(g.members||[]).length - 3} more`}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onClick={() => startEdit(g)} className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                      <button onClick={() => remove(g)} className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  )
}
