import React from 'react';
import useAuth from '../hooks/useAuth';
import api from '../services/api.firebase';
import { motion, AnimatePresence } from 'framer-motion';

export default function TaskDialog({ task, onClose, onUpdate, onComment }) {
  const { user } = useAuth();
  const [comment, setComment] = React.useState('');

  const addComment = async () => {
    if (!comment) return;
    const c = await api.addComment(task.id, { text: comment, authorId: user.id });
    setComment('');
    onComment(task.id, c);
  };

  if (!task) return null;

  return (
    <AnimatePresence>
      <div onClick={onClose} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 flex justify-between items-start border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold mb-1">{task.title}</h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>Assigned by: {task.assignedBy}</span>
                <span>Assignee: {task.assigneeName || task.assignee || 'Unassigned'}</span>
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
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
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

              <div>
                <h3 className="text-sm font-medium mb-3">Comments</h3>
                <div className="space-y-3">
                  {(task.comments || []).map(c => (
                    <div key={c.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm">{c.text}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(c.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {task.assignee === user?.id && (
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
    </AnimatePresence>
  );
}