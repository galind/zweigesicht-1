/** Execute route event handlers with state setters; DOM focus/layout needs browser QA. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('../explorer/node_modules/typescript');
function handler(file, component, name, globals) {
  const source = ts.createSourceFile(file, fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const body = source.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === component).body;
  const variable = body.statements.filter(ts.isVariableStatement)
    .flatMap(n => [...n.declarationList.declarations]).find(n => n.name.getText(source) === name);
  const module = {exports: {}};
  vm.runInNewContext(ts.transpileModule('module.exports = ' + variable.initializer.getText(source), {
    compilerOptions: {target: ts.ScriptTarget.ES2022},
  }).outputText, {module, ...globals});
  return module.exports;
}

test('switching Explorer panels survives late dismissals from the outgoing sheet', () => {
  let panel = null;
  const open = handler('explorer/app/page.tsx', 'Home', 'openPanel', {
    setPanel(update) {panel = update(panel);}, selectionFocus: {}, panelAnchor: {}, moreButton: {},
    visibleTrigger: () => null, document: {querySelector: () => null},
  });
  for (const [from, to] of [['menu', 'options'], ['more', 'explore'], ['catalog', 'details'], ['about', 'acknowledgements']]) {
    open(from, true); assert.equal(panel, from);
    open(to, true); assert.equal(panel, to);
    open(from, false); assert.equal(panel, to, 'A delayed close must not dismiss the replacement');
    open(to, false); assert.equal(panel, null);
  }
});

test('Workshop UI does not switch inventory when its controller rejects navigation during a drag', () => {
  const updates = [];
  let accepted = false;
  const workspaceRef = {current: null}, selectionRef = {current: 'held'};
  const enter = handler('explorer/src/play/Play.tsx', 'Play', 'enterWorkspace', {
    viewer: {current: {setWorkspace: () => accepted}}, workspaceRef, selectionRef, assistanceRef: {},
    setSelection: id => updates.push(['selection', id]),
    setWorkspace: id => updates.push(id), setAssistance() {}, setNotice() {},
    setInventoryView() {}, setQuery() {}, sync() {updates.push('sync');},
  });
  enter('packet', null); assert.equal(workspaceRef.current, null); assert.deepEqual(updates, []);
  assert.equal(selectionRef.current, 'held', 'Rejected navigation must preserve the captured part');
  accepted = true; enter('packet', null);
  assert.equal(workspaceRef.current, 'packet');
  assert.deepEqual(updates, [['selection', null], 'packet', 'sync']);
  updates.length = 0; enter(null, 'transfer');
  assert.equal(selectionRef.current, 'transfer');
  assert.deepEqual(updates, [['selection', 'transfer'], null, 'sync']);
});
