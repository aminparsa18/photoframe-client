const DB_NAME = 'photoframe'
const DB_VERSION = 1
const STORE_NAME = 'photos'

export interface StoredPhoto {
  id: string
  blob: Blob
  createdAt: number
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function addPhoto(blob: Blob): Promise<StoredPhoto> {
  const db = await openDb()
  const photo: StoredPhoto = { id: crypto.randomUUID(), blob, createdAt: Date.now() }
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).add(photo)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
  return photo
}

export async function getAllPhotos(): Promise<StoredPhoto[]> {
  const db = await openDb()
  try {
    const photos = await new Promise<StoredPhoto[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const request = tx.objectStore(STORE_NAME).getAll()
      request.onsuccess = () => resolve(request.result as StoredPhoto[])
      request.onerror = () => reject(request.error)
    })
    return photos.sort((a, b) => a.createdAt - b.createdAt)
  } finally {
    db.close()
  }
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}
