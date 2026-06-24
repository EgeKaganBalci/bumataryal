'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Material, MaterialFile } from '@/lib/types'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Download, FileText, ThumbsUp, ThumbsDown, ArrowLeft, Pencil, Trash2, Calendar, User as UserIcon, Hash } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

export default function MaterialDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [material, setMaterial] = useState<Material | null>(null)
  const [filesList, setFilesList] = useState<MaterialFile[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [myVote, setMyVote] = useState<number | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  const load = async () => {
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)

    const { data: mat } = await supabase.from('materials_with_stats').select('*').eq('id', id).single()
    setMaterial(mat as Material)

    const { data: files } = await supabase.from('material_files').select('*').eq('material_id', id).order('created_at')
    setFilesList((files as MaterialFile[]) || [])

    if (u) {
      const { data: v } = await supabase.from('votes').select('value').eq('material_id', id).eq('user_id', u.id).maybeSingle()
      setMyVote(v?.value)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const handleVote = async (value: number) => {
    if (!user) { router.push('/auth'); return }
    if (!material) return
    const current = myVote
    setMaterial(m => {
      if (!m) return m
      let likes = m.likes, dislikes = m.dislikes
      if (current === 1) likes--; if (current === -1) dislikes--
      if (current !== value) { if (value === 1) likes++; else dislikes++ }
      return { ...m, likes, dislikes }
    })
    setMyVote(current === value ? undefined : value)
    if (current === value) {
      await supabase.from('votes').delete().eq('material_id', id).eq('user_id', user.id)
    } else {
      await supabase.from('votes').upsert({ material_id: id, user_id: user.id, value })
    }
  }

  const handleDelete = async () => {
    if (!material) return
    if (!confirm(`"${material.baslik}" silinsin mi? Bu işlem geri alınamaz.`)) return
    await supabase.from('materials').delete().eq('id', id)
    router.push('/')
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" /></div>
  if (!material) return <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500">Not bulunamadı. <Link href="/" className="text-blue-600">Ana sayfaya dön</Link></div>

  const mine = user && user.id === material.uploader_id

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition">
        <ArrowLeft size={15} /> Notlara dön
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{material.baslik}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
              <span className="flex items-center gap-1.5"><Hash size={14} /> <span className="font-mono font-semibold text-gray-700">{material.ders_kodu}</span></span>
              {material.donem && <span className="flex items-center gap-1.5"><Calendar size={14} /> {material.donem}</span>}
              <span className="flex items-center gap-1.5"><UserIcon size={14} /> {material.is_anonymous ? <span className="italic">Anonim</span> : (material.uploader_name || '—')}</span>
              <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(material.created_at).toLocaleDateString('tr-TR')}</span>
            </div>
          </div>
          {mine && (
            <div className="flex gap-2">
              <Link href={`/material/${id}/edit`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                <Pencil size={13} /> Düzenle
              </Link>
              <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-gray-200 text-red-500 hover:bg-red-50 transition">
                <Trash2 size={13} /> Sil
              </button>
            </div>
          )}
        </div>

        {material.aciklama && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{material.aciklama}</p>
          </div>
        )}

        {/* Beğeni */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
          <button onClick={() => handleVote(1)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${myVote === 1 ? 'bg-green-100 text-green-700' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <ThumbsUp size={14} /> {material.likes}
          </button>
          <button onClick={() => handleVote(-1)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${myVote === -1 ? 'bg-red-100 text-red-700' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <ThumbsDown size={14} /> {material.dislikes}
          </button>
        </div>
      </div>

      {/* Dosyalar */}
      <h2 className="text-sm font-semibold text-gray-600 mb-3">Dosyalar ({filesList.length})</h2>
      <div className="space-y-2">
        {filesList.map(f => (
          <div key={f.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <FileText size={18} className="text-blue-600" />
            </div>
            <span className="flex-1 text-sm font-medium text-gray-800 truncate">{f.dosya_adi}</span>
            <a href={f.dosya_url} target="_blank" rel="noopener noreferrer" download
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white transition flex-shrink-0" style={{ background: 'var(--bu-navy)' }}>
              <Download size={14} /> İndir
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
