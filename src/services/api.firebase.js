import { auth, db } from '../firebase';
import { v4 as uuidv4 } from 'uuid';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  sendPasswordResetEmail
} from 'firebase/auth';
import { collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, orderBy, serverTimestamp, query, onSnapshot } from 'firebase/firestore';

const USERS_COL = 'users';
const TASKS_COL = 'tasks';
const ACTIVITY_COL = 'activity';

const api = {
  async login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const userRef = doc(db, USERS_COL, cred.user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      const profile = { id: cred.user.uid, email, name: cred.user.displayName || email.split('@')[0], role: 'user' };
      await setDoc(userRef, profile);
      return { token: await cred.user.getIdToken(), user: profile };
    }
    return { token: await cred.user.getIdToken(), user: snap.data() };
  },

  async register({ name, email, password, role = 'user' }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    const profile = { id: uid, name, email, role };
    await setDoc(doc(db, USERS_COL, uid), profile);
    return profile;
  },

  async logout() {
    await signOut(auth);
  },

  async forgotPassword(email) {
    await sendPasswordResetEmail(auth, email);
  },

  onAuthStateChanged(cb) {
    return onAuthStateChanged(auth, cb);
  },

  async getUsers() {
    const snap = await getDocs(collection(db, USERS_COL));
    return snap.docs.map(d => ({ ...d.data(), id: d.id }));
  },

  async createUser({ name, email, role }) {
    if (!name || !email) throw new Error('Name and email are required');

    // Ensure admin is authenticated
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    try {
      // Create a new Firestore document with an auto-generated ID for the user
      const userDocRef = doc(collection(db, USERS_COL));
      const uid = userDocRef.id;

      const userProfile = {
        id: uid,
        name,
        email,
        role: role || 'user',
        createdAt: serverTimestamp(),
        status: 'invited'
      };

      // Save user profile to Firestore (no Auth user creation to avoid changing admin session)
      await setDoc(userDocRef, userProfile);

      // Generate a registration link that the admin can copy/send. In production you'd email this.
      const registrationLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/register?uid=${uid}&email=${encodeURIComponent(email)}`;

      // Log activity
      await api.logActivity({
        action: 'create-user',
        userId: uid,
        meta: { name, email, role },
        createdBy: currentUser.uid
      });

      return { ...userProfile, id: uid, registrationLink };
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error(error.message || 'Failed to create user');
    }
  },

  async deleteUser(userId) {
    try {
      const userRef = doc(db, USERS_COL, userId)
      const snap = await getDoc(userRef)
      const data = snap.exists() ? snap.data() : null
      await deleteDoc(userRef)
      await api.logActivity({ action: 'delete-user', userId, meta: { name: data?.name || null, email: data?.email || null } })
      return true
    } catch (e) {
      console.error('deleteUser failed', e)
      throw e
    }
  },

  async getTasks() {
    const snap = await getDocs(collection(db, TASKS_COL));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async createTask(task) {
    const docRef = await addDoc(collection(db, TASKS_COL), { ...task, createdAt: serverTimestamp() });
    await api.logActivity({ action: 'create', taskId: docRef.id, meta: task });
    // Attempt to return the created task with id. Note: serverTimestamp will be populated by Firestore.
    const created = { id: docRef.id, ...task };
    // Try to notify assignee if email present (non-blocking)
    try { if (task.assigneeEmail) await api.notifyAssignee(task.assigneeEmail, created) } catch(e){ console.warn('notify failed', e) }
    return created;
  },

  async updateTask(id, patch) {
    const ref = doc(db, TASKS_COL, id);
    await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
    await api.logActivity({ action: 'update', taskId: id, meta: patch });
    const snap = await getDoc(ref);
    return { id: snap.id, ...snap.data() };
  },

  async deleteTask(id) {
    await deleteDoc(doc(db, TASKS_COL, id));
    await api.logActivity({ action: 'delete', taskId: id });
    return true;
  },

  async addComment(taskId, comment) {
    const taskRef = doc(db, TASKS_COL, taskId);
    const snap = await getDoc(taskRef);
    if (!snap.exists()) throw new Error('Task not found');
    const data = snap.data();
    const comments = data.comments || [];
    const c = { id: uuidv4(), text: comment.text, authorId: comment.authorId, createdAt: new Date().toISOString() };
    comments.push(c);
    await updateDoc(taskRef, { comments });
    await api.logActivity({ action: 'comment', taskId, meta: c });
    return c;
  },

  // Real-time listener for tasks collection. Callback receives array of tasks.
  onTasksChanged(cb) {
    const q = query(collection(db, TASKS_COL), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      cb(items)
    }, err => {
      console.warn('onTasksChanged error', err)
    })
    return unsub
  },

  // Scaffold for notifying assignee (email). In production, hook this to Cloud Function or SMTP service.
  // This function is non-blocking and will try a fetch to a configured endpoint if available.
  async notifyAssignee(email, task) {
    if (!email) return
    // If you have a server endpoint or cloud function, set NOTIFY_ENDPOINT in your env and use it.
    let endpoint = ''
    try {
      endpoint = typeof process !== 'undefined' && process.env && process.env.NOTIFY_ENDPOINT ? process.env.NOTIFY_ENDPOINT : ''
    } catch (e) {
      endpoint = ''
    }
    if (!endpoint) {
      console.warn('notifyAssignee: no endpoint configured — would send email to', email, 'for task', task.id)
      return
    }
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email, task })
      })
    } catch (e) {
      console.warn('notifyAssignee failed', e)
    }
  },

  async getActivity() {
    const snap = await getDocs(query(collection(db, ACTIVITY_COL), orderBy('timestamp', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async logActivity(entry) {
    try {
      await addDoc(collection(db, ACTIVITY_COL), { ...entry, timestamp: serverTimestamp() });
    } catch (e) {
      console.warn('Activity log failed', e);
    }
  }
};

export default api;
