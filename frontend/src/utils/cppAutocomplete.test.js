import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EditorState } from '@codemirror/state';
import { CompletionContext } from '@codemirror/autocomplete';
import { javascript } from '@codemirror/lang-javascript';
import {
  cppAutocompleteSource,
  cAutocompleteSource,
  cppLanguageSupport,
  cLanguageSupport,
  inferVariableTypes,
} from './cppAutocomplete.js';

describe('C++ & C IntelliSense Autocomplete Engine', () => {
  function getCppCompletions(doc, pos = doc.length, explicit = false) {
    const state = EditorState.create({
      doc,
      extensions: [cppLanguageSupport()],
    });
    const ctx = new CompletionContext(state, pos, explicit);
    return cppAutocompleteSource(ctx);
  }

  function getCCompletions(doc, pos = doc.length, explicit = false) {
    const state = EditorState.create({
      doc,
      extensions: [cLanguageSupport()],
    });
    const ctx = new CompletionContext(state, pos, explicit);
    return cAutocompleteSource(ctx);
  }

  describe('1. C++ Keywords & Word Completions', () => {
    it('suggests vector when typing "vec"', () => {
      const res = getCppCompletions('vec');
      assert.ok(res, 'Expected completion result');
      const labels = res.options.map((o) => o.label);
      assert.ok(labels.includes('vector'), 'Should contain "vector"');
      assert.ok(labels.includes('vector<int>'), 'Should contain "vector<int>" snippet');
    });

    it('suggests sort with usage info when typing "sort"', () => {
      const res = getCppCompletions('sort');
      assert.ok(res, 'Expected completion result');
      const sortOpt = res.options.find((o) => o.label === 'sort');
      assert.ok(sortOpt, 'Should contain "sort" option');
      assert.equal(sortOpt.detail, 'std::sort(first, last)');
      assert.ok(sortOpt.info.includes('Usage:'), 'Info should contain usage examples');
    });

    it('suggests required C++ keywords', () => {
      const res = getCppCompletions('in');
      assert.ok(res);
      const labels = res.options.map((o) => o.label);
      assert.ok(labels.includes('int'));

      const resAll = getCppCompletions('', 0, true);
      assert.ok(resAll);
      const allLabels = resAll.options.map((o) => o.label);
      const requiredKeywords = [
        'int', 'long', 'float', 'double', 'char', 'bool', 'void',
        'if', 'else', 'switch', 'case',
        'for', 'while', 'do',
        'return', 'break', 'continue',
        'class', 'struct', 'public', 'private',
        'const', 'static', 'auto', 'using', 'namespace',
      ];
      for (const kw of requiredKeywords) {
        assert.ok(allLabels.includes(kw), `Missing keyword: ${kw}`);
      }
    });

    it('suggests required STL containers', () => {
      const res = getCppCompletions('', 0, true);
      assert.ok(res);
      const labels = res.options.map((o) => o.label);
      const requiredContainers = [
        'vector', 'string', 'map', 'unordered_map',
        'set', 'unordered_set',
        'stack', 'queue', 'deque',
        'priority_queue',
        'pair', 'tuple',
      ];
      for (const c of requiredContainers) {
        assert.ok(labels.includes(c), `Missing STL container: ${c}`);
      }
    });

    it('suggests required STL algorithms', () => {
      const res = getCppCompletions('', 0, true);
      assert.ok(res);
      const labels = res.options.map((o) => o.label);
      const requiredAlgos = [
        'sort', 'reverse',
        'max', 'min',
        'swap',
        'binary_search',
        'lower_bound', 'upper_bound',
        'find', 'count',
        'accumulate',
        'next_permutation',
      ];
      for (const a of requiredAlgos) {
        assert.ok(labels.includes(a), `Missing STL algorithm: ${a}`);
      }
    });

    it('suggests required standard functions and methods', () => {
      const res = getCppCompletions('', 0, true);
      assert.ok(res);
      const labels = res.options.map((o) => o.label);
      const requiredFns = [
        'abs', 'sqrt', 'pow',
        'stoi', 'to_string',
        'getline', 'substr', 'length',
        'push_back', 'pop_back',
        'size', 'empty', 'clear',
        'front', 'back',
        'begin', 'end',
        'insert', 'erase',
        'top', 'push', 'pop',
      ];
      for (const fn of requiredFns) {
        assert.ok(labels.includes(fn), `Missing standard function/method: ${fn}`);
      }
    });

    it('has zero duplicate labels in general completions', () => {
      const res = getCppCompletions('', 0, true);
      assert.ok(res);
      const labels = res.options.map((o) => o.label);
      const unique = new Set(labels);
      assert.equal(labels.length, unique.size, 'Completions must not contain duplicate labels');
    });
  });

  describe('2. Context-Aware: #include <... Header Suggestions', () => {
    it('suggests standard headers after typing "#include <"', () => {
      const res = getCppCompletions('#include <');
      assert.ok(res);
      const labels = res.options.map((o) => o.label);
      assert.ok(labels.includes('iostream'));
      assert.ok(labels.includes('vector'));
      assert.ok(labels.includes('algorithm'));
      assert.ok(labels.includes('cmath'));
      assert.ok(labels.includes('string'));
      assert.ok(labels.includes('bits/stdc++.h'));
    });

    it('completes header with closing bracket if not present', () => {
      const res = getCppCompletions('#include <io');
      assert.ok(res);
      const ioOpt = res.options.find((o) => o.label === 'iostream');
      assert.ok(ioOpt);
      assert.equal(ioOpt.apply, 'iostream>');
    });

    it('does not duplicate closing bracket if already present', () => {
      const res = getCppCompletions('#include <io>', 12);
      assert.ok(res);
      const ioOpt = res.options.find((o) => o.label === 'iostream');
      assert.ok(ioOpt);
      assert.equal(ioOpt.apply, 'iostream');
    });
  });

  describe('3. Context-Aware: Template Parameter Suggestions (vector<...)', () => {
    it('suggests data types when typing "vector<"', () => {
      const res = getCppCompletions('vector<');
      assert.ok(res);
      const labels = res.options.map((o) => o.label);
      assert.ok(labels.includes('int'));
      assert.ok(labels.includes('long long'));
      assert.ok(labels.includes('string'));
      assert.ok(labels.includes('pair<int, int>'));
    });

    it('suggests data types for second template parameter in "pair<int, "', () => {
      const res = getCppCompletions('pair<int, ');
      assert.ok(res);
      const labels = res.options.map((o) => o.label);
      assert.ok(labels.includes('int'));
      assert.ok(labels.includes('string'));
    });
  });

  describe('4. Context-Aware: std:: Namespace Member Suggestions', () => {
    it('suggests std members when typing "std::"', () => {
      const res = getCppCompletions('std::');
      assert.ok(res);
      const labels = res.options.map((o) => o.label);
      assert.ok(labels.includes('vector'));
      assert.ok(labels.includes('sort'));
      assert.ok(labels.includes('cin'));
      assert.ok(labels.includes('cout'));
      assert.ok(labels.includes('stoi'));
      assert.ok(labels.includes('max'));
      assert.ok(labels.includes('min'));
      assert.ok(labels.includes('reverse'));
    });

    it('filters correctly when typing "std::s"', () => {
      const res = getCppCompletions('std::s');
      assert.ok(res);
      assert.equal(res.from, 5, 'from position should start right after "std::"');
    });
  });

  describe('5. Context-Aware: Variable Member Methods (v. / arr. / s.)', () => {
    it('infers vector type and suggests vector methods on "v."', () => {
      const code = 'vector<int> v;\nv.';
      const res = getCppCompletions(code);
      assert.ok(res);
      const labels = res.options.map((o) => o.label);
      assert.ok(labels.includes('push_back'), 'Should suggest push_back for vector');
      assert.ok(labels.includes('pop_back'), 'Should suggest pop_back for vector');
      assert.ok(labels.includes('size'), 'Should suggest size for vector');
      assert.ok(labels.includes('empty'), 'Should suggest empty for vector');
      assert.ok(labels.includes('begin'), 'Should suggest begin for vector');
      assert.ok(labels.includes('end'), 'Should suggest end for vector');
      assert.ok(labels.includes('clear'), 'Should suggest clear for vector');
    });

    it('infers string type and suggests string methods on "s."', () => {
      const code = 'string s = "test";\ns.';
      const res = getCppCompletions(code);
      assert.ok(res);
      const labels = res.options.map((o) => o.label);
      assert.ok(labels.includes('length'), 'Should suggest length for string');
      assert.ok(labels.includes('substr'), 'Should suggest substr for string');
      assert.ok(labels.includes('find'), 'Should suggest find for string');
      assert.ok(labels.includes('c_str'), 'Should suggest c_str for string');
    });

    it('infers map type and suggests map methods on "mp."', () => {
      const code = 'unordered_map<int, int> mp;\nmp.';
      const res = getCppCompletions(code);
      assert.ok(res);
      const labels = res.options.map((o) => o.label);
      assert.ok(labels.includes('find'), 'Should suggest find for map');
      assert.ok(labels.includes('count'), 'Should suggest count for map');
      assert.ok(labels.includes('insert'), 'Should suggest insert for map');
    });

    it('suggests container methods on generic "arr."', () => {
      const code = 'arr.';
      const res = getCppCompletions(code);
      assert.ok(res);
      const labels = res.options.map((o) => o.label);
      assert.ok(labels.includes('push_back'));
      assert.ok(labels.includes('size'));
      assert.ok(labels.includes('empty'));
    });

    it('correctly calculates replacement range for member access', () => {
      const code = 'vector<int> v;\nv.pu';
      const res = getCppCompletions(code);
      assert.ok(res);
      assert.equal(res.from, code.length - 2, 'from position should start at "pu"');
    });
  });

  describe('6. Context-Aware: Function Parameter Assistance (sort(...)', () => {
    it('suggests begin/end parameter completions when typing "sort("', () => {
      const code = 'vector<int> nums;\nsort(';
      const res = getCppCompletions(code);
      assert.ok(res);
      const labels = res.options.map((o) => o.label);
      assert.ok(labels.some((l) => l.includes('nums.begin(), nums.end()')), 'Should use declared vector "nums" in suggestions');
      assert.ok(labels.some((l) => l.includes('greater<int>()')), 'Should suggest descending sort');
    });
  });

  describe('7. C Language Mode Support', () => {
    it('suggests C headers when typing "#include <" in C mode', () => {
      const res = getCCompletions('#include <');
      assert.ok(res);
      const labels = res.options.map((o) => o.label);
      assert.ok(labels.includes('stdio.h'));
      assert.ok(labels.includes('stdlib.h'));
      assert.ok(labels.includes('string.h'));
      assert.ok(!labels.includes('iostream'), 'C mode should not suggest C++ <iostream>');
    });

    it('suggests C standard library functions in C mode', () => {
      const res = getCCompletions('', 0, true);
      assert.ok(res);
      const labels = res.options.map((o) => o.label);
      assert.ok(labels.includes('printf'));
      assert.ok(labels.includes('scanf'));
      assert.ok(labels.includes('malloc'));
      assert.ok(labels.includes('free'));
      assert.ok(labels.includes('memset'));
      assert.ok(labels.includes('qsort'));
    });
  });

  describe('8. Language Scoping & Isolation', () => {
    it('C++ autocomplete is active in C++ EditorState', () => {
      const state = EditorState.create({
        doc: 'vector<int> v;',
        extensions: [cppLanguageSupport()],
      });
      const sources = state.languageDataAt('autocomplete', 3);
      assert.equal(sources.length, 1);
      assert.equal(sources[0], cppAutocompleteSource);
    });

    it('C++ autocomplete is NEVER present in JavaScript EditorState', () => {
      const state = EditorState.create({
        doc: 'const x = 10;',
        extensions: [javascript()],
      });
      const sources = state.languageDataAt('autocomplete', 3);
      assert.ok(!sources.includes(cppAutocompleteSource), 'JS state must never have cppAutocompleteSource');
      assert.ok(!sources.includes(cAutocompleteSource), 'JS state must never have cAutocompleteSource');
    });

    it('C autocomplete is active in C EditorState', () => {
      const state = EditorState.create({
        doc: 'int x = 10;',
        extensions: [cLanguageSupport()],
      });
      const sources = state.languageDataAt('autocomplete', 3);
      assert.equal(sources.length, 1);
      assert.equal(sources[0], cAutocompleteSource);
    });
  });

  describe('9. inferVariableTypes Utility', () => {
    it('extracts types from signatures and local declarations', () => {
      const doc = `
        int solve(vector<int>& nums, string target) {
          unordered_map<int, int> freq;
          stack<int> st;
          pair<int, int> p;
        }
      `;
      const types = inferVariableTypes(doc);
      assert.equal(types.nums, 'vector');
      assert.equal(types.target, 'string');
      assert.equal(types.freq, 'unordered_map');
      assert.equal(types.st, 'stack');
      assert.equal(types.p, 'pair');
    });
  });
});

