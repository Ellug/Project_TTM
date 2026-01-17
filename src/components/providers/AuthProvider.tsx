"use client";

import {
  onAuthStateChanged,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";

type AuthContextValue = {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signOutUser: () => Promise<void>;
  isConfigured: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    let profileUnsub: (() => void) | null = null;

    const authUnsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (!currentUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const profileRef = doc(db, "users", currentUser.uid);
      profileUnsub = onSnapshot(profileRef, (snapshot) => {
        if (snapshot.exists()) {
          const firestoreProfile = snapshot.data();
          const authPhotoURL = currentUser.photoURL;
          const firestorePhotoURL = firestoreProfile.photoURL;

          // Sync photo URL from auth provider to Firestore profile
          if (authPhotoURL && authPhotoURL !== firestorePhotoURL) {
            updateDoc(profileRef, { photoURL: authPhotoURL }).catch(() => {
              // Not critical, so we can ignore update errors
            });
          }

          setProfile({
            uid: currentUser.uid,
            email: currentUser.email || "",
            displayName: currentUser.displayName || "",
            nickname: firestoreProfile.nickname || currentUser.displayName || "",
            photoURL: authPhotoURL || firestorePhotoURL || "",
            createdAt: firestoreProfile.createdAt,
            updatedAt: firestoreProfile.updatedAt,
          });
        } else {
          setProfile(null);
        }
        setLoading(false);
      });
    });

    return () => {
      if (profileUnsub) profileUnsub();
      authUnsub();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      signOutUser: async () => {
        await signOut(auth);
      },
      isConfigured: isFirebaseConfigured,
    }),
    [user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
};
