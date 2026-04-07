import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { collection, getDocs, query, where, addDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../lib/AuthContext';

export default function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMessage, setNewMessage] = useState({ recipientGroup: 'All', content: '' });

  const fetchMessages = async () => {
    if (!user?.schoolId) return;
    try {
      const q = query(collection(db, 'messages'), where('schoolId', '==', user.schoolId));
      const snapshot = await getDocs(q);
      // Sort in memory since we might not have a composite index yet
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      msgs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMessages(msgs);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId) return;

    try {
      await addDoc(collection(db, 'messages'), {
        ...newMessage,
        schoolId: user.schoolId,
        senderId: user.uid,
        senderName: user.fullName || user.email,
        createdAt: new Date().toISOString()
      });

      setShowAddModal(false);
      setNewMessage({ recipientGroup: 'All', content: '' });
      fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      await deleteDoc(doc(db, 'messages', id));
      fetchMessages();
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-900">Messages</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Send Message
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-slate-200">
          {messages.map((msg) => (
            <li key={msg.id} className="px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 text-slate-400 mr-2" />
                  <span className="text-sm font-medium text-slate-900">To: {msg.recipientGroup}</span>
                  <span className="ml-4 text-xs text-slate-500">From: {msg.senderName}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-slate-500">{new Date(msg.createdAt).toLocaleString()}</span>
                  <button onClick={() => handleDeleteMessage(msg.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-700">{msg.content}</p>
            </li>
          ))}
          {messages.length === 0 && (
            <li className="px-6 py-4 text-center text-slate-500">No messages found.</li>
          )}
        </ul>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-medium mb-4">Send Message</h2>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Recipient Group</label>
                <select
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  value={newMessage.recipientGroup}
                  onChange={e => setNewMessage({...newMessage, recipientGroup: e.target.value})}
                >
                  <option value="All">All</option>
                  <option value="Teachers">Teachers</option>
                  <option value="Parents">Parents</option>
                  <option value="Students">Students</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Message Content</label>
                <textarea
                  required
                  rows={4}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  value={newMessage.content}
                  onChange={e => setNewMessage({...newMessage, content: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
