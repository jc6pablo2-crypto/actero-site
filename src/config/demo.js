/**
 * Configuration du modal de démo vidéo.
 *
 * Remplace `url` par l'URL embed finale quand la vidéo est prête
 * (Loom : https://www.loom.com/embed/<id>, YouTube : https://www.youtube.com/embed/<id>,
 * Vimeo : https://player.vimeo.com/video/<id>).
 *
 * `aspectRatio` suit le format W/H (16/9 par défaut — adapté à une démo
 * desktop). Passe sur 9/16 si tu tournes en mobile-portrait.
 */
export const DEMO_VIDEO = {
  url: 'https://www.loom.com/embed/PLACEHOLDER_VIDEO_ID?hide_owner=true&hide_share=true&hideEmbedTopBar=true',
  title: 'Démo Actero — 90 secondes',
  duration: '90 sec',
  poster: null, // URL optionnelle d'une image de preview (poster frame)
  aspectRatio: 16 / 9,
}

/** true quand l'URL pointe vers une vraie vidéo (pas le placeholder). */
export const DEMO_VIDEO_AVAILABLE = !DEMO_VIDEO.url.includes('PLACEHOLDER_VIDEO_ID')
