'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function InactivityTimer() {
    const router = useRouter()
    const pathname = usePathname()
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        // Don't apply timeout on hub or admin pages
        if (pathname === '/hub' || pathname?.startsWith('/admin')) {
            return
        }

        const resetTimer = () => {
            // Clear existing timer
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }

            // Set new 30-second timer
            timeoutRef.current = setTimeout(() => {
                router.push('/hub')
            }, 30000) // 30 seconds
        }

        // Activity events to track
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']

        // Add listeners
        events.forEach(event => {
            document.addEventListener(event, resetTimer, true)
        })

        // Start initial timer
        resetTimer()

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
            events.forEach(event => {
                document.removeEventListener(event, resetTimer, true)
            })
        }
    }, [pathname, router])

    return null
}
