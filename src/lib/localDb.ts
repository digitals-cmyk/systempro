export const db = {};
export const getFirestore = () => db;

export const collection = (db: any, path: string) => {
  return { path };
};

export const doc = (dbOrCol: any, pathOrId: string, id?: string) => {
  if (dbOrCol && dbOrCol.path) {
    return { path: dbOrCol.path, id: pathOrId || Math.random().toString(36).substring(2, 15) };
  }
  return { path: pathOrId, id: id || Math.random().toString(36).substring(2, 15) };
};

export const getDocs = async (queryObj: any) => {
  const path = queryObj.path || queryObj;
  const collectionName = path.path || path;
  
  const response = await fetch(`/api/db/${collectionName}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch documents: ${response.statusText}`);
  }
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Server returned non-JSON response. Please ensure the backend server is running.");
  }
  let data = await response.json();
  
  if (queryObj.filters) {
    queryObj.filters.forEach((f: any) => {
      if (f.op === '==') data = data.filter((d: any) => d[f.field] === f.value);
      if (f.op === 'in') data = data.filter((d: any) => f.value.includes(d[f.field]));
    });
  }
  
  return {
    docs: data.map((d: any) => ({
      id: d.id,
      data: () => d
    })),
    forEach: function(callback: any) {
      this.docs.forEach(callback);
    },
    empty: data.length === 0,
    size: data.length
  };
};

export const query = (col: any, ...filters: any[]) => {
  return { path: col.path, filters };
};

export const where = (field: string, op: string, value: any) => {
  return { field, op, value };
};

export const orderBy = (field: string, direction?: string) => {
  return { type: 'orderBy', field, direction };
};

export const addDoc = async (col: any, data: any) => {
  const response = await fetch(`/api/db/${col.path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error(`Failed to add document: ${response.statusText}`);
  }
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Server returned non-JSON response. Please ensure the backend server is running.");
  }
  const result = await response.json();
  return { id: result.id };
};

export const setDoc = async (docRef: any, data: any) => {
  const response = await fetch(`/api/db/${docRef.path}/${docRef.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error(`Failed to set document: ${response.statusText}`);
  }
};

export const updateDoc = async (docRef: any, data: any) => {
  const response = await fetch(`/api/db/${docRef.path}/${docRef.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error(`Failed to update document: ${response.statusText}`);
  }
};

export const deleteDoc = async (docRef: any) => {
  const response = await fetch(`/api/db/${docRef.path}/${docRef.id}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error(`Failed to delete document: ${response.statusText}`);
  }
};

export const writeBatch = (db: any) => {
  const operations: any[] = [];
  return {
    set: (docRef: any, data: any) => {
      operations.push({ type: 'set', docRef, data });
    },
    commit: async () => {
      // For simplicity in this mock, we just execute them sequentially
      for (const op of operations) {
        if (op.type === 'set') {
          await setDoc(op.docRef, op.data);
        }
      }
    }
  };
};

export const getDoc = async (docRef: any) => {
  const response = await fetch(`/api/db/${docRef.path}/${docRef.id}`);
  
  if (response.status === 404) {
    return {
      exists: () => false,
      data: () => null,
      id: docRef.id
    };
  }
  
  if (!response.ok) {
    throw new Error(`Failed to get document: ${response.statusText}`);
  }
  
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Server returned non-JSON response. Please ensure the backend server is running.");
  }
  
  const doc = await response.json();
  
  return {
    exists: () => !!doc,
    data: () => doc,
    id: docRef.id
  };
};
