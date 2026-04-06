import React, { useState, useEffect } from 'react';
import { Plus, Library as LibraryIcon } from 'lucide-react';

export default function Library() {
  const [books, setBooks] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '', status: 'available' });

  const fetchBooks = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/school/library', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setBooks(await res.json());
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch('/api/school/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newBook)
    });

    if (res.ok) {
      setShowAddModal(false);
      setNewBook({ title: '', author: '', status: 'available' });
      fetchBooks();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-900">Library</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Book
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-slate-200">
          {books.map((book) => (
            <li key={book.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <LibraryIcon className="h-6 w-6 text-slate-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{book.title}</p>
                  <p className="text-sm text-slate-500">By {book.author}</p>
                </div>
              </div>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${book.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {book.status}
              </span>
            </li>
          ))}
          {books.length === 0 && (
            <li className="px-6 py-4 text-center text-slate-500">No books found.</li>
          )}
        </ul>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-medium mb-4">Add New Book</h2>
            <form onSubmit={handleAddBook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Title</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  value={newBook.title}
                  onChange={e => setNewBook({...newBook, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Author</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  value={newBook.author}
                  onChange={e => setNewBook({...newBook, author: e.target.value})}
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
                  Save Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
