import type { ObjectDirective } from 'vue'

let sequence = 0
const cleanups = new WeakMap<HTMLElement, () => void>()

// Shared by icon controls; the body overlay avoids clipping in cards and sidebars.
export const tooltip: ObjectDirective<HTMLElement, string> = {
  mounted(el, { value }) {
    el.setAttribute('aria-label', value)
    const tip = document.createElement('div')
    tip.id = `aw-tooltip-${++sequence}`
    tip.className = 'aw-tooltip'
    tip.setAttribute('role', 'tooltip')
    let hideTimer: ReturnType<typeof setTimeout>
    const hide = () => {
      clearTimeout(hideTimer)
      tip.remove()
      const ids = (el.getAttribute('aria-describedby') ?? '').split(' ').filter(id => id && id !== tip.id)
      if (ids.length) el.setAttribute('aria-describedby', ids.join(' '))
      else el.removeAttribute('aria-describedby')
    }
    const show = () => {
      clearTimeout(hideTimer)
      tip.textContent = el.getAttribute('aria-label')
      document.body.append(tip)
      const rect = el.getBoundingClientRect()
      tip.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - tip.offsetWidth - 8))}px`
      tip.style.top = `${rect.bottom + tip.offsetHeight + 8 < window.innerHeight ? rect.bottom + 6 : Math.max(8, rect.top - tip.offsetHeight - 6)}px`
      const ids = new Set((el.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean))
      ids.add(tip.id)
      el.setAttribute('aria-describedby', [...ids].join(' '))
    }
    const leave = () => { hideTimer = setTimeout(hide, 150) }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') hide() }
    el.addEventListener('mouseenter', show)
    el.addEventListener('focus', show)
    el.addEventListener('mouseleave', leave)
    el.addEventListener('blur', hide)
    el.addEventListener('click', hide)
    tip.addEventListener('mouseenter', () => clearTimeout(hideTimer))
    tip.addEventListener('mouseleave', leave)
    document.addEventListener('keydown', escape)
    window.addEventListener('scroll', hide, true)
    window.addEventListener('resize', hide)
    cleanups.set(el, () => {
      hide()
      el.removeEventListener('mouseenter', show)
      el.removeEventListener('focus', show)
      el.removeEventListener('mouseleave', leave)
      el.removeEventListener('blur', hide)
      el.removeEventListener('click', hide)
      document.removeEventListener('keydown', escape)
      window.removeEventListener('scroll', hide, true)
      window.removeEventListener('resize', hide)
    })
  },
  updated(el, { value }) {
    el.setAttribute('aria-label', value)
    for (const id of (el.getAttribute('aria-describedby') ?? '').split(' ')) {
      const tip = document.getElementById(id)
      if (tip?.classList.contains('aw-tooltip')) tip.textContent = value
    }
  },
  beforeUnmount(el) { cleanups.get(el)?.(); cleanups.delete(el) },
}
