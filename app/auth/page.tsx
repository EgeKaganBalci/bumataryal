'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { BookOpen, Mail, Lock, AlertCircle } from 'lucide-react'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async () => {
    setError(''); setSuccess(''); setLoading(true)
    if (!email || !password) { setError('E-posta ve şifre gerekli'); setLoading(false); return }
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı'); setLoading(false); return }

    if (mode === 'register') {
      const { error: e } = await supabase.auth.signUp({ email, password })
      if (e) { setError(e.message); setLoading(false); return }
      setSuccess('Kayıt başarılı! E-postanı doğrula ve giriş yap.')
    } else {
      const { error: e } = await supabase.auth.signInWithPassword({ email, password })
      if (e) { setError('E-posta veya şifre hatalı'); setLoading(false); return }
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--bu-navy)' }}>
            <BookOpen size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">BÜ Materyal</h1>
          <p className="text-sm text-gray-500 mt-1">Başkent Üniversitesi not paylaşım platformu</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex rounded-lg border border-gray-200 p-1 mb-5">
            <button onClick={() => { setMode('login'); setError(''); setSuccess('') }} className={`flex-1 py-1.5 text-sm rounded-md transition font-medium ${mode === 'login' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
              Giriş Yap
            </button>
            <button onClick={() => { setMode('register'); setError(''); setSuccess('') }} className={`flex-1 py-1.5 text-sm rounded-md transition font-medium ${mode === 'register' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
              Kayıt Ol
            </button>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" placeholder="E-posta adresi" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="password" placeholder="Şifre" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle size={14} className="flex-shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full mt-4 py-2.5 text-sm font-semibold text-white rounded-lg transition disabled:opacity-60"
            style={{ background: 'var(--bu-navy)' }}>
            {loading ? 'Lütfen bekle...' : mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Herhangi bir e-posta adresiyle kaydolabilirsin
        </p>
      </div>
    </div>
  )
}
