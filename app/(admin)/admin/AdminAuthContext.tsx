'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AdminAuthContextType {
    isAuthenticated: boolean
    login: (pin: string) => boolean
    logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

const ADMIN_PIN = '4844'
const STORAGE_KEY = 'admin_authenticated'

export function AdminAuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        // Check if already authenticated in session
        const auth = sessionStorage.getItem(STORAGE_KEY)
        if (auth === 'true') {
            setIsAuthenticated(true)
        }
    }, [])

    const login = (pin: string): boolean => {
        if (pin === ADMIN_PIN) {
            setIsAuthenticated(true)
            sessionStorage.setItem(STORAGE_KEY, 'true')
            return true
        }
        return false
    }

    const logout = () => {
        setIsAuthenticated(false)
        sessionStorage.removeItem(STORAGE_KEY)
    }

    return (
        <AdminAuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AdminAuthContext.Provider>
    )
}

export function useAdminAuth() {
    const context = useContext(AdminAuthContext)
    if (!context) {
        throw new Error('useAdminAuth must be used within AdminAuthProvider')
    }
    return context
}
