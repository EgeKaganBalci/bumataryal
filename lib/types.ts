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
