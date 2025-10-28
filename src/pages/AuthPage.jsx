import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import useAuth from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function AuthPage(){
  const [tab, setTab] = useState('login')
  const [isResetMode, setIsResetMode] = useState(false)
  const [resetStatus, setResetStatus] = useState('')
  const [registerError, setRegisterError] = useState('')
  const { register: regFn, handleSubmit, watch, formState: { errors } } = useForm()
  const { login, register, forgotPassword } = useAuth()
  const nav = useNavigate()

  const password = watch('password') // This allows us to watch the password field for validation

  const onLogin = async (data) => {
    try { await login(data.email, data.password); nav('/') } catch(e){ alert(e.message) }
  }
  const onRegister = async (data) => {
    setRegisterError('')
    if (data.password !== data.confirmPassword) {
      setRegisterError('Passwords do not match')
      return
    }
    try { 
      await register({ 
        name: data.name, 
        email: data.email, 
        password: data.password, 
        role: data.role 
      })
      alert('Registered. Please login.')
      setTab('login') 
    } catch(e){ 
      setRegisterError(e.message)
    }
  }
  const onForgotPassword = async (data) => {
    try {
      await forgotPassword(data.email)
      setResetStatus('success')
    } catch(e) {
      setResetStatus('error')
      alert(e.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div initial={{ scale: .98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: .35 }} className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="hidden md:flex items-center justify-center rounded-xl p-6" style={{ background: 'linear-gradient(135deg, rgba(96,165,250,0.08), rgba(124,194,255,0.04))' }}>
          <div>
            <h1 className="text-3xl font-bold">TeamTask</h1>
            <p className="mt-3 text-muted">A calm, modern task manager for teams — sign up and start assigning tasks.</p>
          </div>
        </div>

        <div className="card p-6 rounded-xl">
          <div className="flex gap-2 mb-4">
            <button onClick={()=>setTab('login')} className={`flex-1 py-2 rounded ${tab==='login' ? 'bg-blue-600 text-white' : 'bg-transparent'}`}>Login</button>
            <button onClick={()=>setTab('register')} className={`flex-1 py-2 rounded ${tab==='register' ? 'bg-blue-600 text-white' : 'bg-transparent'}`}>Register</button>
          </div>

          {tab==='login' && !isResetMode && (
            <form onSubmit={handleSubmit(onLogin)} className="space-y-4">
              <div className="space-y-3">
                <input {...regFn('email')} placeholder="Email" className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                <input {...regFn('password')} type="password" placeholder="Password" className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
              </div>
              <div className="flex flex-col gap-3">
                <button className="w-full py-3 rounded-lg btn-primary">Sign in</button>
                <button 
                  type="button"
                  onClick={() => setIsResetMode(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors text-center"
                >
                  Forgot your password?
                </button>
              </div>
            </form>
          )}

          {tab==='login' && isResetMode && (
            <div className="space-y-4">
              <form onSubmit={handleSubmit(onForgotPassword)} className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Reset Password</h3>
                  <p className="text-sm text-muted mb-4">Enter your email address and we'll send you instructions to reset your password.</p>
                  <input 
                    {...regFn('email')} 
                    placeholder="Enter your email" 
                    className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <button className="w-full py-3 rounded-lg btn-primary">Send Reset Link</button>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsResetMode(false)
                      setResetStatus('')
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors text-center"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
              
              {resetStatus === 'success' && (
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm">
                  Password reset instructions have been sent to your email.
                </div>
              )}
            </div>
          )}

          {tab==='register' && (
            <form onSubmit={handleSubmit(onRegister)} className="space-y-4">
              <div className="space-y-3">
                <input 
                  {...regFn('name', { required: 'Name is required' })} 
                  placeholder="Full name" 
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                
                <input 
                  {...regFn('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  })} 
                  placeholder="Email" 
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                
                <input 
                  {...regFn('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })} 
                  type="password" 
                  placeholder="Password" 
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                />
                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                
                <input 
                  {...regFn('confirmPassword', { 
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })} 
                  type="password" 
                  placeholder="Confirm Password" 
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                />
                {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
                
                <select 
                  {...regFn('role', { required: 'Please select a role' })} 
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                {errors.role && <p className="text-sm text-red-500">{errors.role.message}</p>}
              </div>
              
              {registerError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
                  {registerError}
                </div>
              )}
              
              <button className="w-full py-3 rounded-lg btn-primary hover:shadow-lg hover:shadow-blue-500/20 transition-all">
                Create account
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
