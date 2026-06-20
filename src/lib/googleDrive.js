const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink'

export async function uploadToDrive(file, accessToken) {
  const folderId = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID
  const metadata = {
    name: file.name,
    ...(folderId ? { parents: [folderId] } : {}),
  }
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  form.append('file', file)
  const res = await fetch(DRIVE_UPLOAD_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? 'Google Drive upload failed')
  }
  return res.json() // { id, name, webViewLink }
}
