import test from 'node:test';
import assert from 'node:assert/strict';

import { LOGIC_LAB_TOPICS } from '../logiclab.js';
import { VISIT_LAB_FLASHCARDS, getFlashcardsForTopic } from './index.js';

test('Every Logic Lab topic is covered in VISIT_LAB_FLASHCARDS with exactly 5 complete flashcards', () => {
  assert.ok(LOGIC_LAB_TOPICS.length > 0, 'Expected discovered Logic Lab topics');

  for (const topic of LOGIC_LAB_TOPICS) {
    const cards = getFlashcardsForTopic(topic.id);
    assert.equal(cards.length, 5, `Topic "${topic.id}" must have exactly 5 flashcards`);

    const ids = new Set();
    for (const card of cards) {
      assert.ok(card.id && !ids.has(card.id), `Duplicate or missing card.id in ${topic.id}`);
      ids.add(card.id);
      assert.ok(card.topicLabel?.length > 3, `Missing topicLabel in ${topic.id}/${card.id}`);
      assert.ok(card.title?.length > 2, `Missing title in ${topic.id}/${card.id}`);
      assert.ok(card.content?.length > 12, `Missing content in ${topic.id}/${card.id}`);
      assert.ok(card.takeaway?.length > 5, `Missing takeaway in ${topic.id}/${card.id}`);
      assert.ok(card.icon, `Missing icon in ${topic.id}/${card.id}`);
      assert.ok(card.visual?.type, `Missing visual diagram in ${topic.id}/${card.id}`);
    }
  }

  assert.equal(Object.keys(VISIT_LAB_FLASHCARDS).length, LOGIC_LAB_TOPICS.length);
});

