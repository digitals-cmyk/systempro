export const db = {};
export const getFirestore = () => db;

export const collection = (db: any, path: string) => {
  return { path };
};

export const doc = (dbOrCol: any, pathOrId: string, id?: string) => {
  if (dbOrCol && dbOrCol.path) {
    // doc(collection(db, 'users')) or doc(collection(db, 'users'), '123')
    return { path: dbOrCol.path, id: pathOrId || Math.random().toString(36).substring(2, 15) };
  }
  // doc(db, 'users', '123')
  return { path: pathOrId, id: id || Math.random().toString(36).substring(2, 15) };
};

export const getDocs = async (queryObj: any) => {
  const path = queryObj.path || queryObj; // queryObj could be collection or query
  let data = JSON.parse(localStorage.getItem(path.path || path) || '[]');
  
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
    }))
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
  const id = Math.random().toString(36).substring(2, 15);
  const docs = JSON.parse(localStorage.getItem(col.path) || '[]');
  const newDoc = { id, ...data };
  docs.push(newDoc);
  localStorage.setItem(col.path, JSON.stringify(docs));
  return { id };
};

export const setDoc = async (docRef: any, data: any) => {
  const docs = JSON.parse(localStorage.getItem(docRef.path) || '[]');
  const index = docs.findIndex((d: any) => d.id === docRef.id);
  if (index >= 0) {
    docs[index] = { ...docs[index], ...data, id: docRef.id };
  } else {
    docs.push({ ...data, id: docRef.id });
  }
  localStorage.setItem(docRef.path, JSON.stringify(docs));
};

export const updateDoc = async (docRef: any, data: any) => {
  const docs = JSON.parse(localStorage.getItem(docRef.path) || '[]');
  const index = docs.findIndex((d: any) => d.id === docRef.id);
  if (index >= 0) {
    docs[index] = { ...docs[index], ...data };
    localStorage.setItem(docRef.path, JSON.stringify(docs));
  }
};

export const deleteDoc = async (docRef: any) => {
  const docs = JSON.parse(localStorage.getItem(docRef.path) || '[]');
  const filtered = docs.filter((d: any) => d.id !== docRef.id);
  localStorage.setItem(docRef.path, JSON.stringify(filtered));
};

export const writeBatch = (db: any) => {
  const operations: any[] = [];
  return {
    set: (docRef: any, data: any) => {
      operations.push({ type: 'set', docRef, data });
    },
    commit: async () => {
      const paths = [...new Set(operations.map(o => o.docRef.path))];
      paths.forEach(path => {
        const docs = JSON.parse(localStorage.getItem(path as string) || '[]');
        const pathOps = operations.filter(o => o.docRef.path === path);
        pathOps.forEach(op => {
          if (op.type === 'set') {
            const index = docs.findIndex((d: any) => d.id === op.docRef.id);
            if (index >= 0) docs[index] = { ...docs[index], ...op.data, id: op.docRef.id };
            else docs.push({ ...op.data, id: op.docRef.id });
          }
        });
        localStorage.setItem(path as string, JSON.stringify(docs));
      });
    }
  };
};

export const getDoc = async (docRef: any) => {
  const docs = JSON.parse(localStorage.getItem(docRef.path) || '[]');
  const doc = docs.find((d: any) => d.id === docRef.id);
  return {
    exists: () => !!doc,
    data: () => doc
  };
};
