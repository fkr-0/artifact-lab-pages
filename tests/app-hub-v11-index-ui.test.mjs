import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile('app-hub-v11/index.html', 'utf8');

assert.doesNotMatch(html, /Artifact cockpit/, 'v11 should remove the old artifact cockpit hero panel');
assert.match(html, /id="filterPanel"/, 'left sidebar should include an upper filtering panel');
assert.match(html, /id="lobbyPanel"/, 'left sidebar should include a lower lobby/users/chat panel');
assert.match(html, /id="tagFilter"/, 'v11 should render reusable tag filter controls');
assert.match(html, /id="modeAnd"/, 'tag filter should expose AND mode');
assert.match(html, /id="modeOr"/, 'tag filter should expose OR mode');
assert.match(html, /id="onlineUsers"/, 'lobby panel should show online users');
assert.match(html, /id="chatChannels"/, 'lobby panel should allow chat channel spawning');
assert.match(html, /id="spawnChatChannel"/, 'lobby panel should expose chat channel spawn control');
assert.match(html, /id="joinGamePrompt"/, 'lobby panel should expose join-game prompt/status');
assert.match(html, /id="resultsPanel"/, 'center upper panel should show filtered results');
assert.match(html, /id="viewCards"/, 'results should be switchable to cards');
assert.match(html, /id="viewList"/, 'results should be switchable to list');

assert.match(html, /readHubSetting\("viewMode", "cards"\)/, 'v11 should restore cards/list view mode from local storage');
assert.match(html, /writeHubSetting\("viewMode", viewMode\)/, 'v11 should persist cards/list view mode to local storage');
assert.match(html, /sortItemsByRecentlyChanged/, 'v11 should order modules by recently changed newest first');
assert.match(html, /changedAt|updatedAt|modifiedAt|mtime|lastChanged/, 'v11 should recognize changed timestamps when sorting modules');
assert.match(html, /data-launch="inline"/, 'result items should expose inline icon launch buttons');
assert.match(html, /data-launch="fullscreen"/, 'result items should expose fullscreen icon launch buttons');
assert.match(html, /data-launch="floating"/, 'result items should expose floating icon launch buttons');
assert.match(html, /data-launch="newWindow"/, 'result items should expose new-window icon launch buttons');
assert.match(html, /id="appDeck"/, 'v11 should include the v9-style inline app deck');
assert.match(html, /id="appDeckTabs"/, 'inline app deck should include tabs');
assert.match(html, /id="appDeckBody"/, 'inline app deck should include body panels');
assert.match(html, /id="eventLog"/, 'v11 should include a reusable event log panel');
assert.match(html, /createInlineTabDeck/, 'v11 should wire inline tabs through lib/launcher.js');
assert.match(html, /createEventLog/, 'v11 should wire event log through lib/event-log.js');
assert.match(html, /filterArtifactsAdvanced/, 'v11 should wire filtering through lib/menu.js');
const nonZeroRadii = [...html.matchAll(/border-radius\s*:\s*([^;]+);/g)]
  .map((match) => match[1].trim())
  .filter((value) => !/^0(?:\.0+)?(?:px|rem|em|%)?$/i.test(value));
assert.deepEqual(nonZeroRadii, [], 'v11 inline styles should use square edges, not rounded corners');
assert.match(html, /id="sidebarResizeHandle"/, 'v11 should expose a draggable border between sidebar and main panel');
assert.match(html, /id="sidebarSplitResizeHandle"/, 'v11 should expose a draggable border between filter and lobby panels');
assert.match(html, /createResizablePanels/, 'v11 should wire panel resizing through lib/resizable-panels.js');
assert.match(html, /--sidebar-width/, 'v11 should persist sidebar width as a CSS variable');
assert.match(html, /--filter-panel-fr/, 'v11 should persist sidebar split as a CSS variable');
assert.match(html, /class="pixel-muse"/, 'v11 should include a small artistic endeavour sprite motif');
assert.match(html, /pixel-noise/, 'v11 should add slight pixel-art noisiness');
assert.match(html, /image-rendering:\s*pixelated/, 'v11 should lean into pixel rendering');
assert.match(html, /font-size:\s*0?\.65rem/, 'v11 tags should be tiny like v9');
assert.match(html, /gap:\s*0?\.35rem/, 'v11 should reduce visual gaps');
assert.match(html, /box-shadow:\s*4px 4px 0/, 'v11 should have harder nerdy edge shadows');
assert.match(html, /tagColorStyle/, 'v11 result tag pills should use shared tag color coding');
assert.match(html, /--tag-hue/, 'v11 should expose CSS variables for per-tag colors');

console.log('app-hub v11 index UI contract OK');

assert.match(html, /id="workspacePane"/, 'v11 should include a bottom split workspace pane for inline apps and logs');
assert.match(html, /id="workspaceResizeHandle"/, 'workspace pane should be height-resizable');
assert.match(html, /--workspace-height:\s*58vh/, 'workspace pane should default tall enough for inline apps');
assert.match(html, /--workspace-height/, 'workspace pane height should persist as a CSS variable');
assert.match(html, /id="workspaceTabs"/, 'workspace pane should expose shared tabs');
assert.match(html, /data-workspace-tab="appDeck"/, 'workspace tabs should include the inline app deck');
assert.match(html, /data-workspace-tab="eventLog"/, 'workspace tabs should include the event log');
assert.match(html, /class="workspace-tab active"[\s\S]*data-workspace-tab="eventLog"/, 'event log tab should be visible and selected by default');
assert.match(html, /id="eventLogPanel" class="workspace-panel stack active"/, 'event log panel should be selected by default');
assert.match(html, /id="appDeck" class="workspace-panel app-deck"/, 'inline app deck should not be the default selected workspace tab');
assert.match(html, /id="eventLogPanel"/, 'event log should live inside the workspace tab pane');
assert.match(html, /setWorkspaceTab/, 'v11 should switch workspace pane tabs');
assert.match(html, /workspacePane\.classList\.add\(["']active["']\)/, 'opening inline apps should show the split workspace pane');
assert.match(html, /min-height:\s*min\(520px, calc\(100vh - 96px\)\)/, 'workspace pane should not spawn at a tiny fixed height');
assert.match(html, /\.app-deck-inline-frame,[\s\S]*min-height:\s*480px/, 'inline app iframes should reserve a playable height');
assert.match(html, /id="defaultAction"/, 'v11 should expose a default artifact action selector');
assert.match(html, /readHubSetting\(["']defaultAction["'], ["']newWindow["']\)/, 'default artifact action should be new window');
assert.match(html, /data-artifact-title/, 'artifact title should be its own default-action trigger');
assert.match(html, /openSelected\(defaultAction\)/, 'title clicks should trigger the configured default action');
assert.doesNotMatch(html, /<section id="appDeck" class="card app-deck">/, 'app deck should not spawn as a standalone card below results');
assert.doesNotMatch(html, /<section class="card stack"><div class="row between"><strong>Event log<\/strong>/, 'event log should not be a standalone section below results');

assert.match(html, /class="badger-runner"/, 'v11 should show the bdg.gif badger runner at the bottom');
assert.match(html, /src="\.\.\/bdg\.gif"/, 'badger runner should use bdg.gif from the artifacts root');
assert.match(html, /@keyframes badger-run/, 'badger runner should animate across the bottom of the hub');
assert.match(html, /\.workspace-pane[\s\S]*resize:\s*vertical/, 'workspace pane should be directly resizable by the browser too');
assert.match(html, /\.workspace-pane[\s\S]*overflow:\s*auto/, 'workspace pane contents below results should be scrollable');
assert.match(html, /\.workspace-panel[\s\S]*overflow:\s*auto/, 'workspace tab panels should scroll instead of clipping content');
assert.match(html, /\.app-deck-panel[\s\S]*overflow:\s*auto/, 'inline app panels should scroll when embedded apps overflow');
assert.match(html, /\.results-panel[\s\S]*overflow:\s*auto/, 'filtered results panel should remain scrollable');
assert.match(html, /\.resize-handle[\s\S]*touch-action:\s*none/, 'drag handles should disable touch scrolling during resize');
assert.match(html, /workspacePane\.style\.resize\s*=\s*["']vertical["']/, 'v11 should explicitly enable browser vertical resize on the workspace pane');

assert.doesNotMatch(html, /drop-shadow\(/, 'badger runner should not use a drop shadow');

assert.match(html, /id="presenceMenu"/, 'presence context menu should exist');
assert.match(html, /presenceQuaternaryAction/, 'presence menu should include a fourth peer action slot');
assert.match(html, /spawn personal chat/, 'user context menu should allow spawning a personal chat');
assert.match(html, /function openPersonalChat\(target\)/, 'personal chat spawning should be implemented');
assert.match(html, /function joinPeerGame\(target, \{ spectate = false \} = \{\}\)/, 'user context menu should join or observe another peer game');
assert.match(html, /joinableGameIds = new Set\(\["bomberman-v10", "hyperblast-shooter", "v11-peer-daw"\]\)/, 'join flow should cover bomberman, shooter, and v11 DAW');
assert.match(html, /targetPeerId:\s*peerId/, 'join flow should pass target peer ids into launched apps');
assert.match(html, /observe:\s*spectate/, 'observe flow should mark launched apps as observe mode');
assert.match(html, /selectedChatChannel/, 'chat channels should track the active/personal channel');
assert.match(html, /#\$\{msg\.channel \|\| "general"\}/, 'lobby chat log should show per-channel messages');

assert.match(html, /channelUnreadCounts = readHubSetting\(["']channelUnreadCounts["'], \{\}\)/, 'chat should persist unread counts per channel');
assert.match(html, /function incrementChannelUnread\(channel\)/, 'chat should increment unread counts for background channels');
assert.match(html, /function clearChannelUnread\(channel\)/, 'chat should clear unread counts when a channel is selected');
assert.match(html, /data-unread-count/, 'chat channel buttons should expose unread count metadata');
assert.match(html, /aria-label="chat channel \$\{esc\(name\)\}/, 'chat channel buttons should announce channel names and unread state');
assert.match(html, /delivery:\s*"sending"/, 'local chat sends should start with a visible sending delivery state');
assert.match(html, /markLobbyChatDelivered\(message\.id, "sent"\)/, 'same-browser broadcast should mark local messages sent');
assert.match(html, /function markLobbyChatDelivered\(messageId, delivery\)/, 'chat should update delivery state after send attempts');
assert.match(html, /deliveryLabel\(msg\.delivery\)/, 'chat log should render delivery labels for local messages');
assert.equal((html.match(/const scale = Math\.min\(1, 128 \/ Math\.max\(bitmap\.width, bitmap\.height\)\);/g) || []).length, 1, 'palette extraction should define scale only once');
