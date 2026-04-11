#!/usr/bin/env tsx
/**
 * AI test generator
 * Usage: npm run generate -- --url https://example.com
 */

import { chromium } from '@playwright/test';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';

// ── CLI arg ────────────────────────────────────────────────────────────────

const urlArg = process.argv.find((a) => a.startsWith('--url='))?.slice(6)
  ?? process.argv[process.argv.indexOf('--url') + 1];

if (!urlArg) {
  console.error('Usage: npm run generate -- --url <url>');
  process.exit(1);
}

// ── Crawler ────────────────────────────────────────────────────────────────

async function crawl(url: string) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    const snapshot = await page.evaluate(() => {
      const getText = (el: Element | null) => el?.textContent?.trim() ?? null;

      const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
        .slice(0, 10)
        .map((el) => el.textContent?.trim() ?? '')
        .filter(Boolean);

      const forms = Array.from(document.querySelectorAll('form')).map((form) => ({
        action: (form as HTMLFormElement).action || null,
        method: (form as HTMLFormElement).method || null,
        fields: Array.from(form.querySelectorAll('input, select, textarea')).map((el) => {
          const input = el as HTMLInputElement;
          const labelEl = input.id ? document.querySelector(`label[for="${input.id}"]`) : null;
          return {
            tag: input.tagName.toLowerCase(),
            type: input.type ?? null,
            name: input.name || null,
            placeholder: input.placeholder || null,
            label: getText(labelEl),
          };
        }),
      }));

      const buttons = Array.from(
        document.querySelectorAll("button, input[type='button'], input[type='submit']")
      )
        .slice(0, 20)
        .map((el) => ({
          text: el.textContent?.trim() || (el as HTMLInputElement).value || '',
          id: (el as HTMLElement).id || null,
        }));

      const origin = window.location.origin;
      const links = Array.from(document.querySelectorAll('a[href]'))
        .filter((a) => {
          const href = (a as HTMLAnchorElement).href;
          return href.startsWith(origin) || (a as HTMLAnchorElement).getAttribute('href')?.startsWith('/');
        })
        .slice(0, 15)
        .map((a) => ({
          text: a.textContent?.trim() ?? '',
          href: (a as HTMLAnchorElement).href,
        }));

      return { headings, forms, buttons, links };
    });

    return { url: page.url(), title: await page.title(), ...snapshot };
  } finally {
    await browser.close();
  }
}

// ── Generator ──────────────────────────────────────────────────────────────

async function generate(snapshot: Awaited<ReturnType<typeof crawl>>) {
  const systemPrompt = readFileSync(
    join(dirname(process.argv[1]), '../prompts/generate-tests.md'),
    'utf-8'
  );

  const client = new Anthropic();

  console.log('Sending snapshot to Claude...');

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Generate Playwright TypeScript tests for this page snapshot:\n\n${JSON.stringify(snapshot, null, 2)}`,
      },
    ],
  });

  stream.on('text', (delta) => process.stdout.write(delta));

  const response = await stream.finalMessage();

  return (response.content as Anthropic.TextBlock[])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');
}

// ── Write spec ─────────────────────────────────────────────────────────────

function slugify(url: string) {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 60);
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Crawling ${urlArg}...`);
  const snapshot = await crawl(urlArg);
  console.log(`Crawled: "${snapshot.title}" — ${snapshot.headings.length} headings, ${snapshot.forms.length} forms, ${snapshot.buttons.length} buttons, ${snapshot.links.length} links\n`);

  const spec = await generate(snapshot);
  const specPath = join(dirname(process.argv[1]), '../tests/generated', `${slugify(urlArg)}.spec.ts`);

  writeFileSync(specPath, spec, 'utf-8');

  const testCount = (spec.match(/^\s*test\(/gm) ?? []).length;
  console.log(`\n\nWrote ${testCount} tests → ${specPath}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
