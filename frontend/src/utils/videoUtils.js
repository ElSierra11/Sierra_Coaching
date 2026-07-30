/**
 * Video Utilities for Sierra Coaching
 * Handles parsing, embed URL conversion, direct video detection, and fallback exercises.
 */

// Extensive keyword dictionary for 50+ common gym exercises mapped to verified technique videos
const EXERCISE_VIDEO_MAP = [
  // PECHO / CHEST
  { keys: ["press de banca plano", "press banca plano", "press plano", "bench press"], url: "https://www.youtube.com/embed/gViDbVeeXpU" },
  { keys: ["press inclinado", "incline press", "press banca inclinado"], url: "https://www.youtube.com/embed/SrqOu55lrYu" },
  { keys: ["press declinado", "decline press"], url: "https://www.youtube.com/embed/IODxDxX7oi4" },
  { keys: ["cruce de poleas", "cable fly", "aperturas en polea", "aperturas con mancuerna"], url: "https://www.youtube.com/embed/taI4XduLpTk" },
  { keys: ["fondos", "dips", "fondos en paralelas"], url: "https://www.youtube.com/embed/2z8JmcrW-As" },
  { keys: ["banca", "chest", "pecho", "pushup", "flexiones"], url: "https://www.youtube.com/embed/gViDbVeeXpU" },

  // ESPALDA / BACK
  { keys: ["jalón al pecho", "jalon al pecho", "lat pulldown", "jalón prono", "jalon supino"], url: "https://www.youtube.com/embed/kK3hN7rQc34" },
  { keys: ["remo con mancuerna", "dumbbell row", "remo gironda", "remo en máquina", "remo con barra", "remo t"], url: "https://www.youtube.com/embed/roCP6wCXPqo" },
  { keys: ["dominadas", "pull up", "pullups", "chin up"], url: "https://www.youtube.com/embed/eGo4IYlbE5g" },
  { keys: ["pullover", "pull over"], url: "https://www.youtube.com/embed/FK4rHwHG4mo" },
  { keys: ["peso muerto convencional", "deadlift convencional"], url: "https://www.youtube.com/embed/r4MzxtBKyNE" },
  { keys: ["jalon", "espalda", "pulldown", "remo"], url: "https://www.youtube.com/embed/kK3hN7rQc34" },

  // HOMBROS / SHOULDERS
  { keys: ["press militar", "overhead press", "press de hombro", "press arnold"], url: "https://www.youtube.com/embed/xS6Kj6B5q3k" },
  { keys: ["elevaciones laterales", "lateral raises", "vuelos laterales"], url: "https://www.youtube.com/embed/3VcKaXpzqRo" },
  { keys: ["pájaros", "pajaros", "deltoides posterior", "rear delt fly"], url: "https://www.youtube.com/embed/ttvfGg9d76c" },
  { keys: ["face pull", "facepull", "jalón a la cara"], url: "https://www.youtube.com/embed/rep-qVOkqgk" },
  { keys: ["militar", "hombro", "press shoulder"], url: "https://www.youtube.com/embed/xS6Kj6B5q3k" },

  // PIERNAS / LEGS
  { keys: ["sentadilla búlgaras", "sentadilla bulgara", "bulgarian split"], url: "https://www.youtube.com/embed/2C-uNgKwPLE" },
  { keys: ["sentadilla", "squat", "sentadillas"], url: "https://www.youtube.com/embed/yvD5_a6pI7M" },
  { keys: ["prensa", "leg press", "prensa de piernas"], url: "https://www.youtube.com/embed/IZxyjW7MPJQ" },
  { keys: ["peso muerto rumano", "rdl", "stiff leg deadlift"], url: "https://www.youtube.com/embed/JCXUYuzwNrM" },
  { keys: ["peso muerto", "deadlift"], url: "https://www.youtube.com/embed/r4MzxtBKyNE" },
  { keys: ["extensión de cuádriceps", "extension de cuadriceps", "leg extension"], url: "https://www.youtube.com/embed/YyvSfVjQeL0" },
  { keys: ["curl femoral", "leg curl", "femoral tumbado", "femoral sentado"], url: "https://www.youtube.com/embed/1Tq3QdYUuHs" },
  { keys: ["hip thrust", "empuje de cadera"], url: "https://www.youtube.com/embed/SEdqd1n0cvg" },
  { keys: ["zancada", "lunge", "desplante", "zancadas"], url: "https://www.youtube.com/embed/COXYKsn949M" },
  { keys: ["gemelo", "talones", "calf raise", "elevación de talones", "pantorrilla"], url: "https://www.youtube.com/embed/N3awlEyY9uU" },
  { keys: ["pierna", "cuadriceps", "femoral", "gluteo"], url: "https://www.youtube.com/embed/yvD5_a6pI7M" },

  // BRAZOS / ARMS
  { keys: ["curl martillo", "hammer curl"], url: "https://www.youtube.com/embed/zC3nLlEvinU" },
  { keys: ["curl predicador", "curl scott", "preacher curl"], url: "https://www.youtube.com/embed/fIWP-FRFNU0" },
  { keys: ["curl de bíceps", "curl biceps", "biceps curl"], url: "https://www.youtube.com/embed/ly7d1FmB4v8" },
  { keys: ["biceps", "curl"], url: "https://www.youtube.com/embed/ly7d1FmB4v8" },
  { keys: ["copa de tríceps", "copa triceps", "overhead triceps"], url: "https://www.youtube.com/embed/sU1E2dG_dmo" },
  { keys: ["extensión de tríceps polea", "extension de triceps", "pushdown", "jalón tríceps"], url: "https://www.youtube.com/embed/6SS6K3l-x6g" },
  { keys: ["press francés", "skull crusher"], url: "https://www.youtube.com/embed/d_KZxkY_0cM" },
  { keys: ["triceps", "extens", "copa"], url: "https://www.youtube.com/embed/sU1E2dG_dmo" },

  // ABS & CARDIO
  { keys: ["plancha", "plank"], url: "https://www.youtube.com/embed/pSHjTRCQxIw" },
  { keys: ["crunch", "abdominales", "rueda abdominal"], url: "https://www.youtube.com/embed/2pLT-ulgUJs" },
  { keys: ["elevación de piernas", "leg raises"], url: "https://www.youtube.com/embed/HDUhk1Pz500" }
];

/**
 * Normalizes and converts any video URL (YouTube, YouTube Shorts, Vimeo, Google Drive, MP4)
 * into a structured object for optimal playback.
 * 
 * @param {string} rawUrl 
 * @param {string} exerciseName
 * @returns {object} { type, embedUrl, rawUrl, isDirectFile, fallbackSearchUrl }
 */
export function parseVideoUrl(rawUrl, exerciseName = '') {
  const url = (rawUrl || '').trim();
  const fallbackSearchUrl = `https://www.youtube.com/results?search_query=tecnica+ejercicio+${encodeURIComponent(exerciseName || 'gimnasio')}`;

  if (!url) {
    return {
      type: 'none',
      embedUrl: '',
      rawUrl: '',
      isDirectFile: false,
      fallbackSearchUrl
    };
  }

  // 1. Direct Video Files (.mp4, .webm, .mov, .ogg, .m4v, blob:, data:)
  const isDirectFile = /\.(mp4|webm|mov|ogg|m4v)(\?.*)?$/i.test(url) || 
                       url.startsWith('blob:') || 
                       url.startsWith('data:video/');
  if (isDirectFile) {
    return {
      type: 'direct_video',
      embedUrl: url,
      rawUrl: url,
      isDirectFile: true,
      fallbackSearchUrl
    };
  }

  // 2. YouTube URLs (Standard, Shorts, Live, embed, mobile)
  const isYouTube = /(youtube\.com|youtu\.be)/i.test(url);
  if (isYouTube) {
    let videoId = '';
    let startTime = '';

    // Extract start timestamp if present (e.g. t=1m20s or t=80 or t=80s)
    const timeMatch = url.match(/[?&]t=([0-9a-z]+)/i);
    if (timeMatch) {
      const val = timeMatch[1];
      if (/^\d+$/.test(val)) {
        startTime = `&start=${val}`;
      } else {
        // e.g. 1m20s -> convert to seconds
        let seconds = 0;
        const m = val.match(/(\d+)m/);
        const s = val.match(/(\d+)s/);
        if (m) seconds += parseInt(m[1], 10) * 60;
        if (s) seconds += parseInt(s[1], 10);
        if (seconds > 0) startTime = `&start=${seconds}`;
      }
    }

    // Match Shorts: youtube.com/shorts/VIDEO_ID
    const shortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]+)/i);
    if (shortsMatch) {
      videoId = shortsMatch[1];
    }

    // Match Live: youtube.com/live/VIDEO_ID
    if (!videoId) {
      const liveMatch = url.match(/\/live\/([a-zA-Z0-9_-]+)/i);
      if (liveMatch) videoId = liveMatch[1];
    }

    // Match embed: youtube.com/embed/VIDEO_ID
    if (!videoId) {
      const embedMatch = url.match(/\/embed\/([a-zA-Z0-9_-]+)/i);
      if (embedMatch) videoId = embedMatch[1];
    }

    // Match short url: youtu.be/VIDEO_ID
    if (!videoId) {
      const shortUrlMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/i);
      if (shortUrlMatch) videoId = shortUrlMatch[1];
    }

    // Match standard watch URL: youtube.com/watch?v=VIDEO_ID
    if (!videoId) {
      const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/i);
      if (watchMatch) videoId = watchMatch[1];
    }

    if (videoId) {
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1${startTime}`,
        rawUrl: `https://www.youtube.com/watch?v=${videoId}`,
        videoId,
        isDirectFile: false,
        fallbackSearchUrl
      };
    }
  }

  // 3. Google Drive Video Files
  if (url.includes('drive.google.com')) {
    const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/i);
    if (driveMatch) {
      const fileId = driveMatch[1];
      return {
        type: 'drive',
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        rawUrl: url,
        isDirectFile: false,
        fallbackSearchUrl
      };
    }
  }

  // 4. Vimeo Videos
  if (url.includes('vimeo.com')) {
    const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/i);
    if (vimeoMatch && vimeoMatch[3]) {
      return {
        type: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1`,
        rawUrl: url,
        isDirectFile: false,
        fallbackSearchUrl
      };
    }
  }

  // 5. Instagram Reels / Posts
  if (url.includes('instagram.com')) {
    const igMatch = url.match(/\/(reel|p)\/([a-zA-Z0-9_-]+)/i);
    if (igMatch) {
      return {
        type: 'instagram',
        embedUrl: `https://www.instagram.com/p/${igMatch[2]}/embed`,
        rawUrl: url,
        isDirectFile: false,
        fallbackSearchUrl
      };
    }
  }

  // Fallback for unknown URLs: try loading directly
  return {
    type: 'other',
    embedUrl: url,
    rawUrl: url,
    isDirectFile: false,
    fallbackSearchUrl
  };
}

/**
 * Returns the best video URL for an exercise, checking custom video_url first,
 * then checking built-in exercise database, or returning null.
 * 
 * @param {object} exercise 
 * @returns {string|null}
 */
export function getTechnicalVideoUrl(exercise) {
  if (!exercise) return null;

  if (exercise.video_url && exercise.video_url.trim() !== '') {
    return exercise.video_url.trim();
  }

  const name = (exercise.name || '').toLowerCase();
  if (!name) return null;

  for (const map of EXERCISE_VIDEO_MAP) {
    if (map.keys.some(key => name.includes(key))) {
      return map.url;
    }
  }

  return null;
}
