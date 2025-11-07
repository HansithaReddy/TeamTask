import React from 'react';
import useAuth from '../hooks/useAuth';
import api from '../services/api.firebase';
import { motion } from 'framer-motion';

export default function TaskDialog({ task, onClose, onUpdate, onComment }) {
  const { user } = useAuth();
  const [comment, setComment] = React.useState('');
  const [groupMembers, setGroupMembers] = React.useState([])
  const [selectedMember, setSelectedMember] = React.useState('')

  const addComment = async () => {
    if (!comment) return;
    const c = await api.addComment(task.id, { text: comment, authorId: user.id });
    setComment('');
    onComment(task.id, c);
  };

  // load group members so we can add task members by selecting them
  React.useEffect(() => {
    let mounted = true
    if (!user || !user.groupId) return
    ;(async () => {
      try {
        const us = await api.getUsers(user.groupId)
        if (mounted) setGroupMembers(us)
      } catch (e) {
        console.warn('Failed to load group members', e)
      }
    })()
    return () => { mounted = false }
  }, [user])

  const canModifyMembers = () => {
    if (!user) return false
    if (user.role === 'admin') return true
    if (task && task.createdBy === user.id) return true
    return false
  }

  const handleAddMember = async () => {
    if (!selectedMember) return
    try {
      const updated = await api.addTaskMember(task.id, selectedMember)
      onUpdate && onUpdate(updated)
      setSelectedMember('')
    } catch (e) {
      console.error('add member failed', e)
    }
  }

  const handleRemoveMember = async (memberId) => {
    try {
      const updated = await api.removeTaskMember(task.id, memberId)
      onUpdate && onUpdate(updated)
    } catch (e) {
      console.error('remove member failed', e)
    }
  }

  if (!task) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="bg-white dark:bg-gray-800 rounded-t-xl sm:rounded-xl shadow-xl w-full sm:max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
          <div className="p-6 flex justify-between items-start border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold mb-1">{task.title}</h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>Assigned by: {task.assignedBy}</span>
                {task.taskType === 'individual' ? (
                  <span>Assignee: {task.assigneeName || task.assignee || 'Unassigned'}</span>
                ) : null}
                <span>Due: {task.due ? new Date(task.due).toLocaleString() : '—'}</span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Status</h3>
                <div className="flex gap-2">
                  {['To Do', 'In Progress', 'Done'].map(s => (
                    <button
                      key={s}
                      onClick={() => onUpdate({ ...task, status: s })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        task.status === s
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Priority</h3>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  task.priority === 'high'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : task.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                }`}>
                  {task.priority}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Description</h3>
                <p className="text-gray-600 dark:text-gray-300">{task.desc}</p>
              </div>

              {(task.taskType === 'group' || task.taskType === 'custom') && (
                <div>
                  <h3 className="text-sm font-medium mb-3">Members</h3>
                  <div className="space-y-2 mb-4">
                    {(task.task_members || []).length === 0 && (
                      <div className="text-sm text-gray-500">No members assigned</div>
                    )}
                    {(task.task_members || []).map(mid => {
                      const m = groupMembers.find(u => u.id === mid) || { id: mid, name: mid }
                      return (
                        <div key={mid} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                          <div className="text-sm">{m.name} {m.email ? `(${m.email})` : ''}</div>
                          {canModifyMembers() && (
                            <button onClick={() => handleRemoveMember(mid)} className="text-sm text-red-600 hover:text-red-800">Remove</button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {canModifyMembers() && (
                    <div className="flex gap-2 items-center mb-4">
                      <select value={selectedMember} onChange={e => setSelectedMember(e.target.value)} className="flex-1 p-2 rounded border bg-white dark:bg-gray-800">
                        <option value="">Select member to add...</option>
                        {groupMembers.filter(u => !(task.task_members || []).includes(u.id)).map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                        ))}
                      </select>
                      <button onClick={handleAddMember} className="px-3 py-2 rounded bg-blue-600 text-white">Add</button>
                    </div>
                  )}
                </div>
              )}

                <div>
                  <h3 className="text-sm font-medium mb-3">Comments</h3>
                  <div className="space-y-3">
                    {(task.comments || []).map(c => (
                      <div key={c.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-sm">{c.text}</p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>{c.authorName || 'Unknown'}</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{new Date(c.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {(task.taskType === 'group' || task.taskType === 'custom' || 
                    (task.taskType === 'individual' && task.assignee === user?.id)) && (
                    <div className="mt-4 flex gap-2">
                      <input
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Add a comment..."
                      />
                      <button
                        onClick={addComment}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
  );
}