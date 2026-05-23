import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function AmbientGlow() {
  const ref = useRef(null)

  useEffect(() => {
    const orbs = ref.current?.querySelectorAll('.glow-orb')
    if (!orbs?.length) return
    orbs.forEach((orb, i) => {
      gsap.to(orb, {
        x: () => Math.random() * 120 - 60,
        y: () => Math.random() * 120 - 60,
        scale: 1.4,
        duration: 6 + Math.random() * 4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: i * 1.5,
      })
    })
  }, [])

  return (
    <div ref={ref} className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="glow-orb absolute -top-[10%] -left-[10%] w-[800px] h-[800px] rounded-full opacity-70"
           style={{ background: 'radial-gradient(circle, rgba(108,99,255,0.25) 0%, transparent 65%)' }} />
      <div className="glow-orb absolute -bottom-[15%] -right-[5%] w-[900px] h-[900px] rounded-full opacity-60"
           style={{ background: 'radial-gradient(circle, rgba(110,231,255,0.18) 0%, transparent 65%)' }} />
      <div className="glow-orb absolute top-[40%] -left-[5%] w-[600px] h-[600px] rounded-full opacity-50"
           style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 65%)' }} />
      <div className="glow-orb absolute top-[60%] -right-[10%] w-[500px] h-[500px] rounded-full opacity-40"
           style={{ background: 'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 65%)' }} />
    </div>
  )
}
