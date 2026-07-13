import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile('club-ledger.html', 'utf8');
const source = JSON.parse(await readFile('app-hub-v11/artifacts.source.json', 'utf8'));

const item = source.items.find((entry) => entry.id === 'club-ledger');
assert.ok(item, 'club-ledger should be present in the v11 app hub source catalog');
assert.equal(item.title, 'Club Ledger');
assert.equal(item.kind, 'html-path');
assert.equal(item.href, '../club-ledger.html');
assert.ok(item.tags.includes('finance'), 'club-ledger should be categorized as a finance tool');
assert.ok(item.launch.modes.includes('inline'), 'club-ledger should be launchable inline');
assert.ok(item.launch.modes.includes('newWindow'), 'club-ledger should be launchable in a new window');

const radii = [...html.matchAll(/border-radius:\s*([0-9.]+)px/g)].map((match) => Number(match[1]));
assert.ok(radii.length > 0, 'club-ledger should define explicit px border radii');
const nonPillRadii = radii.filter((radius) => radius !== 999);
assert.ok(Math.max(...nonPillRadii) <= 18, `non-pill border radii should stay <= 18px, got ${Math.max(...nonPillRadii)}px`);
assert.ok(!html.includes('border-radius: 28px'), 'large rounded cards should be toned down');

assert.ok(!html.includes('id="workflowPanel"'), 'workflow panel should be removed from the artifact');
const heroMatch = html.match(/<div class="hero-main">([\s\S]*?)<\/div>\s*<main/s);
assert.ok(heroMatch, 'hero header should be a compact block immediately before main');
assert.match(heroMatch[1], /<h1 id="clubName">Club Ledger<\/h1>/, 'header should keep the app title');
assert.match(heroMatch[1], /<p class="subtitle">/, 'header should keep one explanatory line');
assert.ok(!heroMatch[1].includes('dirtyChip'), 'dirty-state chip should not live in the compact header');
assert.ok(!heroMatch[1].includes('message'), 'status message should not live in the compact header');
assert.match(heroMatch[1], /class="hero-title-row"/, 'header should have a compact title row');
assert.match(heroMatch[1], /<select id="actorSelect"><\/select>/, 'actor selection should live in the header top right');
assert.match(heroMatch[1], /Acting user/, 'header actor selector should be labelled for trusted actions');
assert.ok(
  !/Trusted mutation console[\s\S]*id="actorSelect"/.test(html),
  'actor selector should no longer live inside the mutation console body'
);


assert.match(html, /<section class="data-panel-row" aria-label="JSON data controls">/, 'import, export, and JSON data should share one horizontal control row');
for (const id of ['importPanel', 'exportPanel', 'schemaPanel']) {
  const detailsMatch = html.match(new RegExp(`<details[^>]+id="${id}"[^>]*>`, 's'));
  assert.ok(detailsMatch, `${id} should be a collapsible details panel`);
  assert.ok(!/\sopen(?:\s|>|=)/.test(detailsMatch[0]), `${id} should be closed by default`);
}
assert.match(html, /class="card collapsible-panel text-panel/, 'text-only panels should use the collapsible text-panel style');
assert.match(html, /class="card collapsible-panel action-panel/, 'import and export panels should use compact collapsible action-panel style');
assert.match(html, /\.data-panel-row\s*{\s*display: grid;\s*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/s, 'JSON data controls should be one three-column row on desktop');
assert.match(html, /\.collapsible-panel:not\(\[open\]\) \.collapsible-body\s*{\s*display: none;/, 'closed collapsible panels should explicitly hide their full body so the panel shrinks');

for (const id of ['readClipboardQuick', 'openImportFileQuick', 'copyJsonQuick', 'downloadJsonQuick']) {
  assert.match(html, new RegExp(`id="${id}"[^>]+class="icon-button"`), `${id} should be an icon button in a collapsed summary bar`);
  assert.match(html, new RegExp(`id="${id}"[^>]+aria-label="[^"]+"`), `${id} should expose an accessible label`);
}
assert.match(html, /function bindSummaryButton/, 'summary icon buttons should stop details toggling and dispatch their action');
assert.match(html, /openImportFileQuick[\s\S]*fileInput[\s\S]*click/, 'quick import-open icon should launch the file picker');
assert.match(html, /downloadJsonQuick[\s\S]*downloadJson[\s\S]*click/, 'quick export-open icon should launch the JSON download flow');


const staticIds = new Set([...html.matchAll(/id="([^"\s]+)"/g)].map((match) => match[1]));
const literalDomIdSelectors = [...html.matchAll(/\$\('#([A-Za-z0-9_-]+)'\)/g)].map((match) => match[1]);
for (const id of literalDomIdSelectors) {
  assert.ok(staticIds.has(id), `literal DOM selector #${id} should refer to an element in the static HTML`);
}

assert.match(
  html,
  /<div class="status-strip" hidden>/,
  'status strip should be hidden before the app has a user-facing message'
);
assert.match(
  html,
  /lastMessage:\s*''/,
  'initial state should not preload a status message'
);
assert.ok(
  !html.includes("showMessage(state.lastMessage, 'ok')"),
  'startup should not reveal a status strip with an empty/default message'
);
assert.match(
  html,
  /function showMessage\(message, tone = 'ok'\) {[\s\S]*?status-strip[\s\S]*?hidden/s,
  'showMessage should toggle the status strip hidden state from message presence'
);

assert.match(html, /<select id="mutationAction"/, 'mutation console should offer an action chooser');
for (const action of ['membership', 'transaction', 'conversion']) {
  assert.match(
    html,
    new RegExp(`value="${action}"`),
    `mutation action chooser should include ${action}`
  );
  assert.match(
    html,
    new RegExp(`data-action="${action}"`),
    `${action} form should be tagged as a selectable action panel`
  );
}
assert.match(html, /function updateMutationAction/, 'mutation action chooser should have a display-state updater');
assert.match(html, /mutationAction[\s\S]*addEventListener\('change', updateMutationAction\)/, 'changing mutation action should update the visible form');
assert.match(html, /\.mutation-action-panel\[hidden\]/, 'hidden mutation action panels should be explicitly collapsed');

assert.match(html, /id="walletTabs"[^>]*role="tablist"/, 'wallets should render a tablist container');
assert.match(html, /id="walletPanels"/, 'wallets should render tab panels separately from tab buttons');
assert.match(html, /function setActiveWallet/, 'wallet tabs should have an explicit active-wallet state transition');
assert.match(html, /role="tab"/, 'wallet selectors should render as tabs');
assert.match(html, /role="tabpanel"/, 'wallet content should render as tab panels');


assert.match(html, /data-wallet-id="all"/, 'wallet tabs should include an All wallets tab before distinct wallet tabs');
assert.match(html, /All wallets[\s\S]*base total/i, 'all-wallet tab/panel should communicate the aggregate base-currency total');
assert.match(html, /function computeWalletOverview/, 'wallet view should compute aggregate and per-wallet overview data');
assert.match(html, /function getVisibleTransactions/, 'transaction log should derive rows from active wallet and search filters');
assert.match(html, /activeWalletId === 'all'/, 'active wallet state should support the all-wallet aggregate mode');
assert.match(html, /id="transactionSearch"/, 'transaction log should include a search input');
assert.match(html, /data-search-text=/, 'transaction rows should expose combined searchable column content');
assert.match(html, /transactionSearch[\s\S]*addEventListener\('input'/, 'typing in transaction search should refresh the visible log');
assert.match(html, /setActiveWallet\(tab\.dataset\.walletId\)/, 'pressing a wallet tab should filter transaction log through active wallet state');

assert.match(html, /id="exportViewCsv"/, 'transaction view should include a CSV export button for the currently visible rows');
assert.match(html, /function transactionCsvRows/, 'CSV export should derive rows from the transaction view model');
assert.match(html, /function exportVisibleCsv/, 'CSV export should expose a current-view download action');
assert.match(html, /transactionSearch[\s\S]*exportVisibleCsv/, 'CSV export should live with the searchable transaction view controls');
assert.match(html, /data-view-kind="all"/, 'view tabs should keep an explicit all-ledger view');
assert.match(html, /data-view-kind="wallet"/, 'view tabs should include wallet-filtered views');
assert.match(html, /data-view-kind="person"/, 'view tabs should include per-person views');
assert.match(html, /function setActivePerson/, 'person tabs should have an explicit active-person state transition');
assert.match(html, /activePersonId/, 'transaction filtering should track active person state');
assert.match(html, /txUser/, 'manual transactions should allow an optional on-behalf-of member');
assert.match(html, /convertUser/, 'wallet conversions should allow an optional on-behalf-of member');
assert.match(html, /userId:\s*optionalUserId\('#txUser'\)/, 'transaction mutations should persist the chosen on-behalf-of member');
assert.match(html, /userId:\s*optionalUserId\('#convertUser'\)/, 'conversion mutations should persist the chosen on-behalf-of member on linked transfer rows');
assert.match(html, /actorId:\s*selectedActorId\(\)/, 'mutations should continue logging the selected top-right actor');
