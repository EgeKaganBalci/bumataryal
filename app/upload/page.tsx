'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { DONEMLER, normalizeDersKodu, ALLOWED_EXT, ALLOWED_ACCEPT } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { Upload, CheckCircle, AlertCircle, FileText, X, Plus } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

export default function UploadPage() {
  const [user, setUser] = useState<User | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [baslik, setBaslik] = useState('')
  const [dersKodu, setDersKodu] = useState('')
  const [donem, setDonem] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth')
      else { setUser(data.user); setCheckingAuth(false) }
    })
  }, [])

  const addFiles = (selected: FileList | null) => {
    if (!selected) return
    const arr = Array.from(selected)
    const invalid = arr.find(f => !ALLOWED_EXT.includes((f.name.split('.').pop() || '').toLowerCase()))
    if (invalid) {
      setError(`"${invalid.name}" desteklenmiyor. Sadece PDF, DOC, DOCX, PPTX yüklenebilir.`)
      return
    }
    setError('')
    setFiles(prev => [...prev, ...arr])
  }

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async () => {
    setError('')
    if (!baslik.trim()) { setError('Lütfen bir başlık girin'); return }
    if (!dersKodu.trim()) { setError('Lütfen ders kodunu girin'); return }
    if (files.length === 0) { setError('Lütfen en az bir dosya seçin'); return }
    setUploading(true)

    // 1. Materyal kaydı oluştur
    const { data: mat, error: matErr } = await supabase.from('materials').insert({
      uploader_id: user!.id,
      baslik: baslik.trim(),
      ders_kodu: normalizeDersKodu(dersKodu),
      donem: donem || null,
      aciklama: aciklama.trim() || null,
      is_anonymous: isAnonymous,
    }).select().single()

    if (matErr || !mat) { setError('Kayıt oluşturulamadı: ' + (matErr?.message || '')); setUploading(false); return }

    // 2. Dosyaları yükle
    const fileRows: { material_id: string; dosya_url: string; dosya_adi: string }[] = []
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      setProgress(`Dosya yükleniyor (${i + 1}/${files.length})...`)
      const ext = f.name.split('.').pop()
      const path = `${mat.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage.from('materials').upload(path, f)
      if (upErr) { setError(`"${f.name}" yüklenemedi: ${upErr.message}`); setUploading(false); return }
      const { data: { publicUrl } } = supabase.storage.from('materials').getPublicUrl(path)
      fileRows.push({ material_id: mat.id, dosya_url: publicUrl, dosya_adi: f.name })
    }

    // 3. Dosya kayıtlarını ekle
    const { error: filesErr } = await supabase.from('material_files').insert(fileRows)
    if (filesErr) { setError('Dosya kayıtları eklenemedi: ' + filesErr.message); setUploading(false); return }

    setSuccess(true)
    setUploading(false)
  }

  if (checkingAuth) return <div className="flex items-center justify-center min-h-screen"><div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" /></div>

  if (success) return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="text-center">
        <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Not yüklendi!</h2>
        <p className="text-gray-500 mb-6">{files.length} dosya başarıyla paylaşıldı 🎉</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setSuccess(false); setBaslik(''); setDersKodu(''); setDonem(''); setAciklama(''); setFiles([]); setIsAnonymous(false) }}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Başka yükle</button>
          <button onClick={() => router.push('/')} className="px-4 py-2 text-sm text-white rounded-lg" style={{ background: 'var(--bu-navy)' }}>Ana sayfaya dön</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Not Ekle</h1>
        <p className="text-gray-500 text-sm">Bir derse ait birden fazla dosyayı tek seferde yükleyebilirsin</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Başlık *</label>
          <input value={baslik} onChange={e => setBaslik(e.target.value)} placeholder="örn. EEM301 Çıkmış Final Soruları"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ders Kodu *</label>
            <input value={dersKodu} onChange={e => setDersKodu(e.target.value)} placeholder="EEM301"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-mono uppercase" />
            {dersKodu && <p className="text-xs text-gray-400 mt-1">Görünüm: <span className="font-mono font-semibold">{normalizeDersKodu(dersKodu)}</span></p>}
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
          <textarea value={aciklama} onChange={e => setAciklama(e.target.value.slice(0, 1000))} maxLength={1000} rows={4}
            placeholder="Notlarla ilgili kısa bir açıklama ekleyebilirsin. örn. Hocanın paylaştığı föyler + kendi çözümlerim. Final için yeterli."
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none" />
          <p className="text-xs text-gray-400 mt-1 text-right">{aciklama.length}/1000</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Dosyalar * <span className="text-gray-400 font-normal">(PDF, DOC, DOCX, PPTX — birden fazla seçebilirsin)</span></label>
          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition">
            <input type="file" accept={ALLOWED_ACCEPT} multiple onChange={e => { addFiles(e.target.files); e.target.value = '' }} className="hidden" />
            <div className="text-center text-gray-400">
              <Plus size={24} className="mx-auto mb-1" />
              <span className="text-sm">Dosya ekle (birden fazla seçilebilir)</span>
            </div>
          </label>

          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <FileText size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 flex-1 truncate">{f.name}</span>
                  <span className="text-xs text-gray-400">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                  <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 transition"><X size={15} /></button>
                </div>
              ))}
              <p className="text-xs text-gray-400">{files.length} dosya seçildi</p>
            </div>
          )}
        </div>

        {/* Anonim seçeneği */}
        <label className="flex items-center gap-2.5 px-3 py-2.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
          <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)}
            className="w-4 h-4 rounded accent-[var(--bu-navy)]" />
          <div>
            <span className="text-sm text-gray-700 font-medium">Anonim paylaş</span>
            <p className="text-xs text-gray-400">İşaretlersen adın yerine "Anonim" görünür</p>
          </div>
        </label>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle size={14} className="flex-shrink-0" /> {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={uploading}
          className="w-full py-3 text-sm font-semibold text-white rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: 'var(--bu-navy)' }}>
          {uploading ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{progress || 'Yükleniyor...'}</>) : (<><Upload size={16} />Paylaş</>)}
        </button>
      </div>
    </div>
  )
}
