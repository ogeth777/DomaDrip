'use client'

import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useState } from 'react'

export function LivingBackground() {
  const [isMounted, setIsMounted] = useState(false)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 })

  // Tilt effects for the grid
  const rotateX = useSpring(useMotionValue(60), { stiffness: 50, damping: 20 })
  const rotateY = useSpring(useMotionValue(0), { stiffness: 50, damping: 20 })

  useEffect(() => {
    setIsMounted(true)
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
      
      // Calculate tilt based on mouse position
      const xPct = (e.clientX / window.innerWidth - 0.5) * 10
      const yPct = (e.clientY / window.innerHeight - 0.5) * 10
      rotateX.set(60 - yPct)
      rotateY.set(xPct)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY, rotateX, rotateY])

  return (
    <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none bg-[#010101]">
      {/* Dynamic Cursor Glow */}
      <motion.div
        style={{
          left: springX,
          top: springY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        className="absolute w-[800px] h-[800px] bg-blue-600/5 blur-[120px] rounded-full opacity-60"
      />

      {/* Static Background Blobs */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.4, 0.3],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-900/10 blur-[150px] rounded-full"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-purple-900/10 blur-[150px] rounded-full"
      />

      {/* 3D Perspective Grid with Tilt */}
      <div className="absolute inset-0 [perspective:1200px]">
        <motion.div 
          style={{ 
            rotateX: rotateX,
            rotateY: rotateY,
            y: '-25%'
          }}
          className="absolute inset-0 h-[200%] w-full origin-center"
        >
          <motion.div 
            className="absolute inset-0 w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(59, 130, 246, 0.08) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(59, 130, 246, 0.08) 1px, transparent 1px)
              `,
              backgroundSize: '80px 80px',
              maskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent 95%)',
            }}
            animate={{
              backgroundPositionY: ['0px', '80px']
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </motion.div>
      </div>

      {/* Particles only render on client after mount to avoid Hydration Error */}
      {isMounted && (
        <>
          {/* Drip Effect - Particles falling from top */}
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={`drip-${i}`}
              initial={{ 
                x: Math.random() * 2000, 
                y: -100, 
                opacity: 0,
                height: Math.random() * 20 + 20
              }}
              animate={{ 
                y: 1200,
                opacity: [0, 0.4, 0],
              }}
              transition={{ 
                duration: 4 + Math.random() * 4, 
                repeat: Infinity, 
                ease: "linear",
                delay: Math.random() * 10
              }}
              className="absolute w-[1px] bg-gradient-to-b from-blue-400/80 to-blue-500/0 rounded-full"
            />
          ))}

          {/* Floating XP Particles (Data Bits) - Rising from bottom */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`rising-${i}`}
              initial={{ 
                x: Math.random() * 2000, 
                y: 1200, 
                opacity: 0,
                scale: Math.random() * 0.5 + 0.5
              }}
              animate={{ 
                y: -200,
                opacity: [0, 0.6, 0],
              }}
              transition={{ 
                duration: 8 + Math.random() * 10, 
                repeat: Infinity, 
                ease: "linear",
                delay: Math.random() * 15
              }}
              className="absolute w-[2px] h-[10px] bg-blue-400/40 rounded-full"
            />
          ))}
        </>
      )}

      {/* Noise Overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Scanlines Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(255,0,0,0.01),rgba(0,255,0,0.005),rgba(0,0,255,0.01))] bg-[size:100%_4px,3px_100%] pointer-events-none" />
    </div>
  )
}
