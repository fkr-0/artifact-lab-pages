import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

const html = await readFile(new URL('../spc/template_engine.html', import.meta.url), 'utf8')

test('template engine HTML avoids inline event attributes', () => {
  const markupWithoutScripts = html.replace(/<script\b[\s\S]*?<\/script>/gi, '')
  const matches = markupWithoutScripts.match(/\son[a-z]+\s*=/gi) || []

  assert.deepEqual(matches, [])
})

test('template engine inline scripts parse successfully', () => {
  const scripts = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(
    (match) => match[1].trim()
  )

  assert.ok(scripts.length > 0, 'expected at least one inline script block')

  for (const [index, script] of scripts.entries()) {
    assert.doesNotThrow(
      () => new vm.Script(script),
      `inline script #${index + 1} should parse without syntax errors`
    )
  }
})

test('template engine export helpers clean up object URLs', () => {
  assert.match(html, /const url = URL\.createObjectURL\(blob\)/)
  assert.match(html, /URL\.revokeObjectURL\(url\)/)
})
