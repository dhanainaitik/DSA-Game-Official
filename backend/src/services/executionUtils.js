const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const crypto = require('crypto');

// Supported languages
const SUPPORTED_LANGUAGES = ['javascript', 'cpp', 'c'];

/**
 * Normalizes values for comparison
 */
function normalizeOutput(val) {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === 'true' || trimmed === 'false') return trimmed;
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'object' && parsed !== null) {
        return JSON.stringify(parsed);
      }
      return String(parsed);
    } catch {
      return trimmed;
    }
  }
  if (Array.isArray(val) || typeof val === 'object') {
    return JSON.stringify(val);
  }
  return String(val);
}

/**
 * Parse input string into arguments array
 */
function parseArgsFromInput(input) {
  if (Array.isArray(input)) return [input];
  if (typeof input !== 'string') return [input];
  const trimmed = input.trim();
  
  if (trimmed.includes('with cycle at pos')) {
    const m = trimmed.match(/(\[.*?\])\s*with cycle at pos\s*(-?\d+)/);
    if (m) {
      return [JSON.parse(m[1]), parseInt(m[2], 10)];
    }
  }
  if (trimmed.includes('no cycle')) {
    const m = trimmed.match(/(\[.*?\])/);
    if (m) {
      return [JSON.parse(m[1]), -1];
    }
  }
  if (trimmed.includes(', n=')) {
    const parts = trimmed.split(', n=');
    return [JSON.parse(parts[0]), parseInt(parts[1], 10)];
  }
  try {
    return JSON.parse(`[${trimmed}]`);
  } catch {
    return [trimmed];
  }
}

module.exports = {
  SUPPORTED_LANGUAGES,
  normalizeOutput,
  parseArgsFromInput,
};

