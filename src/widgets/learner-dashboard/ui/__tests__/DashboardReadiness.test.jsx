// @vitest-environment node
import React from 'react';
import { readFileSync } from 'node:fs';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import { transformSync } from 'esbuild';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import * as profileUI from '../RecommendationProfilePrompt';

// Execute the actual Dashboard card's conditional JSX without loading unrelated
// auth, realtime, assessment and animation providers. A detached prompt-only
// test would miss a guard placed inside the catalogue's non-empty branch.
const source = readFileSync(new URL('../../../../pages/learner/Dashboard.jsx', import.meta.url), 'utf8');
const traverse = traverseModule.default || traverseModule;
let card;
let content;
traverse(parse(source, { sourceType: 'module', plugins: ['jsx'] }), {
  VariableDeclarator(nodePath) {
    if (nodePath.node.id.name !== 'OpportunitiesCardContent') return;
    const arrow = nodePath.node.init;
    const guard = arrow.body.body.find(statement => statement.type === 'IfStatement' && source.slice(statement.start, statement.end).includes('needs_profile'));
    if (guard) content = `${source.slice(arrow.start, guard.end)} return <p>JOB_CONTENT</p>; }`;
  },
  JSXExpressionContainer(nodePath) {
    const expression = nodePath.node.expression;
    if (expression.type !== 'ConditionalExpression' || expression.test.type !== 'Identifier' || expression.test.name !== 'opportunitiesLoading') return;
    if (!source.slice(expression.start, expression.end).includes('OpportunitiesCardContent')) return;
    const parent = nodePath.findParent(candidate => candidate.isJSXElement() && candidate.node.openingElement.name.name === 'CardContent');
    if (parent) card = source.slice(parent.node.start, parent.node.end);
  },
});
if (!card || !content) throw new Error('Dashboard opportunities card or its inner readiness guard not found');
const compiled = transformSync(`const { useState } = React; const OpportunitiesCardContent = ${content}; module.exports = (${card});`, { loader: 'jsx', format: 'cjs' }).code;
const evaluate = new Function('React', 'CardContent', 'Button', 'RecommendationProfilePrompt', 'RecommendationReadinessGate',
  'opportunitiesLoading', 'opportunitiesError', 'opportunities', 'aiReadiness', 'learnerData', 'navigate', 'matchedJobs', 'refreshOpportunities', 'aiError', 'refreshAIRecommendations', 'aiProcessing',
  `const module = { exports: null }; ${compiled}; return module.exports;`);

function renderCard(readiness, { loading = false, error = null, aiError = null, processing = null, jobs = [] } = {}) {
  const fragment = ({ children }) => <>{children}</>;
  return renderToStaticMarkup(evaluate(React, fragment, fragment, profileUI.default, profileUI.RecommendationReadinessGate,
    loading, error, jobs, readiness, {}, () => {}, [], () => {}, aiError, () => {}, processing));
}

describe('Dashboard readiness before catalogue state', () => {
  for (const state of ['needs_profile', 'limited_context']) {
    it.each([
      ['empty', {}], ['loading', { loading: true }], ['failed', { error: 'catalogue unavailable' }], ['populated', { jobs: [{ id: 'job' }] }],
    ])(`shows ${state} guidance with a %s catalogue`, (_label, options) => {
      const html = renderCard({ state }, options);
      expect(html).toContain('Add a skill');
      expect(html).toContain('Work experience is optional');
      expect(html).not.toContain('No opportunities available');
      expect(html).not.toContain('Failed to load opportunities');
      expect(html).not.toContain('JOB_CONTENT');
    });
  }
  it.each(['processing','index_building'])('shows a bounded waiting state for %s before catalogue cards', processing => {
    const html = renderCard({state:'ready'}, {processing, jobs:[{id:'job'}]});
    expect(html).toContain('Preparing job recommendations');
    expect(html).not.toContain('JOB_CONTENT');
    expect(html).not.toContain('No opportunities available');
  });
  it('shows recommendation errors before catalogue cards and stale guidance', () => {
    for (const state of ['ready', 'needs_profile', 'limited_context']) {
      const html = renderCard({ state }, { aiError: 'access denied', jobs: [{id:'job'}] });
      expect(html).toContain('role="alert"');
      expect(html).toContain('Job recommendations could not be loaded');
      expect(html).toContain('Retry recommendations');
      expect(html).not.toContain('JOB_CONTENT');
      expect(html).not.toContain('Add a skill');
    }
  });
  it('preserves ordinary catalogue states for ready profiles', () => {
    expect(renderCard({ state: 'ready' })).toContain('No opportunities available');
    expect(renderCard({ state: 'ready' }, { error: 'unavailable' })).toContain('Failed to load opportunities');
    expect(renderCard({ state: 'ready' }, { jobs: [{ id: 'job' }] })).toContain('JOB_CONTENT');
  });
});
