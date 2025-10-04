'use client'
import { useState, useEffect } from "react";
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { app } from "../firebase/firebaseConfig"; // adjust path to your firebase config

export default function FloatingGlassMorphNavbar({ openLogin }) {
  const [open, setOpen] = useState(false);
  const [featureMenuOpen, setFeatureMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();

  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, [auth]);

  const handleAuthClick = async () => {
    if (isLoggedIn) {
      await signOut(auth);
    } else {
      openLogin();
    }
    setOpen(false);
  };

  // Feature links
  const featureLinks = [
    { label: 'Analyze', href: '/analyze' },
    { label: 'Summarize', href: '/summarize' },
    { label: 'Recommend', href: '/recommendation' },
    { label: 'Compare', href: '/compare' },
    { label: 'Spam Detect', href: '/spamdetection' },
  ];
  const mobileLinks = featureLinks;

  return (
    <div className="fixed top-4 left-0 w-full z-50">
      <div className="relative w-[95vw] max-w-7xl mx-auto rounded-2xl p-2 bg-white/5 border border-white/20 backdrop-blur-xl">
        <nav className="flex items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-lg text-white font-bold">
            Invitect
          </Link>

          {/* Desktop Links - Optimized with prefetch */}
          <div className="hidden md:flex gap-4 ml-auto items-center">
            {pathname === '/' ? null : (
              <div className="relative">
                <button
                  onClick={() => setFeatureMenuOpen(v => !v)}
                  className="group px-3 py-2 rounded-lg text-white/90 hover:bg-white/10 transition flex items-center gap-1 relative"
                >
                  <span className="pr-1">Features</span>
                  <svg
                    className={`w-3 h-3 transition-transform duration-300 ${featureMenuOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"
                  >
                    <path d="M5 7l5 6 5-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="absolute -inset-1 rounded-lg opacity-0 group-hover:opacity-100 bg-gradient-to-r from-indigo-500/10 via-fuchsia-500/10 to-pink-500/10 blur-sm transition" />
                </button>
                {featureMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg overflow-hidden z-50">
                    {featureLinks.map(link => (
                      <Link
                        key={link.href}
                        href={link.href}
                        prefetch={true}
                        className="block px-4 py-2 text-sm text-white/80 hover:bg-white/15"
                        onClick={() => { setFeatureMenuOpen(false); setOpen(false); }}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
            {isLoggedIn && (
              <Link
                href="/dashboard"
                prefetch={true}
                className="px-4 py-2 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 transition"
                onClick={() => setOpen(false)}
              >
                 Dashboard
              </Link>
            )}

            <button
              onClick={handleAuthClick}
              className={`px-4 py-2 rounded-xl font-bold text-white transition ${isLoggedIn ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"}`}
            >
              {isLoggedIn ? "Logout" : "Login"}
            </button>
          </div>

          {/* Hamburger for mobile */}
          <button
            className="ml-auto md:hidden flex flex-col gap-1.5 z-20"
            onClick={() => setOpen(!open)}
          >
            <span className="w-6 h-0.5 bg-white rounded-full"></span>
            <span className="w-6 h-0.5 bg-white rounded-full"></span>
            <span className="w-6 h-0.5 bg-white rounded-full"></span>
          </button>
        </nav>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mt-4 flex flex-col gap-2 md:hidden rounded-xl border border-white/15 bg-white/5 backdrop-blur-xl p-3"
            >
              {mobileLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  prefetch={true}
                  className={`px-3 py-2 rounded-lg text-white/90 hover:bg-gradient-to-r hover:from-indigo-500/30 hover:via-fuchsia-500/30 hover:to-pink-500/30 transition ${pathname === l.href ? 'bg-white/10' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              ))}

              {isLoggedIn && (
                <Link
                  href="/dashboard"
                  prefetch={true}
                  className="mt-1 px-4 py-2 rounded-xl font-bold bg-yellow-400 hover:bg-yellow-300 text-black text-center transition shadow"
                  onClick={() => setOpen(false)}
                >
                  Dashboard
                </Link>
              )}

              <button
                onClick={handleAuthClick}
                className={`px-4 py-2 rounded-xl font-bold text-white text-center transition ${isLoggedIn ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"}`}
              >
                {isLoggedIn ? "Logout" : "Login"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
