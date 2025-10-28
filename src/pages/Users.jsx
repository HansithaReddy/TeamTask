import React, { useState } from 'react'
import useAuth from '../hooks/useAuth'
import api from '../services/api.firebase'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import Toast from '../components/Toast'

export default function Users() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'user' })
  const [showAddUser, setShowAddUser] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [error, setError] = useState('')

  React.useEffect(() => {
    ;(async () => {
      const fetchedUsers = await api.getUsers()
      setUsers(fetchedUsers)
    })()
  }, [])

  const createUser = async () => {
    try {
      if (!userForm.name || !userForm.email) {
        setError('Please provide name and email')
        return
      }
      
      // Show loading state
      setError('')
      setToast({ 
        show: true, 
        message: 'Creating user...', 
        type: 'info' 
      })
      
      const result = await api.createUser({
        name: userForm.name.trim(),
        email: userForm.email.trim().toLowerCase(),
        role: userForm.role
      })
      
      // Update UI
      setUsers(prev => [...prev, result])
      setUserForm({ name: '', email: '', role: 'user' })
      setShowAddUser(false)
      
      // Show success message
      setToast({ 
        show: true, 
        message: `User ${result.name} created successfully.`, 
        type: 'success' 
      })

      // Clear success message after 5 seconds
      setTimeout(() => {
        setToast(prev => ({
          ...prev,
          show: false
        }))
      }, 5000)
    } catch (e) {
      console.error('Error creating user:', e)
      setError(e.message || 'Failed to create user')
      setToast({ 
        show: true, 
        message: `Failed to create user: ${e.message || 'Unknown error'}`, 
        type: 'error' 
      })
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={()=>setToast({show:false,message:'',type:toast.type})} />
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h2>
            <button
              onClick={() => setShowAddUser(true)}
              className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add User
            </button>
          </div>

          {showAddUser && (
            <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Add New User</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={e => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={e => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                  <select
                    value={userForm.role}
                    onChange={e => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="mt-4 text-sm text-red-600 dark:text-red-500">
                  {error}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={createUser}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Create User
                </button>
                <button
                  onClick={() => {
                    setShowAddUser(false)
                    setUserForm({ name: '', email: '', role: 'user' })
                    setError('')
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{u.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        u.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        disabled={u.id === user.id}
                      >
                        Delete
                      </button>
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