import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare } from 'lucide-react';

export default function Messages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMessage, setNewMessage] = useState({ recipientGroup: 'All', content: '' });

  const fetchMessages = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/school/messages', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setMessages(await res.json());
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch('/api/school/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newMessage)
    });

    if (res.ok) {
      setShowAddModal(false);
      setNewMessage({ recipientGroup: 'All', content: '' });
      fetchMessages();
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
              <div className="flex items-center mb-2">
                <MessageSquare className="h-5 w-5 text-slate-400 mr-2" />
                <span className="text-sm font-medium text-slate-900">To: {msg.recipient_group}</span>
                <span className="ml-auto text-xs text-slate-500">{new Date(msg.created_at).toLocaleString()}</span>
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
