import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'
import UserTasks from './pages/UserTasks'
import Users from './pages/Users'
import Activity from './pages/Activity'
import UserActivityLog from './pages/UserActivityLog'
import AdminActivityLog from './pages/AdminActivityLog'
import Analytics from './pages/Analytics'
import UserAnalytics from './pages/UserAnalytics'
import AdminAnalytics from './pages/AdminAnalytics'
import Groups from './pages/Groups'
import useAuth from './hooks/useAuth'

function Protected({ children, roles }){
  const { user } = useAuth()
  if(!user) return <Navigate to="/auth" replace />
  if(roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

export default function App(){
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/auth" element={<PageWrap><AuthPage/></PageWrap>} />
        <Route path="/login" element={<PageWrap><AuthPage/></PageWrap>} />
        <Route path="/" element={<PageWrap><Protected><Dashboard/></Protected></PageWrap>} />
        <Route path="/admin" element={<PageWrap><Protected roles={["admin"]}><AdminPanel/></Protected></PageWrap>} />
  <Route path="/analytics" element={<PageWrap><Protected roles={["user","admin"]}><Analytics/></Protected></PageWrap>} />
  <Route path="/user-analytics" element={<PageWrap><Protected roles={["user","admin"]}><UserAnalytics/></Protected></PageWrap>} />
  <Route path="/admin-analytics" element={<PageWrap><Protected roles={["admin"]}><AdminAnalytics/></Protected></PageWrap>} />
        <Route path="/users" element={<PageWrap><Protected roles={["admin"]}><Users/></Protected></PageWrap>} />
  <Route path="/groups" element={<PageWrap><Protected roles={["admin"]}><Groups/></Protected></PageWrap>} />
  <Route path="/activity" element={<PageWrap><Protected roles={["user","admin"]}><Activity/></Protected></PageWrap>} />
  <Route path="/user-activity" element={<PageWrap><Protected roles={["user","admin"]}><UserActivityLog/></Protected></PageWrap>} />
  <Route path="/admin-activity" element={<PageWrap><Protected roles={["admin"]}><AdminActivityLog/></Protected></PageWrap>} />
        <Route path="/my-tasks" element={<PageWrap><Protected roles={["user","admin"]}><UserTasks/></Protected></PageWrap>} />
        <Route path="*" element={<Navigate to='/' />} />
      </Routes>
    </AnimatePresence>
  )
}

function PageWrap({ children }){
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.24 }}>
      {children}
    </motion.div>
  )
}
