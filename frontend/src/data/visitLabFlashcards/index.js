import { arraysFlashcards } from './arrays.js';
import { stringsFlashcards } from './strings.js';
import { linkedListsFlashcards } from './linkedLists.js';
import { stackQueueFlashcards } from './stackQueue.js';
import { treesFlashcards } from './trees.js';
import { graphsFlashcards } from './graphs.js';
import { dpFlashcards } from './dynamicProgramming.js';
import { recursionFlashcards } from './recursion.js';

/**
 * Centralized registry mapping every Visit Lab / Logic Lab topic ID
 * to its five concise educational concept flashcards.
 */
export const VISIT_LAB_FLASHCARDS = {
  arrays: arraysFlashcards,
  strings: stringsFlashcards,
  'linked-lists': linkedListsFlashcards,
  'stack-queue': stackQueueFlashcards,
  trees: treesFlashcards,
  graphs: graphsFlashcards,
  'dynamic-programming': dpFlashcards,
  recursion: recursionFlashcards,
};

export function getFlashcardsForTopic(topicId) {
  return VISIT_LAB_FLASHCARDS[topicId] || [];
}
