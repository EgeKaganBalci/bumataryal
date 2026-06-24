'use client'
import './globals.css'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { LogIn, LogOut, BookOpen, User as UserIcon, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Analytics } from '@vercel/analytics/next'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [displayName, setDisplayName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  const loadProfile = async (u: User | null) => {
    if (!u) { setDisplayName(''); return }
    const { data } = await supabase.from('profiles').select('display_name').eq('id', u.id).single()
    setDisplayName(data?.display_name || u.email?.split('@')[0] || 'Hesabım')
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      loadProfile(data.user)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      loadProfile(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <html lang="tr">
      <body>
        <nav style={{ background: 'var(--bu-navy)' }} className="sticky top-0 z-50 shadow-md">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 text-white hover:opacity-90 transition">
              <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
                <BookOpen size={16} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight">BÜ Materyal</div>
                <div className="text-[10px] text-white/60 leading-tight">Başkent Üniversitesi</div>
              </div>
            </Link>
            <div className="flex items-center gap-1">
              {!loading && (
                <>
                  {user ? (
                    <>
                      <Link href={`/u/${user.id}`} title="Profilim"
                        className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition">
                        <UserIcon size={14} />
                        <span className="hidden sm:inline text-xs font-medium">{displayName}</span>
                      </Link>
                      <Link href="/settings" title="Ayarlar"
                        className="flex items-center text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition">
                        <Settings size={15} />
                      </Link>
                      <button onClick={handleSignOut} title="Çıkış yap"
                        className="flex items-center text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition">
                        <LogOut size={15} />
                      </button>
                    </>
                  ) : (
                    <Link href="/auth" className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-sm px-3 py-1.5 rounded-lg transition">
                      <LogIn size={14} />
                      <span>Giriş Yap</span>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </nav>
        <main className="min-h-screen">{children}</main>
        <footer className="border-t border-gray-200 mt-16 py-8 text-center text-sm text-gray-400">
          BÜ Materyal — Başkent Üniversitesi öğrencileri tarafından, öğrenciler için
        </footer>
        <Analytics />
      </body>
    </html>
  )
}
