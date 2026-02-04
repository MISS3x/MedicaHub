'use client'

import { useAdminAuth } from './AdminAuthContext'
import AdminLockScreen from './AdminLockScreen'
import AdminDashboard from './AdminDashboard'

export default function AdminPageClient() {
    const { isAuthenticated } = useAdminAuth()

    if (!isAuthenticated) {
        return <AdminLockScreen />
    }

    return <AdminDashboard />
}
