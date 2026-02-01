"use client";

import { motion } from "framer-motion";
import React from "react";

export function MeshGradient() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#f6f9fc]" />

      {/* Animated Gradient Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 100, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute -left-[10%] -top-[10%] h-[600px] w-[600px] rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-[100px]"
      />

      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -150, 0],
          y: [0, 100, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute -right-[5%] top-[10%] h-[500px] w-[500px] rounded-full bg-gradient-to-r from-blue-400/20 to-cyan-400/20 blur-[100px]"
      />

      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, -100, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute left-[30%] top-[40%] h-[400px] w-[400px] rounded-full bg-gradient-to-r from-pink-400/10 to-rose-400/10 blur-[120px]"
      />

      <motion.div
        animate={{
          scale: [1, 1.4, 1],
          x: [0, -80, 0],
          y: [0, 80, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute left-[10%] bottom-[10%] h-[450px] w-[450px] rounded-full bg-gradient-to-r from-orange-400/10 to-amber-300/10 blur-[100px]"
      />

      {/* Subtle Grid Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />

      {/* Skewed background stripes like Stripe */}
      <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,white,transparent)]">
        <div className="absolute -top-[50%] left-0 right-0 h-[200%] w-full -skew-y-12 bg-gradient-to-b from-transparent via-white/40 to-transparent" />
      </div>
    </div>
  );
}
