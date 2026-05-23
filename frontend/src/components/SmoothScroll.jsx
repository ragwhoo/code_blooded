import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

export default function SmoothScroll({ children }) {
  const wrapper = useRef(null)
  const content = useRef(null)

  useEffect(() => {
    const w = wrapper.current
    const c = content.current
    if (!w || !c) return

    const lenis = new Lenis({
      wrapper: w,
      content: c,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
    })

    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => lenis.raf(time * 1000))
    gsap.ticker.lagSmoothing(0)

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.08 })

    function isBelowFold(elem) {
      return elem.getBoundingClientRect().top > window.innerHeight * 0.85
    }

    function scan() {
      c.querySelectorAll('[class*="rounded-3xl"]:not(.reveal):not(.revealed)').forEach(card => {
        if (isBelowFold(card)) {
          card.classList.add('reveal')
          observer.observe(card)
        }
      })
    }

    requestAnimationFrame(scan)
    const mo = new MutationObserver(scan)
    mo.observe(c, { childList: true, subtree: true })

    return () => {
      lenis.destroy()
      observer.disconnect()
      mo.disconnect()
      gsap.ticker.lagSmoothing(1)
      ScrollTrigger.getAll().forEach(t => t.kill())
    }
  }, [])

  return (
    <div ref={wrapper} style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      <div ref={content} className="min-h-screen" style={{ background: '#050816' }}>
        {children}
      </div>
    </div>
  )
}