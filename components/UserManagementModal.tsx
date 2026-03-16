
import React, { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, Shield, User, AlertCircle, Save } from 'lucide-react';
import { UserAccount } from '../types';
import { db } from '../services/db';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
}

const UserManagementModal: React.FC<Props> = ({ isOpen, onClose, currentUser }) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    let unsubscribe: () => void;
    if (isOpen) {
      import('../firebase').then(({ db: firestore, collection, onSnapshot }) => {
        unsubscribe = onSnapshot(collection(firestore, 'users'), (snapshot) => {
          const currentUsers: UserAccount[] = [];
          snapshot.forEach((doc) => {
            currentUsers.push(doc.data() as UserAccount);
          });
          setUsers(currentUsers);
        }, (error) => {
          console.error("Error listening to users:", error);
        });
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen]);

  const refreshList = async () => {
    // Real-time listener handles the data
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!newUsername.trim() || !newPassword.trim()) {
      setError('Username and password are required.');
      return;
    }

    const uid = Date.now().toString(); // Simple UID generation for local admin creation
    const result = await db.users.add({
      uid,
      username: newUsername.trim(),
      password: newPassword.trim(),
      role: newRole,
      createdAt: Date.now()
    });

    if (result) {
      setSuccessMsg(`User ${newUsername} added successfully.`);
      setNewUsername('');
      setNewPassword('');
      setNewRole('user');
      // Force refresh logic
      setTimeout(() => refreshList(), 50);
    } else {
      setError("Failed to add user.");
    }
  };

  const handleDelete = async (username: string, uid?: string) => {
    if (username === currentUser.username) {
      setError("You cannot delete your own account.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) return;

    if (!uid) {
        setError("Cannot delete user without UID.");
        return;
    }

    const result = await db.users.delete(uid);
    if (result) {
      await refreshList();
      setSuccessMsg(`User ${username} deleted.`);
    } else {
      setError("Failed to delete user.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-purple-950/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white border border-purple-100 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-100 bg-purple-50 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-xl border border-purple-200">
               <Shield className="w-6 h-6 text-tcm-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black text-purple-950 uppercase tracking-tighter">Master Control</h2>
              <p className="text-xs font-bold text-purple-500 uppercase tracking-widest">User Management & Access Control</p>
            </div>
          </div>
          <button onClick={onClose} className="text-purple-400 hover:text-purple-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
           
           {/* Add User Form */}
           <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100 shadow-inner">
              <h3 className="text-sm font-black text-tcm-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                 <UserPlus className="w-4 h-4" /> Add New User
              </h3>
              
              <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                 <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-purple-400 uppercase tracking-widest mb-1 ml-1">Username</label>
                    <input 
                      type="text" 
                      value={newUsername}
                      onChange={e => setNewUsername(e.target.value)}
                      className="w-full bg-white border border-purple-200 rounded-xl px-4 py-3 text-sm text-purple-900 focus:border-tcm-primary outline-none shadow-sm transition-all"
                      placeholder="e.g. doctor1"
                    />
                 </div>
                 <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-purple-400 uppercase tracking-widest mb-1 ml-1">Password</label>
                    <input 
                      type="text" 
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full bg-white border border-purple-200 rounded-xl px-4 py-3 text-sm text-purple-900 focus:border-tcm-primary outline-none font-mono shadow-sm transition-all"
                      placeholder="Password"
                    />
                 </div>
                 <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-purple-400 uppercase tracking-widest mb-1 ml-1">Role</label>
                    <select 
                       value={newRole}
                       onChange={e => setNewRole(e.target.value as any)}
                       className="w-full bg-white border border-purple-200 rounded-xl px-4 py-3 text-sm text-purple-900 focus:border-tcm-primary outline-none shadow-sm transition-all"
                    >
                       <option value="user">User</option>
                       <option value="admin">Admin</option>
                    </select>
                 </div>
                 <div className="md:col-span-1">
                    <button type="submit" className="w-full bg-tcm-primary hover:brightness-110 active:scale-95 text-white font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md shadow-purple-900/20">
                       <Save className="w-4 h-4" /> Add
                    </button>
                 </div>
              </form>

              {error && (
                 <div className="mt-4 text-xs font-bold text-rose-500 flex items-center gap-2 bg-rose-50 p-3 rounded-xl border border-rose-100">
                    <AlertCircle className="w-4 h-4" /> {error}
                 </div>
              )}
              {successMsg && (
                 <div className="mt-4 text-xs font-bold text-emerald-600 flex items-center gap-2 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                    <AlertCircle className="w-4 h-4" /> {successMsg}
                 </div>
              )}
           </div>

           {/* User List */}
           <div>
              <h3 className="text-sm font-black text-purple-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-purple-400" /> Registered Users ({users.length})
              </h3>
              <div className="border border-purple-100 rounded-2xl overflow-hidden shadow-sm bg-white">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-purple-50 text-purple-500 font-black text-[10px] uppercase tracking-widest">
                       <tr>
                          <th className="px-6 py-4">Username</th>
                          <th className="px-6 py-4">Role</th>
                          <th className="px-6 py-4">Password (Visible)</th>
                          <th className="px-6 py-4 text-right">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-50">
                       {users.map(u => (
                          <tr key={u.username} className="hover:bg-purple-50/50 transition-colors">
                             <td className="px-6 py-4 font-bold text-purple-900 flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${u.role === 'admin' ? 'bg-fuchsia-100 text-fuchsia-600' : 'bg-purple-100 text-purple-500'}`}>
                                  <User className="w-4 h-4" />
                                </div>
                                {u.username} 
                                {u.username === currentUser.username && <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-1 rounded-md ml-2 font-black tracking-widest">YOU</span>}
                             </td>
                             <td className="px-6 py-4">
                                <span className={`text-[10px] px-3 py-1.5 rounded-lg uppercase font-black tracking-widest ${u.role === 'admin' ? 'bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200' : 'bg-purple-100 text-purple-600 border border-purple-200'}`}>
                                   {u.role}
                                </span>
                             </td>
                             <td className="px-6 py-4 font-mono text-purple-400 text-xs">{u.password}</td>
                             <td className="px-6 py-4 text-right">
                                {u.username !== 'admin' && u.username !== currentUser.username && (
                                   <button 
                                      onClick={() => handleDelete(u.username, (u as any).uid)}
                                      className="text-purple-300 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-all"
                                      title="Delete User"
                                   >
                                      <Trash2 className="w-4 h-4" />
                                   </button>
                                )}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};

export default UserManagementModal;
