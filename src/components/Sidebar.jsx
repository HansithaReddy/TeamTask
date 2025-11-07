import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { motion } from 'framer-motion'

export default function Sidebar(){
  const { user } = useAuth()
  const location = useLocation()
  const [groups, setGroups] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')

  const baseNavItems = [
    { to: '/', label: 'Dashboard', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h7v7H3V3zM14 3h7v7h-7V3zM3 14h7v7H3v-7zM14 14h7v7h-7v-7z" /></svg>
    ) }
  ]

  const userNavItems = [
    { to: '/my-tasks', label: 'Tasks', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7 7h10M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
    ) },
    { to: '/user-activity', label: 'My Activity Log', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    ) },
    { to: '/user-analytics', label: 'My Analytics', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17a4 4 0 100-8 4 4 0 000 8zM21 21v-6M3 21v-4M15 21v-2" /></svg>
    ) }
  ]

  const adminNavItems = [
    { to: '/admin', label: 'Admin Panel', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3-4 5-4 5v3h8v-3s-4-2-4-5zM12 7a4 4 0 100-8 4 4 0 000 8z" /></svg>
    ) },
    { to: '/groups', label: 'Groups', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h6v6H3V7zM15 7h6v6h-6V7zM3 17h6v4H3v-4zM15 17h6v4h-6v-4z" /></svg>
    ) },
    { to: '/users', label: 'Users', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M15 11a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    ) },
    { to: '/admin-activity', label: 'Admin Activity Log', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    ) },
    { to: '/admin-analytics', label: 'Admin Analytics', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17a4 4 0 100-8 4 4 0 000 8zM21 21v-6M3 21v-4M15 21v-2" /></svg>
    ) }
  ]

  // Combine nav items based on user role
  const navItems = user?.role === 'admin' 
    ? [...baseNavItems, ...adminNavItems] 
    : [...baseNavItems, ...userNavItems]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  useEffect(()=>{
    let mounted = true
    ;(async ()=>{
      if (user?.role === 'admin'){
        try{
          const g = await api.getGroups()
          if (mounted) setGroups(g)
        }catch(e){ console.warn('Failed to load groups', e) }
      }
    })()
    return ()=>{ mounted = false }
  }, [user])

  return (
    <>
      <button 
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed bottom-4 right-4 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <motion.aside 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className={`${mobileMenuOpen ? 'fixed inset-0 z-40 bg-black/50' : 'hidden'} lg:block lg:static lg:bg-transparent lg:w-72 p-6`}
      >
        <div className={`${mobileMenuOpen ? 'fixed right-0 inset-y-0 bg-white dark:bg-gray-900 w-72 p-6 shadow-xl' : ''} lg:static lg:shadow-none lg:w-auto`}>
          <div className="flex justify-between items-center lg:hidden mb-6">
            <h2 className="font-semibold text-xl">Menu</h2>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="glass p-4 rounded-2xl">
            <div className="text-sm text-muted">Welcome</div>
            <div className="font-semibold text-lg">{user?.name}</div>
          </div>

          <nav className="mt-6">
            <ul className="space-y-2">
              {navItems.map(item => {
                const active = isActive(item.to)
                return (
                  <li key={item.to}>
                    <Link 
                      to={item.to} 
                      onClick={() => setMobileMenuOpen(false)}
                      className={`p-3 rounded-md flex items-center gap-3 smooth transition-colors ${
                        active 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-semibold' 
                          : 'hover:shadow hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      {item.icon}
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          
        </div>
      </motion.aside>
    </>
  )
}
