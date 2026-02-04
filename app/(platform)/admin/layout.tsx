'use client'

import { AdminAuthProvider } from './AdminAuthContext'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminAuthProvider>
            {children}
        </AdminAuthProvider>
    )
}
