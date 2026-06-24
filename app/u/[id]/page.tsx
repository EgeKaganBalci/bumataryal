'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Material } from '@/lib/types'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ThumbsUp, ThumbsDown, Eye, FileText, User as UserIcon, EyeOff } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

export default function ProfilePage() {
  const params = useParams()
  const profileId = params.id as string
  const [profileName, setProfileName] = useState<string>('')
  const [profileExists, setProfileExists] = useState(true)
  const [materials, setMaterials] = useState<Material[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    (async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)
      const isOwner = u?.id === profileId

      const { data: prof } = await supabase.from('profiles').select('display_name').eq('id', profileId).maybeSingle()
      if (!prof) { setProfileExists(false); setLoading(false); return }
      setProfileName(prof.display_name || 'Kullanıcı')

      let q = supabase
        .from('materials_with_stats')
        .select('*')
        .eq('uploader_id', profileId)
        .order('created_at', { ascending: false })

      // Başkası bakıyorsa sadece anonim olmayanları göster
      if (!isOwner) q = q.eq('is_anonymous', false)

      const { data } = await q
      setMaterials((data as Material[]) || [])
      setLoading(false)
    })()
  }, [profileId])

  const isOwner = user?.id === profileId

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" /></div>
  if (!profileExists) return <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500">Kullanıcı bulunamadı. <Link href="/" className="text-blue-600">Ana sayfa</Link></div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition">
        <ArrowLeft size={15} /> Ana sayfa
      </Link>

      {/* Profil başlığı */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0" style={{ background: 'var(--bu-navy)' }}>
          {profileName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{profileName}</h1>
          <p className="text-sm text-gray-500">
            {materials.length} paylaşım
            {isOwner && <span className="ml-1 text-gray-400">· bu senin profilin</span>}
          </p>
        </div>
      </div>

      {isOwner && (
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-4">
          <EyeOff size={14} className="text-blue-500" />
          Anonim yüklediğin notlar sadece sana görünür ve "Anonim" rozetiyle işaretlidir. Başkaları bu notları profilinde göremez.
        </div>
      )}

      {/* Paylaşımlar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Başlık</th>
                <th className="px-4 py-3 font-medium">Ders Kodu</th>
                <th className="px-4 py-3 font-medium">Dönem</th>
                <th className="px-4 py-3 font-medium">Tarih</th>
                <th className="px-4 py-3 font-medium text-center">Beğeni</th>
                <th className="px-4 py-3 font-medium text-right">Detay</th>
              </tr>
            </thead>
            <tbody>
              {materials.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center text-gray-400">
                  <FileText size={36} className="mx-auto text-gray-300 mb-2" />
                  <p>Henüz paylaşım yok.</p>
                </td></tr>
              ) : materials.map(m => (
                <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <Link href={`/material/${m.id}`} className="font-medium text-gray-900 hover:text-blue-600 transition">{m.baslik}</Link>
                    {m.file_count > 1 && <span className="ml-2 text-xs text-gray-400">({m.file_count} dosya)</span>}
                    {isOwner && m.is_anonymous && (
                      <span className="ml-2 inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full align-middle">
                        <EyeOff size={9} /> Anonim
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3"><span className="font-mono font-semibold text-gray-700">{m.ders_kodu}</span></td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{m.donem || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(m.created_at).toLocaleDateString('tr-TR')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><ThumbsUp size={12} /> {m.likes}</span>
                      <span className="flex items-center gap-1"><ThumbsDown size={12} /> {m.dislikes}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/material/${m.id}`} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                      <Eye size={13} /> Detaylar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
