import { expect, test } from '@playwright/test';

async function collectPageErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

function seriousErrors(errors) {
  return errors.filter((message) => {
    const text = String(message || '').toLowerCase();
    return !text.includes('failed to load resource')
      && !text.includes('favicon')
      && !text.includes('peerjs')
      && !text.includes('websocket')
      && !text.includes('networkerror')
      && !text.includes('net::err')
      && !text.includes('qrcode');
  });
}

test.describe('app-hub-v11 Peernet file sharing', () => {
  test('bootstraps a download panel from share-link parameters', async ({ page }) => {
    const errors = await collectPageErrors(page);
    await page.goto('/app-hub-v11/index.html?dl=1&lobby=nexus-v11-hub-main&from=peer-sender&offer=file-demo&token=cap-demo&name=demo.txt&size=11&mime=text%2Fplain');

    await expect(page.locator('#fileSharePanel.open')).toBeVisible();
    await expect(page.locator('#fileShareTitle')).toHaveText('Incoming file offer');
    await expect(page.locator('#fileShareStatus')).toContainText('demo.txt');
    await expect(page.locator('#fileShareStatus')).toContainText('11 B');
    await expect(page.locator('#requestFileShare')).toBeVisible();
    await expect(page.locator('#denyFileShare')).toBeVisible();
    await expect(page.locator('#fileShareUrl')).toHaveValue(/offer=file-demo/);
    await expect(page.locator('#fileShareQr')).toBeVisible();
    expect(seriousErrors(errors)).toEqual([]);
  });

  test('adds share file to the remote user context menu', async ({ page }) => {
    const errors = await collectPageErrors(page);
    await page.goto('/app-hub-v11/index.html');
    await page.locator('[data-workspace-tab="lobbyChat"]').click();
    await expect(page.locator('#onlineUsers')).toBeVisible();
    await page.evaluate(() => {
      const row = document.createElement('div');
      row.className = 'row online-user';
      row.dataset.self = 'false';
      row.dataset.peerId = 'peer-file-test';
      row.dataset.label = 'File Peer';
      row.textContent = 'File Peer · connected';
      document.querySelector('#onlineUsers')?.append(row);
    });
    await page.locator('[data-peer-id="peer-file-test"]').click({ button: 'right' });
    await expect(page.locator('#presenceMenu.open')).toBeVisible();
    await expect(page.locator('#presenceFileShareAction')).toBeVisible();
    await expect(page.locator('#presenceFileShareAction')).toHaveText('share file');
    expect(seriousErrors(errors)).toEqual([]);
  });
});
