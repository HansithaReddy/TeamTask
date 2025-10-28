import React, { createContext, useState, useEffect } from 'react'
import api from '../services/api.firebase'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('tm_auth')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })
  const [theme, setTheme] = useState(() => localStorage.getItem('tm_theme') || 'light')

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('tm_theme', theme)
  }, [theme])

  useEffect(()=>{
    const unsub = api.onAuthStateChanged(async (fbUser)=>{
      if(!fbUser){ setUser(null); localStorage.removeItem('tm_auth'); return; }
      try{
        const users = await api.getUsers();
        const profile = users.find(u=>u.id === fbUser.uid);
        if(profile){ setUser(profile); localStorage.setItem('tm_auth', JSON.stringify(profile)); }
      }catch(e){ console.warn(e) }
    })
    return () => unsub && unsub();
  },[])

  const login = async (email, password) => {
    const res = await api.login(email, password)
    setUser(res.user)
    localStorage.setItem('tm_auth', JSON.stringify(res.user))
    return res.user
  }
  const logout = async () => { await api.logout(); setUser(null); localStorage.removeItem('tm_auth') }
  const register = async (payload) => { const u = await api.register(payload); return u }
  const forgotPassword = async (email) => { await api.forgotPassword(email) }

  return (
    <AuthContext.Provider value={{ user, login, logout, register, forgotPassword, theme, setTheme }}>
      {children}
    </AuthContext.Provider>
  )
}
