import test from 'node:test';
import assert from 'node:assert/strict';
import manifest from '../assets/authored/play-manifest.json' with {type:'json'};
import { chapterNotes, chapterProgress, recommendFit } from '../explorer/src/play/journey.ts';
import { createSession, commitPlacement, canPlace, isComplete, undoPlacement, fittedLeafIds } from '../explorer/src/play/state.ts';

test('every chapter has editorial context and exact action accounting', () => {
  for (const level of ['easy', 'hard']) {
    const chapters = chapterProgress(manifest, createSession(manifest, level));
    assert.equal(chapters.length, 8);
    assert.equal(chapters.reduce((n, c) => n + c.total, 0), level === 'easy' ? 89 : 284);
    for (const chapter of chapters) { assert.ok(chapterNotes[chapter.id]?.reward); assert.equal(chapter.done, 0); }
  }
});

test('guide completes both modes from every preferred chapter without dead ends or illegal actions', () => {
  for (const level of ['easy', 'hard']) for (const group of manifest.groups) {
    let session = createSession(manifest, level), workspace = null;
    while (!isComplete(manifest, session)) {
      const step = recommendFit(manifest, session, group.id, workspace);
      assert.ok(step, `${level}/${group.id}`);
      assert.ok(canPlace(manifest, session, step.id));
      const before = session;
      session = commitPlacement(manifest, session, step.id);
      assert.equal(session.actionIds.length, before.actionIds.length + 1);
      assert.deepEqual(undoPlacement(manifest, session), before);
      workspace = step.workspaceId;
    }
    assert.equal(fittedLeafIds(manifest, session).length, 265);
    assert.ok(chapterProgress(manifest, session).every(c => c.done === c.total));
    assert.equal(recommendFit(manifest, session, group.id), null);
  }
});

test('guide finishes an active bench and offers its transfer before starting a new bench', () => {
  let session = createSession(manifest, 'hard');
  const first = recommendFit(manifest, session, 'power');
  assert.ok(first.workspaceId);
  const packet = manifest.packets.find(p => p.id === first.workspaceId);
  for (let i = 0; i < packet.stepIds.length; i++) {
    const next = recommendFit(manifest, session, 'power', packet.id);
    assert.equal(next.workspaceId, packet.id);
    session = commitPlacement(manifest, session, next.id);
  }
  assert.equal(recommendFit(manifest, session, 'power', packet.id).id, packet.transferId);
});
