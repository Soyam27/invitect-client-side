'use client';
import { motion } from "framer-motion";

export default function Loader() {
  return (
    <div className="loader-container bg-gradient-to-br from-gray-900 via-black to-gray-800 z-50">
      <div className="flex flex-col items-center justify-center space-y-8">
        
        {/* Modern Glassmorphism Spinner */}
        <div className="relative">
          {/* Outer glow ring */}
          <motion.div
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-400/20 via-blue-500/20 to-purple-600/20 backdrop-blur-sm border border-white/10 shadow-2xl"
            animate={{ rotate: 360 }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: "linear"
            }}
          />
          
          {/* Main spinner */}
          <motion.div
            className="absolute top-2 left-2 w-12 h-12 rounded-full border-2 border-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 p-0.5"
            animate={{ rotate: 360 }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: "linear"
            }}
          >
            <div className="w-full h-full rounded-full bg-gray-900/80 backdrop-blur-sm"></div>
          </motion.div>
          
          {/* Center pulse */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-3 h-3 bg-cyan-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-lg shadow-cyan-400/50"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut"
            }}
          />
        </div>

        {/* Modern Loading Text */}
        <motion.div
          className="flex items-center space-x-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <span className="text-xl font-light text-white/90 tracking-[0.2em]">Loading</span>
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                animate={{
                  y: [-4, 0, -4],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  delay: i * 0.15,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}