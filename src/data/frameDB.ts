import { FrameData } from './frames.ts';

const DB_NAME = 'Life4CutsDB';
const DB_VERSION = 1;
const STORE_NAME = 'custom_frames';

// IndexedDB 인스턴스 오픈
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 저장된 모든 커스텀 프레임 조회
export async function getAllCustomFrames(): Promise<FrameData[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB 조회 실패:', err);
    return [];
  }
}

// 커스텀 프레임 저장 (최대 10개 유지)
export async function saveCustomFrame(frame: FrameData): Promise<FrameData[]> {
  const db = await openDB();
  const existing = await getAllCustomFrames();

  // 최대 10개 초과 시 가장 오래된 것 삭제
  if (existing.length >= 10) {
    const toRemove = existing[existing.length - 1];
    await deleteCustomFrame(toRemove.id);
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(frame);

    tx.oncomplete = async () => {
      const updated = await getAllCustomFrames();
      resolve(updated);
    };
    tx.onerror = () => reject(tx.error);
  });
}

// 커스텀 프레임 삭제
export async function deleteCustomFrame(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
