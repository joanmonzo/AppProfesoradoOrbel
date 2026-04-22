import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            if (u) {
                const email = u.email || "";
                const allowed = email.endsWith("@orbelgrupo.com") || email.endsWith("@academiaindustrial.com");

                if (!allowed || !u.emailVerified) {
                    signOut(auth);
                    setUser(null);
                } else {
                    setUser(u);
                }
            } else {
                setUser(null);
            }
            setLoadingAuth(false);
        });

        return () => unsubscribe();
    }, []);

    return { user, setUser, loadingAuth };
};