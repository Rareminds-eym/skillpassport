'use client'

import React from 'react'
import { Bolt } from 'lucide-react'
import { ShinyButton } from './shiny-button'

// Ray Background with Bottom Wave Effect
function RayBackground() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none">
      <div className="absolute inset-0 bg-white" />
      <div 
        className="absolute left-1/2 -translate-x-1/2 w-[4000px] h-[1800px] sm:w-[6000px]"
        style={{
          background: `radial-gradient(circle at center 800px, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.04) 14%, rgba(59, 130, 246, 0.02) 18%, rgba(59, 130, 246, 0.01) 22%, rgba(255, 255, 255, 0.5) 25%)`
        }}
      />
      
      {/* Bottom Blue Circular Wave Effect - Responsive */}
      <div 
        className="absolute bottom-0 left-1/2 w-[1200px] h-[600px] sm:w-[1800px] sm:h-[900px] md:w-[2400px] md:h-[1200px] lg:w-[3043px] lg:h-[1500px]"
        style={{ transform: 'translate(-50%, 50%)' }}
      >
        <div className="absolute w-full h-full rounded-full -mt-[13px]" style={{ background: 'radial-gradient(43.89% 25.74% at 50.02% 2.76%, #ffffff 0%, #ffffff 100%)', border: '12px solid #93c5fd', zIndex: 5 }} />
        <div className="absolute w-full h-full rounded-full bg-white -mt-[11px]" style={{ border: '18px solid #bfdbfe', zIndex: 4 }} />
        <div className="absolute w-full h-full rounded-full bg-white -mt-[8px]" style={{ border: '18px solid #dbeafe', zIndex: 3 }} />
        <div className="absolute w-full h-full rounded-full bg-white -mt-[4px]" style={{ border: '18px solid #eff6ff', zIndex: 2 }} />
        <div className="absolute w-full h-full rounded-full bg-white" style={{ border: '16px solid #bfdbfe', boxShadow: '0 15px 24.8px rgba(59, 130, 246, 0.15)', zIndex: 1 }} />
      </div>
    </div>
  )
}

// ANNOUNCEMENT BADGE COMPONENT
function AnnouncementBadge({ text, href = "#" }: { text: string; href?: string }) {
  const content = (
    <>
      <span className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none opacity-70 mix-blend-overlay" style={{ background: 'radial-gradient(ellipse at center top, rgba(59, 130, 246, 0.15) 0%, transparent 70%)' }} />
      <span className="absolute -top-px left-1/2 -translate-x-1/2 h-[2px] w-[100px] opacity-60" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.8) 20%, rgba(99, 102, 241, 0.8) 50%, rgba(59, 130, 246, 0.8) 80%, transparent 100%)', filter: 'blur(0.5px)' }} />
      <Bolt className="size-4 relative z-10 text-blue-600" />
      <span className="relative z-10 text-gray-900 font-medium">{text}</span>
    </>
  )

  const className = "relative inline-flex items-center gap-2 px-5 py-2 min-h-[40px] rounded-full text-sm overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
  const style = {
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
    backdropFilter: 'blur(20px) saturate(140%)',
    boxShadow: 'inset 0 1px rgba(255,255,255,0.8), inset 0 -1px rgba(59, 130, 246, 0.1), 0 8px 32px -8px rgba(59, 130, 246, 0.2), 0 0 0 1px rgba(59, 130, 246, 0.15)'
  }

  return href !== '#' ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style}>{content}</a>
  ) : (
    <button className={className} style={style}>{content}</button>
  )
}

// MAIN BOLT CHAT COMPONENT
interface BoltChatProps {
  title?: string
  subtitle?: string
  announcementText?: string
  announcementHref?: string
  buttonText?: string
  buttonHref?: string
  onButtonClick?: () => void
}

export function BoltStyleChat({
  title = "What will you",
  subtitle = "Create stunning apps & websites by chatting with AI.",
  announcementText = "Introducing Bolt V2",
  announcementHref = "#",
  buttonText = "Get Started",
  buttonHref = "#",
  onButtonClick
}: BoltChatProps) {
  return (
    <div className="relative flex flex-col items-center justify-center py-16 sm:py-20 w-full overflow-hidden bg-white">
      <RayBackground />
      <div className="absolute top-8">
        {/* Announcement badge */}
          <AnnouncementBadge text={announcementText} href={announcementHref} />
        </div>
      {/* Content container */}
      <div className="relative mt-16 flex flex-col items-center justify-center w-full px-4">
        {/* Title section */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-2">
            {title}{' '}
            <span className="bg-gradient-to-b from-[#3b82f6] via-[#2563eb] to-[#1e40af] bg-clip-text text-transparent italic">
              build
            </span>
            {' '}today?
          </h1>
          <p className="text-sm sm:text-base font-semibold text-gray-600">{subtitle}</p>
        </div>

        {/* Shiny Button */}
        <div className="mt-4">
          <ShinyButton href={buttonHref} onClick={onButtonClick}>
            {buttonText}
          </ShinyButton>
        </div>
      </div>
    </div>
  )
}
