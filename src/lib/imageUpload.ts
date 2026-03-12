import { supabase } from './supabase'

const MAX_DIMENSION = 1920
const JPEG_QUALITY = 0.85
const COMPRESS_THRESHOLD = 512 * 1024 // 512 KB

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      let { width, height } = img
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round((height * MAX_DIMENSION) / width)
          width = MAX_DIMENSION
        } else {
          width = Math.round((width * MAX_DIMENSION) / height)
          height = MAX_DIMENSION
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
        'image/jpeg',
        JPEG_QUALITY,
      )
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')) }
    img.src = objectUrl
  })
}

export async function uploadEventImage(
  userId: string,
  file: File,
): Promise<string | null> {
  try {
    // Compress if large or not already JPEG
    let blob: Blob = file
    if (file.size > COMPRESS_THRESHOLD || !file.type.startsWith('image/jpeg')) {
      blob = await compressImage(file)
    }
    const rand = Math.random().toString(36).slice(2, 9)
    const path = `${userId}/${Date.now()}-${rand}.jpg`
    const { error } = await supabase.storage
      .from('event-images')
      .upload(path, blob, { contentType: 'image/jpeg', upsert: false })
    if (error) {
      console.error('uploadEventImage storage error:', error)
      return null
    }
    const { data } = supabase.storage.from('event-images').getPublicUrl(path)
    return data.publicUrl
  } catch (err) {
    console.error('uploadEventImage error:', err)
    return null
  }
}
