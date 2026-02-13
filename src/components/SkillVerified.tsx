'use client'

import React, { useEffect, useRef, useState } from 'react'

export function SkillVerified() {
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true)
        }
      },
      { threshold: 0.3 }
    )

    const currentRef = containerRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [isVisible])

  return (
    <div ref={containerRef} className="flex items-center justify-center w-full h-full">
      <div className="bg-[#F5F5F0] rounded-3xl p-12 flex flex-col items-center justify-center gap-6 w-full max-w-[420px] aspect-square">
        {/* SVG Checkmark Animation */}
        <svg
          width="112"
          height="112"
          viewBox="0 0 100 100"
          className="drop-shadow-sm"
        >
          {/* Circle background */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#86efac"
            strokeWidth="2.5"
            strokeDasharray="282.7"
            strokeDashoffset="282.7"
            className={isVisible ? 'animate-circle-draw' : ''}
          />
          {/* Checkmark path */}
          <path
            d="M 30 50 L 45 65 L 70 35"
            fill="none"
            stroke="#22c55e"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="65"
            strokeDashoffset="65"
            className={isVisible ? 'animate-checkmark-draw' : ''}
          />
        </svg>
        <p className="text-gray-500 text-base font-medium tracking-wide">Verified Skills</p>
      </div>

      <style jsx>{`
        @keyframes checkmarkDraw {
          to {
            stroke-dashoffset: 0;
          }
        }
        
        @keyframes circleDraw {
          to {
            stroke-dashoffset: 0;
          }
        }
        
        .animate-checkmark-draw {
          animation: checkmarkDraw 0.6s ease-out 0.3s forwards;
        }
        
        .animate-circle-draw {
          animation: circleDraw 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
