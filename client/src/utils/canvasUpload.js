import API from './api';

/*
 * Photo handling for the canvas customiser: read a photo's size, shrink it
 * only when it's too big to upload, send it straight to Cloudinary with real
 * progress.
 */

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_LONG_EDGE = 6000;
// Safari refuses to draw canvases over ~16.7M pixels, so never resize past it
const MAX_PIXELS = 16_000_000;
const UPLOADABLE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Pixel size of an image file, as the browser displays it (EXIF rotation applied). */
export const readImageSize = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    resolve({ width: img.naturalWidth, height: img.naturalHeight });
    URL.revokeObjectURL(url);
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    reject(new Error('unreadable'));
  };
  img.src = url;
});

const canvasToBlob = (canvas, quality) => new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));

/**
 * The file to upload: the original whenever it's already a JPG/PNG/WebP within
 * the size limits (no quality lost), else a high-quality JPEG re-encode scaled
 * to fit. Resolves to { file, width, height, resized }.
 */
export const prepareForUpload = async (file, { width, height }) => {
  const scale = Math.min(1, MAX_LONG_EDGE / Math.max(width, height), Math.sqrt(MAX_PIXELS / (width * height)));
  if (UPLOADABLE_TYPES.includes(file.type) && file.size <= MAX_UPLOAD_BYTES && scale === 1) {
    return { file, width, height, resized: false };
  }

  const outWidth = Math.round(width * scale);
  const outHeight = Math.round(height * scale);
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = outWidth;
    canvas.height = outHeight;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, outWidth, outHeight);

    for (const quality of [0.9, 0.85, 0.8, 0.7]) {
      const blob = await canvasToBlob(canvas, quality);
      if (blob && blob.size <= MAX_UPLOAD_BYTES) {
        const name = file.name.replace(/\.[^.]+$/, '') || 'photo';
        return {
          file: new File([blob], `${name}.jpg`, { type: 'image/jpeg' }),
          width: outWidth,
          height: outHeight,
          resized: true,
        };
      }
    }
    throw new Error('too-large');
  } finally {
    URL.revokeObjectURL(url);
  }
};

// POST a form with upload progress; resolves to the parsed JSON response
const postWithProgress = (url, form, { onProgress, signal }) => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', url);
  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) onProgress?.(e.loaded / e.total);
  };
  xhr.onload = () => {
    let body = null;
    try { body = JSON.parse(xhr.responseText); } catch { /* not JSON */ }
    if (xhr.status >= 200 && xhr.status < 300 && body) resolve(body);
    else reject(Object.assign(new Error(body?.error?.message || body?.message || 'Upload failed'), { status: xhr.status }));
  };
  xhr.onerror = () => reject(new Error('Network error'));
  xhr.onabort = () => reject(Object.assign(new Error('Upload cancelled'), { cancelled: true }));
  signal?.addEventListener('abort', () => xhr.abort());
  xhr.send(form);
});

const RATE_LIMITED_MESSAGE = 'Too many uploads. Please wait a few minutes and try again.';

/**
 * Upload a photo for a custom canvas. Goes straight to Cloudinary with a
 * signature from our API; if that can't be set up (e.g. the API hasn't been
 * updated yet), falls back to uploading through the API.
 * Resolves to { url, width, height } (width/height only when Cloudinary says).
 */
export const uploadCanvasPhoto = async (file, { onProgress, signal } = {}) => {
  let signed = null;
  try {
    ({ data: signed } = await API.post('/upload/canvas/signature', null, { signal }));
  } catch (err) {
    if (err.response?.status === 429) throw new Error(RATE_LIMITED_MESSAGE);
    if (signal?.aborted) throw Object.assign(new Error('Upload cancelled'), { cancelled: true });
  }

  if (signed?.signature) {
    const form = new FormData();
    form.append('file', file);
    ['api_key', 'timestamp', 'signature', 'folder', 'public_id', 'allowed_formats'].forEach((key) => {
      const value = key === 'api_key' ? signed.apiKey : signed[key];
      if (value !== undefined) form.append(key, value);
    });
    const result = await postWithProgress(signed.uploadUrl, form, { onProgress, signal });
    return { url: result.secure_url, width: result.width, height: result.height };
  }

  const form = new FormData();
  form.append('image', file);
  try {
    const { data } = await API.post('/upload/canvas', form, {
      signal,
      onUploadProgress: (e) => { if (e.total) onProgress?.(e.loaded / e.total); },
    });
    return { url: data.url };
  } catch (err) {
    if (err.response?.status === 429) throw new Error(RATE_LIMITED_MESSAGE);
    if (signal?.aborted) throw Object.assign(new Error('Upload cancelled'), { cancelled: true });
    throw new Error(err.response?.data?.message || 'Upload failed');
  }
};

/** A size label ("24 x 36", "A4") in inches, portrait: { width, height }. */
const PAPER_SIZES = { A4: { width: 8.3, height: 11.7 }, A3: { width: 11.7, height: 16.5 } };
export const sizeInInches = (label) => {
  if (PAPER_SIZES[label]) return PAPER_SIZES[label];
  const [a, b] = label.split(/\s*x\s*/i).map(Number);
  return { width: Math.min(a, b), height: Math.max(a, b) };
};
