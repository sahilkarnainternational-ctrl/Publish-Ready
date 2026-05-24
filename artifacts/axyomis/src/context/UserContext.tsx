import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, getUserProfile, updateUserProfile } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export type ClassLevel =
  | 'Grade 1' | 'Grade 2' | 'Grade 3' | 'Grade 4' | 'Grade 5'
  | 'Grade 6' | 'Grade 7' | 'Grade 8' | 'Grade 9' | 'Grade 10'
  | 'Grade 11' | 'Grade 12' | 'Undergraduate' | 'Postgraduate';

export type Subject = 'Science' | 'Mathematics' | 'Chemistry' | 'Physics' | 'Biology' | 'Astronomy' | 'AI & Computer Science';

export interface ParentInfo {
  name: string;
  email: string;
  whatsapp: string;
}

export interface UserContextType {
  uid: string | null;
  isPremium: boolean;
  premiumTier: 'free' | 'scholar' | 'premium' | 'elite';
  classLevel: ClassLevel | null;
  subjects: Subject[];
  parentInfo: ParentInfo | null;
  displayName: string | null;
  photoURL: string | null;
  hasCompletedOnboarding: boolean;
  setClassLevel: (level: ClassLevel) => void;
  setSubjects: (subjects: Subject[]) => void;
  setParentInfo: (info: ParentInfo) => void;
  completeOnboarding: (data: { classLevel: ClassLevel; subjects: Subject[]; parentInfo?: ParentInfo }) => Promise<void>;
  upgradeToPremium: (tier: 'scholar' | 'premium' | 'elite') => void;
  loading: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [uid, setUid] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumTier, setPremiumTier] = useState<'free' | 'scholar' | 'premium' | 'elite'>('free');
  const [classLevel, setClassLevelState] = useState<ClassLevel | null>(null);
  const [subjects, setSubjectsState] = useState<Subject[]>([]);
  const [parentInfo, setParentInfoState] = useState<ParentInfo | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        setDisplayName(user.displayName);
        setPhotoURL(user.photoURL);
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setClassLevelState((profile as any).classLevel || null);
            setSubjectsState((profile as any).subjects || []);
            setParentInfoState((profile as any).parentInfo || null);
            setHasCompletedOnboarding(!!(profile as any).classLevel);
            const tier = (profile as any).premiumTier || 'free';
            setPremiumTier(tier);
            setIsPremium(tier !== 'free');
            if (profile.displayName) setDisplayName(profile.displayName);
            if (profile.photoURL) setPhotoURL(profile.photoURL);
          }
        } catch {
          // ignore
        }
      } else {
        setUid(null);
        setDisplayName(null);
        setPhotoURL(null);
        setClassLevelState(null);
        setSubjectsState([]);
        setParentInfoState(null);
        setHasCompletedOnboarding(false);
        setPremiumTier('free');
        setIsPremium(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const setClassLevel = useCallback((level: ClassLevel) => {
    setClassLevelState(level);
    if (uid) updateUserProfile(uid, { classLevel: level } as any).catch(() => {});
  }, [uid]);

  const setSubjects = useCallback((s: Subject[]) => {
    setSubjectsState(s);
    if (uid) updateUserProfile(uid, { subjects: s } as any).catch(() => {});
  }, [uid]);

  const setParentInfo = useCallback((info: ParentInfo) => {
    setParentInfoState(info);
    if (uid) updateUserProfile(uid, { parentInfo: info } as any).catch(() => {});
  }, [uid]);

  const completeOnboarding = useCallback(async (data: { classLevel: ClassLevel; subjects: Subject[]; parentInfo?: ParentInfo }) => {
    setClassLevelState(data.classLevel);
    setSubjectsState(data.subjects);
    if (data.parentInfo) setParentInfoState(data.parentInfo);
    setHasCompletedOnboarding(true);
    if (uid) {
      await updateUserProfile(uid, {
        classLevel: data.classLevel,
        subjects: data.subjects,
        ...(data.parentInfo ? { parentInfo: data.parentInfo } : {}),
      } as any);
    }
  }, [uid]);

  const upgradeToPremium = useCallback((tier: 'scholar' | 'premium' | 'elite') => {
    setPremiumTier(tier);
    setIsPremium(true);
    if (uid) updateUserProfile(uid, { premiumTier: tier } as any).catch(() => {});
  }, [uid]);

  return (
    <UserContext.Provider value={{
      uid, isPremium, premiumTier, classLevel, subjects, parentInfo,
      displayName, photoURL, hasCompletedOnboarding,
      setClassLevel, setSubjects, setParentInfo, completeOnboarding,
      upgradeToPremium, loading,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
