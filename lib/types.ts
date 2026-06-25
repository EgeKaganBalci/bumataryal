export interface MaterialFile {
  id: string
  material_id: string
  dosya_url: string
  dosya_adi: string
  created_at: string
}

export interface Material {
  id: string
  created_at: string
  uploader_id: string | null
  baslik: string
  ders_kodu: string
  donem: string | null
  aciklama: string | null
  indirme_sayisi: number
  is_anonymous: boolean
  uploader_name: string | null
  likes: number
  dislikes: number
  file_count: number
}

// Ders kodunu normalize et: boşlukları sil, büyük harfe çevir
// "eem 301" / "Eem301" / "EEM301" -> "EEM301"
export function normalizeDersKodu(s: string): string {
  return s.replace(/\s+/g, '').toUpperCase()
}

// 2020-2021'den 2029-2030'a kadar dönemler (en yeni üstte)
export const DONEMLER: string[] = (() => {
  const arr: string[] = []
  for (let y = 2029; y >= 2020; y--) {
    arr.push(`${y}-${y + 1} Bahar`)
    arr.push(`${y}-${y + 1} Güz`)
  }
  return arr
})()

export const PAGE_SIZE = 20

// İzin verilen dosya uzantıları
export const ALLOWED_EXT = ['pdf', 'doc', 'docx', 'pptx']
export const ALLOWED_ACCEPT = '.pdf,.doc,.docx,.pptx'

// Dosya türüne göre etiket + renk (uzantıdan)
export function fileTypeStyle(filename: string): { label: string; bg: string; text: string } {
  const ext = (filename.split('.').pop() || '').toLowerCase()
  switch (ext) {
    case 'pdf': return { label: 'PDF', bg: 'bg-red-50', text: 'text-red-600' }
    case 'doc':
    case 'docx': return { label: 'DOC', bg: 'bg-blue-50', text: 'text-blue-600' }
    case 'ppt':
    case 'pptx': return { label: 'PPT', bg: 'bg-orange-50', text: 'text-orange-600' }
    default: return { label: (ext || 'dosya').toUpperCase(), bg: 'bg-gray-100', text: 'text-gray-600' }
  }
}
