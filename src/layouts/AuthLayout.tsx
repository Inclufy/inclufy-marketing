// src/layouts/AuthLayout.tsx
// Luxury dark authentication layout

import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Brain, Zap, Target } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex bg-[#0a0a0f]">
      {/* Left side — Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>

      {/* Right side — Brand panel */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-[#0f0a1a] to-[#0a0a0f]" />

        {/* Ambient glow */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-rose-500/10 rounded-full blur-[120px]" />
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
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
            </div>

            <h1
              className="text-4xl font-bold mb-3"
              style={{ fontFamily: "'Roboto', sans-serif" }}
            >
              Welcome to Inclufy
            </h1>
            <p className="text-gray-400 mb-10">
              AI-Powered Marketing Excellence
            </p>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-3 text-left mb-10">
              {[
                { icon: Brain, label: 'Brand Memory AI', val: 'Learns your voice' },
                { icon: Zap, label: 'Smart Automation', val: 'Runs 24/7' },
                { icon: Target, label: 'Growth Blueprint', val: 'AI strategy' },
                { icon: Sparkles, label: 'Content Studio', val: '10x faster' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/5 bg-white/[0.03] p-4"
                >
                  <item.icon className="w-4 h-4 text-purple-400 mb-2" />
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.val}</div>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
              <p className="text-sm text-gray-400 italic mb-3">
                "Inclufy replaced four tools for us — content, email, analytics, automation. One platform, powered by AI."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-rose-500 flex items-center justify-center text-white text-xs font-semibold">
                  LN
                </div>
                <div className="text-left">
                  <p className="text-xs font-medium">Leila Nakamura</p>
                  <p className="text-xs text-gray-500">Marketing Director, Skyline SaaS</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
