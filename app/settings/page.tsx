'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User as UserIcon, Lock, CheckCircle, AlertCircle, Save } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [newPassword2, setNewPassword2] = useState('')
  const [savingPass, setSavingPass] = useState(false)
  const [passMsg, setPassMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    (async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/auth'); return }
      setUser(u)
      const { data } = await supabase.from('profiles').select('display_name').eq('id', u.id).single()
      setDisplayName(data?.display_name || '')
      setLoading(false)
    })()
  }, [])

  const saveName = async () => {
    setNameMsg(null)
    if (!displayName.trim()) { setNameMsg({ ok: false, text: 'Kullanıcı adı boş olamaz' }); return }
    setSavingName(true)
    const { error } = await supabase.from('profiles').update({ display_name: displayName.trim() }).eq('id', user!.id)
    if (error) setNameMsg({ ok: false, text: 'Güncellenemedi: ' + error.message })
    else setNameMsg({ ok: true, text: 'Kullanıcı adın güncellendi' })
    setSavingName(false)
  }

  const savePassword = async () => {
    setPassMsg(null)
    if (newPassword.length < 6) { setPassMsg({ ok: false, text: 'Şifre en az 6 karakter olmalı' }); return }
    if (newPassword !== newPassword2) { setPassMsg({ ok: false, text: 'Şifreler eşleşmiyor' }); return }
    setSavingPass(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setPassMsg({ ok: false, text: 'Güncellenemedi: ' + error.message })
    else { setPassMsg({ ok: true, text: 'Şifren güncellendi' }); setNewPassword(''); setNewPassword2('') }
    setSavingPass(false)
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" /></div>

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Link href={`/u/${user?.id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition">
        <ArrowLeft size={15} /> Profilim
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Hesap Ayarları</h1>

      {/* Kullanıcı adı */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-5">
        <div className="flex items-center gap-2 mb-4">
          <UserIcon size={16} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-800">Kullanıcı Adı</h2>
        </div>
        <input value={displayName} onChange={e => setDisplayName(e.target.value)}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
        <p className="text-xs text-gray-400 mt-1.5">Bu ad, anonim olmayan paylaşımlarında ve profilinde görünür.</p>
        {nameMsg && (
          <div className={`flex items-center gap-2 mt-3 p-2.5 rounded-lg text-sm ${nameMsg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {nameMsg.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {nameMsg.text}
          </div>
        )}
        <button onClick={saveName} disabled={savingName}
          className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-60" style={{ background: 'var(--bu-navy)' }}>
          <Save size={14} /> {savingName ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>

      {/* Şifre */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={16} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-800">Şifre Değiştir</h2>
        </div>
        <div className="space-y-3">
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Yeni şifre"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
          <input type="password" value={newPassword2} onChange={e => setNewPassword2(e.target.value)} placeholder="Yeni şifre (tekrar)"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
        </div>
        {passMsg && (
          <div className={`flex items-center gap-2 mt-3 p-2.5 rounded-lg text-sm ${passMsg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {passMsg.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {passMsg.text}
          </div>
        )}
        <button onClick={savePassword} disabled={savingPass}
          className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-60" style={{ background: 'var(--bu-navy)' }}>
          <Save size={14} /> {savingPass ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
        </button>
      </div>
    </div>
  )
}
