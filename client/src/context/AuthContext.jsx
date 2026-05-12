import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import authService from '../services/authService'

const AuthContext = createContext(null)

const INACTIVITY_LIMIT = 15 * 60 * 1000  // 15 minutes in milliseconds

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user')
        return stored ? JSON.parse(stored) : null
    })
    const [token, setToken] = useState(() => localStorage.getItem('token') || null)
    const [loading, setLoading] = useState(false)

    // useRef so the timer persists without causing re-renders
    const timerRef = useRef(null)

    // ── Auto-logout on inactivity ──────────────────────────────────
    const startTimer = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
            handleAutoLogout()
        }, INACTIVITY_LIMIT)
    }, [])

    const resetTimer = useCallback(() => {
        if (!token) return   // only track if logged in
        startTimer()
    }, [token, startTimer])

    useEffect(() => {
        if (!token) return

        // These events all reset the inactivity countdown
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
        events.forEach(e => window.addEventListener(e, resetTimer))
        startTimer()  // start on mount

        return () => {
            events.forEach(e => window.removeEventListener(e, resetTimer))
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [token, resetTimer, startTimer])

    const handleAutoLogout = () => {
        clearAuth()
        sessionStorage.setItem('auto_logout', 'true')
        window.location.href = '/login'
    }

    const clearAuth = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setToken(null)
        setUser(null)
        if (timerRef.current) clearTimeout(timerRef.current)
    }

    // ── Auth actions ───────────────────────────────────────────────
    const loginUser = async (email, password) => {
        setLoading(true)
        try {
            const res = await authService.login({ email, password })
            const { token: newToken, user: userData } = res.data.data

            localStorage.setItem('token', newToken)
            localStorage.setItem('user', JSON.stringify(userData))
            setToken(newToken)
            setUser(userData)
            return { success: true }
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Login failed.' }
        } finally {
            setLoading(false)
        }
    }

    const registerUser = async (data) => {
        setLoading(true)
        try {
            const res = await authService.register(data)
            const { token: newToken, user: userData } = res.data.data

            localStorage.setItem('token', newToken)
            localStorage.setItem('user', JSON.stringify(userData))
            setToken(newToken)
            setUser(userData)
            return { success: true }
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Registration failed.' }
        } finally {
            setLoading(false)
        }
    }

    const logoutUser = async () => {
        try { await authService.logout() } catch { }
        clearAuth()
        window.location.href = '/login'
    }

    return (
        <AuthContext.Provider value={{
            user, token, loading,
            isAuthenticated: !!token,
            loginUser, registerUser, logoutUser,
        }}>
            {children}
        </AuthContext.Provider>
    )
}

// Custom hook — use this in every component that needs auth
export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be inside AuthProvider')
    return ctx
}