"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";

import { onAuthStateChanged } from "@/libs/firebase/auth";

export interface FirebaseUserState {
  user: User | null;
  loading: boolean;
}
export function useFirebaseUser(): FirebaseUserState {
  const [state, setState] = useState<FirebaseUserState>({
    user: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      setState({ user, loading: false });
    });

    return () => unsubscribe();
  }, []);

  return state;
}
