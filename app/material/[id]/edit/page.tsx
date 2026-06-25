'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Material, MaterialFile, DONEMLER, normalizeDersKodu, ALLOWED_EXT, ALLOWED_ACCEPT, fileTypeStyle } from '@/lib/types'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, X, Plus, Save, AlertCircle, Trash2, Link as LinkIcon, Pencil, Check } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

interface DriveLink {
  url: string
  name: string
}

export default function EditMaterialPage() {
  const params = useParams()
  const id = params.id as string
  const [user, setUser] = useState<User | null>(null)
  const [baslik, setBaslik] = useState('')
  const [dersKodu, setDersKodu] = useState('')
  const [donem, setDonem] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)

  // Mevcut dosyalar (Supabase)
  const [existingFiles, setExistingFiles] = useState<MaterialFile[]>([])
  const [removedIds, setRemovedIds] = useState<string[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])

  // Mevcut Drive linkleri
  const [existingDriveLinks, setExistingDriveLinks] = useState<MaterialFile[]>([])
  const [removedDriveIds, setRemovedDriveIds] = useState<string[]>([])
  const [editingDriveId, setEditingDriveId] = useState<string | null>(null)
  const [editingDriveUrl, setEditingDriveUrl] = useState('')
  const [editingDriveName, setEditingDriveName] = useState('')

  // Yeni Drive linkleri
  const [newDriveLinks, setNewDriveLinks] = useState<DriveLink[]>([])
  const [showDriveForm, setShowDriveForm] = useState(false)
  const [driveLinkInput, setDriveLinkInput] = useState('')
  const [driveLinkName, setDriveLinkName] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    (async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/auth'); return }
      setUser(u)

      const { data: mat } = await supabase.from('materials').select('*').eq('id', id).single()
      if (!mat) { router.push('/'); return }

      // Admin/kurucu veya yükleyen düzenleyebilir
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', u.id).single()
      const isAdminOrFounder = prof?.role === 'founder' || prof?.role === 'admin'
      if (mat.uploader_id !== u.id && !isAdminOrFounder) { router.push(`/material/${id}`); return }

      setBaslik(mat.baslik); setDersKodu(mat.ders_kodu); setDonem(mat.donem || '')
      setAciklama(mat.aciklama || ''); setIsAnonymous(mat.is_anonymous)

      const { data: files } = await supabase.from('material_files').select('*').eq('material_id', id).order('created_at')
      const allFiles = (files as MaterialFile[]) || []

      // Drive ve normal dosyaları ayır
      const driveFiles = allFiles.filter(f => f.dosya_url.includes('drive.google.com') || f.dosya_url.includes('docs.google.com'))
      const normalFiles = allFiles.filter(f => !f.dosya_url.includes('drive.google.com') && !f.dosya_url.includes('docs.google.com'))

      setExistingFiles(normalFiles)
      setExistingDriveLinks(driveFiles)
      setLoading(false)
    })()
  }, [id])

  const addFiles = (selected: FileList | null) => {
    if (!selected) return
    const arr = Array.from(selected)
    const invalid = arr.find(f => !ALLOWED_EXT.includes((f.name.split('.').pop() || '').toLowerCase()))
    if (invalid) { setError(`"${invalid.name}" desteklenmiyor. Sadece PDF, DOC, DOCX, PPTX.`); return }
    setError('')
    setNewFiles(prev => [...prev, ...arr])
  }

  const addDriveLink = () => {
    if (!driveLinkInput.trim()) { setError('Link boş olamaz'); return }
    setError('')
    setNewDriveLinks(prev => [...prev, { url: driveLinkInput.trim(), name: driveLinkName.trim() || 'Drive Dosyası' }])
    setDriveLinkInput(''); setDriveLinkName(''); setShowDriveForm(false)
  }

  const startEditDrive = (f: MaterialFile) => {
    setEditingDriveId(f.id)
    setEditingDriveUrl(f.dosya_url)
    setEditingDriveName(f.dosya_adi)
  }

  const saveEditDrive = async () => {
    if (!editingDriveId || !editingDriveUrl.trim()) return
    await supabase.from('material_files').update({
      dosya_url: editingDriveUrl.trim(),
      dosya_adi: editingDriveName.trim() || 'Drive Dosyası'
    }).eq('id', editingDriveId)
    setExistingDriveLinks(prev => prev.map(f =>
      f.id === editingDriveId ? { ...f, dosya_url: editingDriveUrl.trim(), dosya_adi: editingDriveName.trim() || 'Drive Dosyası' } : f
    ))
    setEditingDriveId(null)
  }

  const handleSave = async () => {
    setError('')
    if (!baslik.trim()) { setError('Başlık boş olamaz'); return }
    if (!dersKodu.trim()) { setError('Ders kodu boş olamaz'); return }

    const remainingNormal = existingFiles.filter(f => !removedIds.includes(f.id)).length + newFiles.length
    const remainingDrive = existingDriveLinks.filter(f => !removedDriveIds.includes(f.id)).length + newDriveLinks.length
    if (remainingNormal + remainingDrive === 0) { setError('En az bir dosya veya Drive linki olmalı'); return }

    setSaving(true)

    await supabase.from('materials').update({
      baslik: baslik.trim(),
      ders_kodu: normalizeDersKodu(dersKodu),
      donem: donem || null,
      aciklama: aciklama.trim() || null,
      is_anonymous: isAnonymous,
    }).eq('id', id)

    // Silinen normal dosyalar
    if (removedIds.length) await supabase.from('material_files').delete().in('id', removedIds)
    // Silinen Drive linkleri
    if (removedDriveIds.length) await supabase.from('material_files').delete().in('id', removedDriveIds)

    // Yeni normal dosyalar
    const rows: { material_id: string; dosya_url: string; dosya_adi: string }[] = []
    for (const f of newFiles) {
      const ext = f.name.split('.').pop()
      const path = `${id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage.from('materials').upload(path, f)
      if (upErr) { setError(`"${f.name}" yüklenemedi: ${upErr.message}`); setSaving(false); return }
      const { data: { publicUrl } } = supabase.storage.from('materials').getPublicUrl(path)
      rows.push({ material_id: id, dosya_url: publicUrl, dosya_adi: f.name })
    }

    // Yeni Drive linkleri
    for (const dl of newDriveLinks) {
      rows.push({ material_id: id, dosya_url: dl.url, dosya_adi: dl.name })
    }

    if (rows.length) await supabase.from('material_files').insert(rows)

    router.push(`/material/${id}`)
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" /></div>

  const visibleFiles = existingFiles.filter(f => !removedIds.includes(f.id))
  const visibleDriveLinks = existingDriveLinks.filter(f => !removedDriveIds.includes(f.id))

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href={`/material/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition">
        <ArrowLeft size={15} /> Vazgeç
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Notu Düzenle</h1>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Başlık *</label>
          <input value={baslik} onChange={e => setBaslik(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ders Kodu *</label>
            <input value={dersKodu} onChange={e => setDersKodu(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-mono uppercase" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Dönem</label>
            <select value={donem} onChange={e => setDonem(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="">Belirtilmemiş</option>
              {DONEMLER.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Açıklama <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
          </label>
          <textarea value={aciklama} onChange={e => setAciklama(e.target.value.slice(0, 1000))} maxLength={1000} rows={3}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none" />
          <p className="text-xs text-gray-400 mt-1 text-right">{aciklama.length}/1000</p>
        </div>

        {/* Mevcut normal dosyalar */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mevcut Dosyalar</label>
          <div className="space-y-2">
            {visibleFiles.length === 0 && newFiles.length === 0 && <p className="text-xs text-gray-400">Dosya yok.</p>}
            {visibleFiles.map(f => {
              const ft = fileTypeStyle(f.dosya_adi)
              return (
                <div key={f.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${ft.bg} ${ft.text}`}>{ft.label}</span>
                  <span className="text-sm text-gray-700 flex-1 truncate">{f.dosya_adi}</span>
                  <button onClick={() => setRemovedIds(prev => [...prev, f.id])} className="text-gray-400 hover:text-red-500 transition"><Trash2 size={15} /></button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Yeni normal dosya ekle */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Yeni Dosya Ekle <span className="text-gray-400 font-normal">(PDF, DOC, DOCX, PPTX)</span></label>
          <label className="flex items-center justify-center w-full h-16 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition text-gray-400 text-sm gap-2">
            <input type="file" accept={ALLOWED_ACCEPT} multiple onChange={e => { addFiles(e.target.files); e.target.value = '' }} className="hidden" />
            <Plus size={18} /> Dosya ekle
          </label>
          {newFiles.length > 0 && (
            <div className="mt-2 space-y-2">
              {newFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <FileText size={15} className="text-blue-400 flex-shrink-0" />
                  <span className="text-sm text-blue-800 flex-1 truncate">{f.name}</span>
                  <button onClick={() => setNewFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-blue-400 hover:text-red-500 transition"><X size={15} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mevcut Drive linkleri */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Drive Linkleri</label>
          <div className="space-y-2">
            {visibleDriveLinks.length === 0 && newDriveLinks.length === 0 && !showDriveForm && (
              <p className="text-xs text-gray-400">Drive linki yok.</p>
            )}
            {visibleDriveLinks.map(f => (
              <div key={f.id}>
                {editingDriveId === f.id ? (
                  <div className="border border-blue-200 rounded-xl p-3 space-y-2 bg-blue-50">
                    <input value={editingDriveUrl} onChange={e => setEditingDriveUrl(e.target.value)} placeholder="Drive linki"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    <input value={editingDriveName} onChange={e => setEditingDriveName(e.target.value)} placeholder="Dosya adı"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    <div className="flex gap-2">
                      <button onClick={() => setEditingDriveId(null)} className="flex-1 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-white">İptal</button>
                      <button onClick={saveEditDrive} className="flex-1 py-1.5 text-xs font-medium text-white rounded-lg flex items-center justify-center gap-1" style={{ background: 'var(--bu-navy)' }}>
                        <Check size={12} /> Kaydet
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <LinkIcon size={14} className="text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-blue-800 flex-1 truncate">{f.dosya_adi}</span>
                    <span className="text-xs text-blue-400 truncate max-w-[100px] hidden sm:block">{f.dosya_url.slice(0, 25)}...</span>
                    <button onClick={() => startEditDrive(f)} className="text-blue-400 hover:text-blue-600 transition"><Pencil size={14} /></button>
                    <button onClick={() => setRemovedDriveIds(prev => [...prev, f.id])} className="text-blue-400 hover:text-red-500 transition"><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
            ))}

            {/* Yeni Drive linkleri (henüz kaydedilmemiş) */}
            {newDriveLinks.map((dl, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                <LinkIcon size={14} className="text-green-500 flex-shrink-0" />
                <span className="text-sm text-green-800 flex-1 truncate">{dl.name}</span>
                <span className="text-xs text-green-500">Yeni</span>
                <button onClick={() => setNewDriveLinks(prev => prev.filter((_, idx) => idx !== i))} className="text-green-400 hover:text-red-500 transition"><X size={15} /></button>
              </div>
            ))}
          </div>

          {/* Yeni Drive linki ekleme formu */}
          {showDriveForm ? (
            <div className="mt-2 border border-gray-200 rounded-xl p-4 space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Drive linki *</label>
                <input value={driveLinkInput} onChange={e => setDriveLinkInput(e.target.value)} placeholder="https://drive.google.com/..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Dosya adı <span className="text-gray-400">(isteğe bağlı)</span></label>
                <input value={driveLinkName} onChange={e => setDriveLinkName(e.target.value)} placeholder="örn. EEM301 Ders Notları"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setShowDriveForm(false); setDriveLinkInput(''); setDriveLinkName('') }}
                  className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">İptal</button>
                <button onClick={addDriveLink} className="flex-1 py-2 text-sm font-medium text-white rounded-lg" style={{ background: 'var(--bu-navy)' }}>Ekle</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowDriveForm(true)}
              className="mt-2 flex items-center gap-2 w-full justify-center h-14 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-gray-300 hover:bg-gray-50 transition">
              <LinkIcon size={15} /> Drive linki ekle
            </button>
          )}
        </div>

        <label className="flex items-center gap-2.5 px-3 py-2.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
          <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="w-4 h-4 rounded accent-[var(--bu-navy)]" />
          <span className="text-sm text-gray-700 font-medium">Anonim paylaş</span>
        </label>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle size={14} className="flex-shrink-0" /> {error}
          </div>
        )}

        <button onClick={handleSave} disabled={saving}
          className="w-full py-3 text-sm font-semibold text-white rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: 'var(--bu-navy)' }}>
          {saving ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Kaydediliyor...</>) : (<><Save size={16} />Değişiklikleri Kaydet</>)}
        </button>
      </div>
    </div>
  )
}
