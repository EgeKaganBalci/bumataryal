'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Material, DONEMLER, PAGE_SIZE } from '@/lib/types'
import { Search, ThumbsUp, ThumbsDown, FileText, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Upload } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export default function HomePage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [myVotes, setMyVotes] = useState<Record<string, number>>({})
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dersKodu, setDersKodu] = useState('')
  const [donem, setDonem] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const fetchMaterials = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('materials_with_stats')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (donem) q = q.eq('donem', donem)
    if (dersKodu) q = q.ilike('ders_kodu', `%${dersKodu.replace(/\s+/g, '')}%`)
    if (search) q = q.ilike('baslik', `%${search}%`)

    const from = (page - 1) * PAGE_SIZE
    q = q.range(from, from + PAGE_SIZE - 1)

    const { data, count } = await q
    const mats = (data as Material[]) || []
    setMaterials(mats)
    setTotal(count || 0)

    // Kullanıcının oylarını çek
    const { data: { user: u } } = await supabase.auth.getUser()
    if (u && mats.length) {
      const { data: votes } = await supabase
        .from('votes')
        .select('material_id, value')
        .eq('user_id', u.id)
        .in('material_id', mats.map(m => m.id))
      const vmap: Record<string, number> = {}
      votes?.forEach(v => { vmap[v.material_id] = v.value })
      setMyVotes(vmap)
    } else {
      setMyVotes({})
    }
    setLoading(false)
  }, [donem, dersKodu, search, page])

  useEffect(() => {
    const t = setTimeout(fetchMaterials, 300)
    return () => clearTimeout(t)
  }, [fetchMaterials])

  // Filtre değişince ilk sayfaya dön
  useEffect(() => { setPage(1) }, [donem, dersKodu, search])

  const handleVote = async (m: Material, value: number) => {
    if (!user) { router.push('/auth'); return }
    const current = myVotes[m.id]
    // Optimistik güncelleme
    setMaterials(prev => prev.map(x => {
      if (x.id !== m.id) return x
      let likes = x.likes, dislikes = x.dislikes
      if (current === 1) likes--
      if (current === -1) dislikes--
      if (current !== value) { if (value === 1) likes++; else dislikes++ }
      return { ...x, likes, dislikes }
    }))
    setMyVotes(prev => {
      const n = { ...prev }
      if (current === value) delete n[m.id]
      else n[m.id] = value
      return n
    })

    if (current === value) {
      await supabase.from('votes').delete().eq('material_id', m.id).eq('user_id', user.id)
    } else {
      await supabase.from('votes').upsert({ material_id: m.id, user_id: user.id, value })
    }
  }

  const handleDelete = async (m: Material) => {
    if (!confirm(`"${m.baslik}" silinsin mi? Bu işlem geri alınamaz.`)) return
    await supabase.from('materials').delete().eq('id', m.id)
    fetchMaterials()
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Ders Notları</h1>
          <p className="text-gray-500 text-sm">Başkent Üniversitesi öğrencilerinin paylaştığı notlara eriş</p>
        </div>
        <Link href="/upload" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white transition" style={{ background: 'var(--bu-navy)' }}>
          <Upload size={15} /> Not Ekle
        </Link>
      </div>

      {/* Arama + Filtre */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 mb-5 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Başlıkta ara..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
        </div>
        <div className="relative">
          <FileText size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={dersKodu} onChange={e => setDersKodu(e.target.value)} placeholder="Ders kodu (örn. EEM301)"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-mono uppercase" />
        </div>
        <select value={donem} onChange={e => setDonem(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
          <option value="">Tüm dönemler</option>
          {DONEMLER.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Başlık</th>
                <th className="px-4 py-3 font-medium">Ders Kodu</th>
                <th className="px-4 py-3 font-medium">Dönem</th>
                <th className="px-4 py-3 font-medium">Paylaşan</th>
                <th className="px-4 py-3 font-medium">Tarih</th>
                <th className="px-4 py-3 font-medium text-center">Beğeni</th>
                <th className="px-4 py-3 font-medium text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-gray-400">
                  <div className="inline-flex items-center gap-2"><div className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />Yükleniyor...</div>
                </td></tr>
              ) : materials.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-gray-400">
                  <FileText size={36} className="mx-auto text-gray-300 mb-2" />
                  <p>Henüz not yok veya arama sonucu bulunamadı.</p>
                </td></tr>
              ) : materials.map(m => {
                const mine = user && user.id === m.uploader_id
                const myVote = myVotes[m.id]
                return (
                  <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <Link href={`/material/${m.id}`} className="font-medium text-gray-900 hover:text-blue-600 transition">
                        {m.baslik}
                      </Link>
                      {m.file_count > 1 && <span className="ml-2 text-xs text-gray-400">({m.file_count} dosya)</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setDersKodu(m.ders_kodu); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                        title={`${m.ders_kodu} derslerini filtrele`}
                        className="font-mono font-semibold text-gray-700 hover:text-blue-600 hover:underline transition cursor-pointer">
                        {m.ders_kodu}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{m.donem || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {m.is_anonymous ? (
                        <span className="text-gray-400 italic">Anonim</span>
                      ) : m.uploader_id ? (
                        <Link href={`/u/${m.uploader_id}`} className="hover:text-blue-600 hover:underline transition">{m.uploader_name || '—'}</Link>
                      ) : (m.uploader_name || '—')}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(m.created_at).toLocaleDateString('tr-TR')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleVote(m, 1)} title="Beğen"
                          className={`flex items-center gap-1 px-1.5 py-1 rounded-md text-xs transition ${myVote === 1 ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-100'}`}>
                          <ThumbsUp size={13} /> {m.likes}
                        </button>
                        <button onClick={() => handleVote(m, -1)} title="Beğenme"
                          className={`flex items-center gap-1 px-1.5 py-1 rounded-md text-xs transition ${myVote === -1 ? 'bg-red-100 text-red-700' : 'text-gray-500 hover:bg-gray-100'}`}>
                          <ThumbsDown size={13} /> {m.dislikes}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/material/${m.id}`} title="Detaylar"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                          <Eye size={13} /> Detaylar
                        </Link>
                        {mine && (
                          <>
                            <Link href={`/material/${m.id}/edit`} title="Düzenle"
                              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
                              <Pencil size={13} />
                            </Link>
                            <button onClick={() => handleDelete(m)} title="Sil"
                              className="p-1.5 rounded-lg border border-gray-200 text-red-500 hover:bg-red-50 transition">
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">
            <ChevronLeft size={14} /> Önceki
          </button>
          <span className="text-sm text-gray-500 px-2">Sayfa {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">
            Sonraki <ChevronRight size={14} />
          </button>
        </div>
      )}
      {!loading && total > 0 && <p className="text-center text-xs text-gray-400 mt-3">Toplam {total} not</p>}
    </div>
  )
}
