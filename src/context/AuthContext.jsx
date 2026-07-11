import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

const DEMO_KEY = 'skate.demoUser'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [demoMode] = useState(!isSupabaseConfigured)

  useEffect(() => {
    let sub
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data }) => {
        setUser(data.session?.user ?? null)
        setLoading(false)
      })
      const { data } = supabase.auth.onAuthStateChange((_e, session) => {
        setUser(session?.user ?? null)
      })
      sub = data.subscription
    } else {
      const raw = localStorage.getItem(DEMO_KEY)
      setUser(raw ? JSON.parse(raw) : null)
      setLoading(false)
    }
    return () => sub?.unsubscribe()
  }, [])

  async function signUp(email, password) {
    if (!isSupabaseConfigured) return demoSignIn(email)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) return { error: error.message }
    if (data.user && !data.session) {
      return { info: 'Account created. Check your email to confirm, then log in.' }
    }
    return {}
  }

  async function signIn(email, password) {
    if (!isSupabaseConfigured) return demoSignIn(email)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return {}
  }

  function demoSignIn(email) {
    const u = { id: 'demo-user', email: email || 'demo@skate.app', demo: true }
    localStorage.setItem(DEMO_KEY, JSON.stringify(u))
    setUser(u)
    return {}
  }

  async function signOut() {
    if (isSupabaseConfigured) await supabase.auth.signOut()
    else localStorage.removeItem(DEMO_KEY)
    setUser(null)
  }

  return (
    <AuthCtx.Provider value={{ user, loading, demoMode, signUp, signIn, signOut, demoSignIn }}>
      {children}
    </AuthCtx.Provider>
  )
}
