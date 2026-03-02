// src/layouts/AuthLayout.tsx
// Modern authentication layout

import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-950">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600">
        {/* Background patterns */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-30 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500 rounded-full blur-3xl opacity-30 animate-pulse" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-lg"
          >
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold mb-4">
              Welcome to Inclufy
            </h1>
            <p className="text-xl mb-8 text-purple-100">
              AI-Powered Marketing Excellence
            </p>
            
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">10x</div>
                <div className="text-sm text-purple-100">Faster Content Creation</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">85%</div>
                <div className="text-sm text-purple-100">Time Saved</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">200+</div>
                <div className="text-sm text-purple-100">AI Templates</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">24/7</div>
                <div className="text-sm text-purple-100">Smart Automation</div>
              </div>
            </div>

            <div className="mt-12">
              <p className="text-sm text-purple-200">
                "Inclufy transformed how we approach marketing. The AI capabilities are game-changing!"
              </p>
              <div className="flex items-center justify-center gap-3 mt-4">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
                  alt="Sarah Chen"
                  className="w-10 h-10 rounded-full bg-white"
                />
                <div className="text-left">
                  <p className="font-medium">Sarah Chen</p>
                  <p className="text-sm text-purple-200">Marketing Director, TechCorp</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}