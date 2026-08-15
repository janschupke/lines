#!/usr/bin/env python3
"""Regenerates src/shared/names/lists/ldnoobw/index.ts from the vendored txt lists."""
import json
base = 'src/shared/names/lists/ldnoobw'
langs = ['en','cs','de','es','fr','it','pl','pt','ru','tr','ar','zh','ja','ko']
out = ['// GENERATED from the vendored LDNOOBW lists (see *.txt in this directory).',
       '// Regenerate with scripts/gen-wordlists.py after updating the txt files.',
       '']
for lang in langs:
    words = [w.strip() for w in open(f'{base}/{lang}.txt', encoding='utf-8') if w.strip()]
    out.append(f'export const {lang}: readonly string[] = {json.dumps(words, ensure_ascii=False)};')
    out.append('')
open(f'{base}/index.ts', 'w', encoding='utf-8').write('\n'.join(out))
