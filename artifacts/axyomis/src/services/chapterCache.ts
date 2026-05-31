import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface BookChapter {
  title: string;
  topic: string;
  subject: string;
  classLevel: string;
  curriculum?: string;
  country?: string;
  introduction: string;
  context: string;
  explanation: string;
  formulas?: string;
  examples: string;
  diagramMermaid?: string;
  summary: string[];
  conclusion: string;
  relatedTopics: string[];
  images?: { url: string; caption: string; license?: string }[];
  wikiUrl?: string;
  generatedAt?: string;
}

function normalizeKey(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function chapterCacheId(topic: string, subject: string, classLevel: string, curriculum = '') {
  const baseId = `${normalizeKey(topic)}__${normalizeKey(subject)}__${normalizeKey(classLevel)}`;
  return curriculum ? `${baseId}__${normalizeKey(curriculum)}` : baseId;
}

export async function getCachedChapter(
  topic: string,
  subject: string,
  classLevel: string,
  curriculum = ''
): Promise<BookChapter | null> {
  const id = chapterCacheId(topic, subject, classLevel, curriculum);
  const localKey = `axyomis_chapter_${id}`;
  try {
    const local = sessionStorage.getItem(localKey);
    if (local) return JSON.parse(local) as BookChapter;
  } catch {
    /* ignore */
  }

  try {
    const snap = await getDoc(doc(db, 'chapter_cache', id));
    if (snap.exists()) {
      const data = snap.data() as BookChapter;
      sessionStorage.setItem(localKey, JSON.stringify(data));
      return data;
    }
  } catch (e) {
    console.warn('Firestore chapter cache read failed', e);
  }
  return null;
}

export async function saveCachedChapter(chapter: BookChapter) {
  const id = chapterCacheId(chapter.topic, chapter.subject, chapter.classLevel, chapter.curriculum);
  const localKey = `axyomis_chapter_${id}`;
  sessionStorage.setItem(localKey, JSON.stringify(chapter));
  try {
    await setDoc(doc(db, 'chapter_cache', id), { ...chapter, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) {
    console.warn('Firestore chapter cache write failed', e);
  }
}

export async function loadChapter(
  topic: string,
  subject: string,
  classLevel: string,
  age?: number | null,
  curriculum?: string | null,
  country?: string | null
): Promise<BookChapter> {
  const cached = await getCachedChapter(topic, subject, classLevel, curriculum || '');
  if (cached) return cached;

  const [chapterRes, imagesRes] = await Promise.all([
    fetch('/api/chapter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, subject, classLevel, age, curriculum, country }),
    }),
    fetch(`/api/chapter-images?topic=${encodeURIComponent(topic)}`),
  ]);

  if (!chapterRes.ok) {
    throw new Error('Failed to generate chapter');
  }

  const chapter = (await chapterRes.json()) as BookChapter;
  try {
    const imagesData = await imagesRes.json();
    chapter.images = imagesData.images || [];
  } catch {
    chapter.images = [];
  }

  await saveCachedChapter(chapter);
  return chapter;
}
