import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { encryptToken, decryptToken } from './crypto.js'

/**
 * ACT-7 — les identifiants clients ne doivent jamais être stockés en clair.
 *
 * Contexte : le formulaire SMTP/IMAP du dashboard écrivait le mot de passe
 * email du marchand directement dans `client_integrations.api_key`, en clair,
 * depuis le navigateur — alors que docs/integrations/smtp-imap.mdx lui promet
 * un chiffrement AES-256. Le repli du formulaire « clé API » faisait la même
 * chose dès qu'un appel réseau échouait.
 */

describe('chiffrement des secrets au repos', () => {
  it('un aller-retour rend la valeur d’origine', () => {
    const secret = 'mot-de-passe-smtp-du-marchand'
    const stored = encryptToken(secret)
    expect(stored).not.toContain(secret)
    expect(stored.startsWith('enc:v1:')).toBe(true)
    expect(decryptToken(stored)).toBe(secret)
  })

  it('deux chiffrements du même secret donnent des blobs différents', () => {
    // IV aléatoire : sans ça, deux marchands avec le même mot de passe
    // seraient reconnaissables l'un de l'autre en base.
    expect(encryptToken('identique')).not.toBe(encryptToken('identique'))
  })

  it('laisse passer les valeurs écrites avant le chiffrement', () => {
    // Les lecteurs font `decryptToken(x) || x`. Les lignes historiques en clair
    // doivent continuer de fonctionner, sinon la migration casse la production.
    expect(decryptToken('ancienne-valeur-en-clair')).toBe('ancienne-valeur-en-clair')
  })

  it('renvoie null sur un blob corrompu plutôt que de lever', () => {
    expect(decryptToken('enc:v1:pas-du-base64-valide')).toBeNull()
  })
})

/* -------------------------------------------------------------------------- */

function jsxFiles(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) jsxFiles(full, acc)
    else if (/\.(jsx?|tsx?)$/.test(entry)) acc.push(full)
  }
  return acc
}

describe('le navigateur n’écrit aucun secret en base', () => {
  it('aucun fichier de src/ n’écrit api_key / access_token / refresh_token dans client_integrations', () => {
    const coupables = []

    for (const file of jsxFiles('src')) {
      const source = readFileSync(file, 'utf8')
      if (!source.includes("from('client_integrations')")) continue

      // On isole chaque écriture et on regarde les 25 lignes qui la suivent :
      // c'est là que vivent les colonnes de l'objet inséré.
      const lines = source.split('\n')
      lines.forEach((line, i) => {
        if (!/from\('client_integrations'\)[\s\S]{0,40}(upsert|insert|update)\(/.test(line)) return
        const bloc = lines.slice(i, i + 25).join('\n')
        if (/^\s*(api_key|access_token|refresh_token)\s*:/m.test(bloc)) {
          coupables.push(`${file}:${i + 1}`)
        }
      })
    }

    expect(
      coupables,
      `Ces écritures déposeraient un secret en clair. Passez par /api/integrations/connect, ` +
      `qui chiffre avant insertion :\n  ${coupables.join('\n  ')}`,
    ).toEqual([])
  })
})
