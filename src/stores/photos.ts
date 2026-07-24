import { ref } from 'vue'
import { defineStore } from 'pinia'

import { addPhoto, deletePhoto, getAllPhotos } from '@/services/photoDb'
import type { Photo } from '@/types/photo'

export const usePhotoStore = defineStore('photos', () => {
  const photos = ref<Photo[]>([])
  const isLoading = ref(false)
  let initialized = false

  async function init() {
    if (initialized) return
    initialized = true
    isLoading.value = true
    try {
      const stored = await getAllPhotos()
      photos.value = stored.map((photo) => ({
        id: photo.id,
        url: URL.createObjectURL(photo.blob),
        createdAt: photo.createdAt,
      }))
    } finally {
      isLoading.value = false
    }
  }

  async function addFiles(files: FileList | File[]) {
    const images = Array.from(files).filter((file) => file.type.startsWith('image/'))
    for (const image of images) {
      const stored = await addPhoto(image)
      photos.value.push({
        id: stored.id,
        url: URL.createObjectURL(stored.blob),
        createdAt: stored.createdAt,
      })
    }
  }

  async function removePhoto(id: string) {
    const index = photos.value.findIndex((photo) => photo.id === id)
    if (index === -1) return
    const [removed] = photos.value.splice(index, 1)
    if (removed) URL.revokeObjectURL(removed.url)
    await deletePhoto(id)
  }

  return { photos, isLoading, init, addFiles, removePhoto }
})
