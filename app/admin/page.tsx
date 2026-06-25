'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Profile, Material, Log } from '@/lib/types'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Users, Ban, FileText, ScrollText,
  Shield, ShieldOff, Trash2, Pencil, UserCheck, UserX,
  Crown, ChevronDown
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'

type Tab = 'overview' | 'users' | 'banned' | 'materials' | 'logs'

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const [myRole, setMyRole] = useState<string>('')
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState<(Profile & { email: string; material_count?: number })[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const [stats, setStats] = useState({ users: 0, notes: 0, downloads: 0, banned: 0 })
  const [banModal, setBanModal] = useState<{ id: string; name: string } | null>(null)
  const [banReason, setBanReason] = useState('')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    (async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/auth'); return }
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', u.id).single()
      if (!prof || !['founder', 'admin'].includes(prof.role)) { router.push('/'); return }
      setUser(u)
      setMyRole(prof.role)
      setLoading(false)
      loadAll()
    })()
  }, [])

  const loadAll = useCallback(async () => {
    // Kullanıcılar (profiller + email auth.users'dan gelmiyor, profiles'daki email var)
    const { data: profs } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setProfiles((profs as any[]) || [])

    // İstatistikler
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { count: noteCount } = await supabase.from('materials').select('*', { count: 'exact', head: true })
    const { count: bannedCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', true)
    const { data: dlData } = await supabase.from('materials').select('indirme_sayisi')
    const totalDl = dlData?.reduce((sum, m) => sum + (m.indirme_sayisi || 0), 0) || 0
    setStats({ users: userCount || 0, notes: noteCount || 0, downloads: totalDl, banned: bannedCount || 0 })

    // Notlar (admin görünümü — tüm notlar, anonim dahil sahibi görünür)
    const { data: mats } = await supabase
      .from('materials_with_stats')
      .select('*')
      .order('created_at', { ascending: false })
    setMaterials(mats || [])

    // Loglar
    const { data: logData } = await supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    setLogs((logData as Log[]) || [])
  }, [])

  const addLog = async (event_type: string, target_id: string, target_name: string, detail: string) => {
    const { data: prof } = await supabase.from('profiles').select('display_name').eq('id', user!.id).single()
    await supabase.from('logs').insert({
      actor_id: user!.id,
      actor_name: prof?.display_name || 'Bilinmiyor',
      event_type, target_id, target_name, detail
    })
  }

  const handleBan = async () => {
    if (!banModal || !banReason.trim()) return
    await supabase.from('profiles').update({
      is_banned: true,
      ban_reason: banReason.trim(),
      banned_at: new Date().toISOString(),
      banned_by: user!.id
    }).eq('id', banModal.id)
    await addLog('BAN', banModal.id, banModal.name, `Sebep: ${banReason.trim()}`)
    setBanModal(null)
    setBanReason('')
    loadAll()
  }

  const handleUnban = async (prof: any) => {
    await supabase.from('profiles').update({ is_banned: false, ban_reason: null, banned_at: null, banned_by: null }).eq('id', prof.id)
    await addLog('UNBAN', prof.id, prof.display_name || prof.email, 'Ban kaldırıldı')
    loadAll()
  }

  const handleRoleChange = async (prof: any, newRole: string) => {
    if (myRole !== 'founder') return
    await supabase.from('profiles').update({ role: newRole }).eq('id', prof.id)
    await addLog('ROLE_CHANGE', prof.id, prof.display_name || prof.email, `Rol: ${prof.role} → ${newRole}`)
    loadAll()
  }

  const handleDeleteMaterial = async (m: any) => {
    if (!confirm(`"${m.baslik}" silinsin mi?`)) return
    await supabase.from('materials').delete().eq('id', m.id)
    await addLog('DELETE_NOTE', m.id, m.baslik, `${m.ders_kodu} — ${m.uploader_name || 'Anonim'}`)
    loadAll()
  }

  const activeProfiles = profiles.filter(p => !p.is_banned)
  const bannedProfiles = profiles.filter(p => p.is_banned)

  const EVENT_LABELS: Record<string, string> = {
    BAN: 'Kullanıcı banlandı',
    UNBAN: 'Ban kaldırıldı',
    ROLE_CHANGE: 'Rol değiştirildi',
    DELETE_NOTE: 'Not silindi',
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" /></div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Shield size={22} className="text-gray-700" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yönetim Paneli</h1>
          <p className="text-sm text-gray-500">Rol: {myRole === 'founder' ? 'Kurucu' : 'Admin'}</p>
        </div>
      </div>

      {/* Sekmeler */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {([
          { id: 'overview', label: 'Genel Bakış', icon: LayoutDashboard },
          { id: 'users', label: 'Kullanıcılar', icon: Users },
          { id: 'banned', label: `Banlılar (${stats.banned})`, icon: Ban },
          { id: 'materials', label: 'Notlar', icon: FileText },
          { id: 'logs', label: 'Loglar', icon: ScrollText },
        ] as { id: Tab; label: string; icon: any }[]).map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${activeTab === t.id ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Genel Bakış */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Toplam Kullanıcı', value: stats.users, icon: Users },
            { label: 'Toplam Not', value: stats.notes, icon: FileText },
            { label: 'Toplam İndirme', value: stats.downloads, icon: FileText },
            { label: 'Banlı Kullanıcı', value: stats.banned, icon: Ban },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Kullanıcılar */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-3">Kullanıcı</th>
                <th className="px-4 py-3">E-posta</th>
                <th className="px-4 py-3">Kayıt</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {activeProfiles.map(p => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      {p.role === 'founder' && <Crown size={14} className="text-yellow-500" />}
                      {p.role === 'admin' && <Shield size={14} className="text-blue-500" />}
                      {p.display_name || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{new Date(p.created_at).toLocaleDateString('tr-TR')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.role === 'founder' ? 'bg-yellow-50 text-yellow-700' : p.role === 'admin' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {p.role === 'founder' ? 'Kurucu' : p.role === 'admin' ? 'Admin' : 'Üye'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {myRole === 'founder' && p.role !== 'founder' && (
                        <button onClick={() => handleRoleChange(p, p.role === 'admin' ? 'member' : 'admin')}
                          title={p.role === 'admin' ? 'Adminliği kaldır' : 'Admin yap'}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition ${p.role === 'admin' ? 'border-gray-200 text-gray-500 hover:bg-gray-50' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`}>
                          {p.role === 'admin' ? <><ShieldOff size={12} /> Kaldır</> : <><UserCheck size={12} /> Admin</>}
                        </button>
                      )}
                      {p.role !== 'founder' && (
                        <button onClick={() => setBanModal({ id: p.id, name: p.display_name || p.email || '?' })}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs border border-red-200 text-red-600 hover:bg-red-50 transition">
                          <UserX size={12} /> Banla
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Banlı Kullanıcılar */}
      {activeTab === 'banned' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {bannedProfiles.length === 0 ? (
            <div className="py-16 text-center text-gray-400"><Ban size={36} className="mx-auto text-gray-300 mb-2" /><p>Banlı kullanıcı yok</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3">Kullanıcı</th>
                  <th className="px-4 py-3">Sebep</th>
                  <th className="px-4 py-3">Banlanma Tarihi</th>
                  <th className="px-4 py-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {bannedProfiles.map(p => (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{p.display_name || '—'}</div>
                      <div className="text-xs text-gray-400">{p.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{p.ban_reason || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{p.banned_at ? new Date(p.banned_at).toLocaleDateString('tr-TR') : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleUnban(p)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs border border-green-200 text-green-600 hover:bg-green-50 transition ml-auto">
                        <Shield size={12} /> Banı Kaldır
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Notlar */}
      {activeTab === 'materials' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3">Başlık</th>
                  <th className="px-4 py-3">Ders</th>
                  <th className="px-4 py-3">Yükleyen</th>
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {materials.map(m => (
                  <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/material/${m.id}`} className="font-medium text-gray-900 hover:text-blue-600">{m.baslik}</Link>
                      {m.is_anonymous && <span className="ml-1.5 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Anonim</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{m.ders_kodu}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {m.uploader_name || '—'}
                      {m.is_anonymous && m.uploader_name && <span className="ml-1 text-orange-500">(gizli)</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{new Date(m.created_at).toLocaleDateString('tr-TR')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/material/${m.id}/edit`} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition"><Pencil size={13} /></Link>
                        <button onClick={() => handleDeleteMaterial(m)} className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loglar */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {logs.length === 0 ? (
            <div className="py-16 text-center text-gray-400"><ScrollText size={36} className="mx-auto text-gray-300 mb-2" /><p>Henüz log yok</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3">Olay</th>
                  <th className="px-4 py-3">Yapan</th>
                  <th className="px-4 py-3">Hedef</th>
                  <th className="px-4 py-3">Detay</th>
                  <th className="px-4 py-3">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        l.event_type === 'BAN' ? 'bg-red-50 text-red-700' :
                        l.event_type === 'UNBAN' ? 'bg-green-50 text-green-700' :
                        l.event_type === 'ROLE_CHANGE' ? 'bg-blue-50 text-blue-700' :
                        l.event_type === 'DELETE_NOTE' ? 'bg-orange-50 text-orange-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {EVENT_LABELS[l.event_type] || l.event_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{l.actor_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{l.target_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{l.detail || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(l.created_at).toLocaleDateString('tr-TR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Ban Modal */}
      {banModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Kullanıcıyı Banla</h2>
            <p className="text-sm text-gray-500 mb-4"><strong>{banModal.name}</strong> adlı kullanıcı banlanacak. Ban sebebini gir:</p>
            <textarea value={banReason} onChange={e => setBanReason(e.target.value)} rows={3} placeholder="Ban sebebi..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none mb-4" />
            <div className="flex gap-2">
              <button onClick={() => { setBanModal(null); setBanReason('') }}
                className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">İptal</button>
              <button onClick={handleBan} disabled={!banReason.trim()}
                className="flex-1 py-2 text-sm font-semibold text-white rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 transition">Banla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
