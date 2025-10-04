'use client';
import { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";
import { useRouter } from "next/navigation";
import LoginModal from "./LoginModal";
import { getAuth, signOut, onIdTokenChanged } from "firebase/auth";
import Loader from "./LoaderComponent";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [loginOpen, setLoginOpen] = useState(false);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, (currentUser) => {
      if (!currentUser) {
        setLoginOpen(true);
        // Remove automatic redirect to prevent routing delays
      }
    });
    return () => unsubscribe();
  }, [auth]);

  if (loading) return <Loader />;
  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Please Login</h2>
            <p className="text-gray-300">You need to be logged in to access this page.</p>
          </div>
        </div>
        <LoginModal open={loginOpen} setOpen={setLoginOpen} />
      </>
    );
  }

  return (
    <>
      {children}
      {loginOpen && <LoginModal open={loginOpen} setOpen={setLoginOpen} />}
    </>
  );
}
