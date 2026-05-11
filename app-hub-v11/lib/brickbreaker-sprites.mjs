export const BRICKBREAKER_SPRITE_PROMPTS = [
  {
    id: 'paddle',
    style: 'clean pixel-sprite',
    prompt: 'Single centered futuristic brickbreaker paddle, cyan neon trim, clean pixel-sprite, transparent background, no text, single centered game asset.',
    negativePrompt: 'watermark, blur, text, logo, noisy background, multiple objects, cropped edges',
  },
  {
    id: 'ball',
    style: 'clean pixel-sprite',
    prompt: 'Single centered glowing arcade ball, small plasma core, clean pixel-sprite, transparent background, no text, single centered game asset.',
    negativePrompt: 'watermark, blur, text, logo, noisy background, multiple objects, cropped edges',
  },
  {
    id: 'brick',
    style: 'clean pixel-sprite',
    prompt: 'Single centered breakable neon brick block, beveled sci-fi panel, clean pixel-sprite, transparent background, no text, single centered game asset.',
    negativePrompt: 'watermark, blur, text, logo, noisy background, multiple objects, cropped edges',
  },
  {
    id: 'armored-brick',
    style: 'clean pixel-sprite',
    prompt: 'Single centered armored brickbreaker block, reinforced metal sci-fi plating, clean pixel-sprite, transparent background, no text, single centered game asset.',
    negativePrompt: 'watermark, blur, text, logo, noisy background, multiple objects, cropped edges',
  },
  {
    id: 'laser-shot',
    style: 'clean pixel-sprite',
    prompt: 'Single centered vertical laser shot projectile, bright magenta energy bolt, clean pixel-sprite, transparent background, no text, single centered game asset.',
    negativePrompt: 'watermark, blur, text, logo, noisy background, multiple objects, cropped edges',
  },
  {
    id: 'powerup-capsule',
    style: 'clean pixel-sprite',
    prompt: 'Single centered arcade powerup capsule, glowing cyberpunk pickup item, clean pixel-sprite, transparent background, no text, single centered game asset.',
    negativePrompt: 'watermark, blur, text, logo, noisy background, multiple objects, cropped edges',
  },
  {
    id: 'particle',
    style: 'clean pixel-sprite',
    prompt: 'Single centered tiny explosion particle spark, neon shard fragment, clean pixel-sprite, transparent background, no text, single centered game asset.',
    negativePrompt: 'watermark, blur, text, logo, noisy background, multiple objects, cropped edges',
  },
];

export function spritePromptById(id) {
  return BRICKBREAKER_SPRITE_PROMPTS.find((prompt) => prompt.id === id) || null;
}

export function buildSpritePromptSheet() {
  return [
    '# NEXUS BrickBreaker Clean Sprite Prompts',
    '',
    ...BRICKBREAKER_SPRITE_PROMPTS.flatMap((prompt) => [
      `## ${prompt.id}`,
      `Style: ${prompt.style}`,
      prompt.prompt,
      `Negative: ${prompt.negativePrompt}`,
      '',
    ]),
  ].join('\n');
}
