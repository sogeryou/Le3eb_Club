import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { isolatedApp } from '../helpers/isolatedApp';
import { latestBirthDate } from '../../shared/registration';
import { LOCAL_SEED_ACCOUNTS, LOCAL_SEED_PASSWORD } from '../../scripts/seed-local';
import { BUSINESS_TOKEN_KEY } from '../../client/router/routes';

test.use({ channel: 'chrome', viewport: { width: 390, height: 844 } });
test('welcomes signed-out users, sends returning users to Discover, and completes registration', async ({ browser }) => {
  test.setTimeout(45000);
  const app = await isolatedApp();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const open = async () => {
    await page.addInitScript(() => localStorage.setItem('le3eb_locale', 'en'));
    await page.goto(app.origin);
    await expect(page.getByRole('heading', { name: 'Find your next teammate' })).toBeVisible();
  };
  const verifyAddress = async (email: string) => {
    await page.getByRole('textbox', { name: 'Email' }).fill(email);
    await page.getByRole('button', { name: 'Send verification code' }).click();
    await expect(page.getByRole('button', { name: /Resend 0[01]:/ })).toBeDisabled();
    let code = '';
    await expect.poll(() => {
      try {
        const entry = readFileSync(path.join(app.root, 'logs/dev.log'), 'utf8').split('\n')
          .find(line => line.includes('auth_email_code') && line.includes(email));
        code = entry ? JSON.parse(entry).code : '';
      } catch { /* wait for the local mail log */ }
      return code;
    }).toMatch(/^\d{6}$/);
    await page.getByRole('textbox', { name: 'Verification code' }).fill(code);
    await page.getByRole('button', { name: 'Verify', exact: true }).click();
  };
  try {
    await open();
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await verifyAddress(LOCAL_SEED_ACCOUNTS.find(account => account.email.startsWith('buyer1@'))!.email);
    await expect(page.getByRole('heading', { name: 'Trending Realms' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Trending Realms' })).toBeVisible();

    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await open();
    await page.getByRole('button', { name: 'Create an account', exact: true }).click();
    await verifyAddress('browser-welcome@local.le3eb.invalid');
    await expect(page.getByRole('heading', { name: 'Complete your profile' })).toBeVisible();
    const finish = page.getByRole('button', { name: 'Finish registration' });
    await expect(finish).toBeDisabled();
    const nickname = page.getByRole('textbox', { name: 'Nickname' });
    await expect(nickname).toHaveAttribute('placeholder', '2–24 characters');
    await nickname.fill('Hello@Laeeb');
    await expect(nickname).toHaveAttribute('aria-invalid', 'true');
    const styledName = '★𞸋𞸀𞸏𞸁-𝓛𝓪𝓮𝓮𝓫★';
    await nickname.fill(styledName);
    await expect(nickname).toHaveAttribute('aria-invalid', 'false');
    const gender = page.getByRole('combobox', { name: /Gender/ });
    await expect(gender.locator('option:not([disabled])')).toHaveText(['Male', 'Female']);
    await gender.selectOption('M');
    await page.getByLabel('Region').selectOption('AE');
    await page.getByRole('button', { name: /Date of birth/ }).click();
    const picker = page.getByRole('dialog', { name: 'Date of birth' });
    const [year, month, day] = latestBirthDate().split('-').map(Number);
    await expect(picker.getByLabel('Year')).toHaveValue(String(year));
    await expect(picker.getByLabel('Month')).toHaveValue(String(month));
    await expect(picker.getByLabel('Day')).toHaveValue(String(day));
    await expect(picker.getByLabel('Day').locator('option')).toHaveCount(day);
    await picker.getByRole('button', { name: 'Confirm date' }).click();
    await expect(finish).toBeEnabled();
    const openChooser = async () => {
      const selected = page.waitForEvent('filechooser');
      await page.getByRole('button', { name: 'Choose photo' }).click();
      return selected;
    };
    await (await openChooser()).setFiles({ name: 'avatar.gif', mimeType: 'image/gif', buffer: Buffer.from('GIF89a') });
    await expect(page.getByRole('alert')).toHaveText(/JPEG, PNG or WebP/);
    const imageData = await page.evaluate(() => {
      const image = document.createElement('canvas');
      image.width = 800;
      image.height = 400;
      const context = image.getContext('2d')!;
      context.fillStyle = '#f00';
      context.fillRect(0, 0, 400, 400);
      context.fillStyle = '#00f';
      context.fillRect(400, 0, 400, 400);
      return image.toDataURL().split(',')[1];
    });
    const file = { name: 'avatar.png', mimeType: 'image/png', buffer: Buffer.from(imageData, 'base64') };
    const avatar = page.getByRole('button', { name: 'Choose photo' }).locator('img');
    await (await openChooser()).setFiles(file);
    const crop = page.getByRole('dialog', { name: 'Crop profile photo' });
    await expect(crop).toBeVisible();
    await crop.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(avatar).toHaveAttribute('src', '/default-companion.svg');

    await (await openChooser()).setFiles(file);
    const apply = crop.getByRole('button', { name: 'Use this crop' });
    await expect(apply).toBeEnabled();
    await expect(crop.getByRole('slider')).toHaveCount(0);
    const frame = await crop.locator('canvas').boundingBox();
    if (!frame) throw new Error('Crop preview is not visible');
    await page.mouse.move(frame.x + frame.width / 2, frame.y + frame.height / 2);
    await page.mouse.wheel(0, -1800);
    await page.mouse.move(frame.x + frame.width * .8, frame.y + frame.height / 2);
    await page.mouse.down();
    await page.mouse.move(frame.x + frame.width * .2, frame.y + frame.height / 2, { steps: 5 });
    await page.mouse.up();
    await apply.click();
    await expect(avatar).toHaveAttribute('src', /^blob:/);
    const avatarPixels = async (image: HTMLImageElement) => {
      await image.decode();
      const draw = document.createElement('canvas');
      draw.width = draw.height = 1;
      const ctx = draw.getContext('2d')!;
      ctx.drawImage(image, 0, 0, 1, 1);
      return { width: image.naturalWidth, height: image.naturalHeight, rgba: Array.from(ctx.getImageData(0, 0, 1, 1).data) };
    };
    const cropped = await avatar.evaluate(avatarPixels);
    expect(cropped).toMatchObject({ width: 512, height: 512 });
    expect(cropped.rgba[2]).toBeGreaterThan(230);
    expect(await avatar.evaluate(image => image.getBoundingClientRect().height)).toBeLessThan(67);
    await finish.click();
    const confirmation = page.getByRole('dialog', { name: 'Confirm your gender' });
    await expect(confirmation).toBeVisible();
    await expect(confirmation.getByText('Male', { exact: true })).toBeVisible();
    await confirmation.getByRole('button', { name: 'Go back' }).click();
    await expect(confirmation).toBeHidden();
    await gender.selectOption('F');
    await finish.click();
    await expect(confirmation.getByText('Female', { exact: true })).toBeVisible();
    await confirmation.getByRole('button', { name: 'Confirm and register' }).click();
    await expect(page.getByRole('heading', { name: 'Trending Realms' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pick your favorite games' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Me', exact: true }).click();
    await expect(page.getByRole('heading', { name: styledName })).toBeVisible();
    const savedAvatar = page.locator('img[src*="/api/uploads/avatar/"]').first();
    await expect(savedAvatar).toBeVisible();
    expect((await savedAvatar.evaluate(avatarPixels)).rgba[2]).toBeGreaterThan(230);
    await page.evaluate(() => document.fonts.ready);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument');
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: 'h1.laeeb-nickname bdi' });
    const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
    expect(fonts.some(font => font.isCustomFont && /Amiri/.test(font.familyName) && font.glyphCount >= 4)).toBe(true);
    expect(fonts.some(font => font.isCustomFont && /Noto Sans Math/.test(font.familyName) && font.glyphCount >= 5)).toBe(true);
    await cdp.detach();

    const registrationToken = await page.evaluate(key => localStorage.getItem(key), BUSINESS_TOKEN_KEY);
    const companionId = app.state().companions.find((companion: { userId: string }) => companion.userId === 'local_player_pubg').id;
    const conversationResponse = await page.request.post(app.origin + '/api/conversations', {
      data: { companionId }, headers: { Authorization: 'Bearer ' + registrationToken },
    });
    expect(conversationResponse.ok()).toBe(true);
    const playerLogin = await page.request.post(app.origin + '/api/auth/login', {
      data: { email: 'pubg@local.le3eb.invalid', password: LOCAL_SEED_PASSWORD },
    });
    expect(playerLogin.ok()).toBe(true);
    const playerSession = await playerLogin.json();
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: BUSINESS_TOKEN_KEY, value: playerSession.token });
    await page.setViewportSize({ width: 320, height: 800 });
    await page.reload();
    await page.getByRole('button', { name: 'Messages', exact: true }).click();
    const nicknameInMessages = page.locator('strong.laeeb-nickname bdi').filter({ hasText: styledName });
    await expect(nicknameInMessages).toHaveText(styledName);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  } finally {
    await page.close();
    await app.stop();
  }
});

test('Arabic profile leaves room for the long region label on a narrow phone', async ({ browser }) => {
  const app = await isolatedApp({ seeded: false });
  const page = await browser.newPage({ viewport: { width: 320, height: 750 } });
  try {
    await page.addInitScript(() => localStorage.setItem('le3eb_locale', 'ar'));
    await page.route('**/api/auth/email-code/send', route => route.fulfill({ json: { cooldownSec: 60 } }));
    await page.route('**/api/auth/welcome/email', route => route.fulfill({
      json: { kind: 'profile', email: 'layout@example.com', ticket: 'layout-preview' },
    }));
    await page.goto(app.origin);
    await page.getByRole('button', { name: 'إنشاء حساب', exact: true }).click();
    await page.getByRole('textbox', { name: /البريد الإلكتروني/ }).fill('layout@example.com');
    await page.getByRole('button', { name: 'إرسال رمز التحقق' }).click();
    await page.getByRole('textbox', { name: 'رمز التحقق' }).fill('123456');
    await page.getByRole('button', { name: 'تحقّق', exact: true }).click();
    const region = page.getByRole('combobox', { name: /المنطقة/ });
    const nickname = page.getByRole('textbox', { name: 'الاسم المستعار' });
    await expect(nickname).toHaveAttribute('placeholder', 'من ٢ إلى ٢٤ حرفًا');
    await expect(nickname).toHaveCSS('text-align', 'right');
    await region.selectOption('AE');
    await page.evaluate(() => document.fonts.ready);
    expect(await region.evaluate((element: HTMLSelectElement) => {
      const style = getComputedStyle(element);
      const canvas = document.createElement('canvas').getContext('2d')!;
      canvas.font = `${style.fontSize} ${style.fontFamily}`;
      return style.direction === 'rtl' && canvas.measureText(element.selectedOptions[0].text).width <
        element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    })).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
    const arrows = await page.locator('.wa-select-wrap svg, .wa-date-trigger svg').evaluateAll(elements => elements.map(element => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      const control = element.parentElement!.getBoundingClientRect();
      return { width: style.width, height: style.height, color: style.color, side: box.left - control.left < 20 ? 'left' : 'right' };
    }));
    expect(arrows).toHaveLength(3);
    expect(arrows).toEqual(Array(3).fill({ ...arrows[0], side: 'left' }));

    const fixture = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 400;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 800, 400);
      ctx.fillStyle = '#fff';
      ctx.fillRect(345, 0, 110, 400);
      return canvas.toDataURL().split(',')[1];
    });
    const choice = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'اختر صورة', exact: true }).click();
    await (await choice).setFiles({ name: 'pinch-test.png', mimeType: 'image/png', buffer: Buffer.from(fixture, 'base64') });
    const crop = page.getByRole('dialog', { name: 'قصّ الصورة الشخصية' });
    await expect(crop.getByRole('button', { name: 'استخدم هذا القصّ' })).toBeEnabled();
    const canvas = crop.locator('canvas');
    const shade = () => canvas.evaluate(element => (element as HTMLCanvasElement).getContext('2d')!.getImageData(128, 256, 1, 1).data[0]);
    expect(await shade()).toBe(0);
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Missing touch crop frame');
    const y = Math.round(box.y + box.height / 2);
    const centerX = Math.round(box.x + box.width / 2);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 });
    const points = (radius: number) => [{ id: 1, x: centerX - radius, y }, { id: 2, x: centerX + radius, y }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(25) });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(55) });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(shade).toBe(255);
    await cdp.detach();
  } finally {
    await page.close();
    await app.stop();
  }
});

test('Google button follows the selected language instead of the browser language', async ({ browser }) => {
  const app = await isolatedApp({ seeded: false });
  try {
    for (const [language, login] of [['ar', 'تسجيل الدخول'], ['en', 'Log in']] as const) {
      const page = await browser.newPage({ locale: 'zh-CN' });
      try {
        await page.addInitScript(value => localStorage.setItem('le3eb_locale', value), language);
        await page.route('**/api/auth/welcome/google/start', route => route.fulfill({ json: { clientId: 'test.apps.googleusercontent.com', nonce: 'test' } }));
        await page.route('https://accounts.google.com/gsi/client**', route => {
          const sdkLanguage = new URL(route.request().url()).searchParams.get('hl') || 'zh-CN';
          return route.fulfill({ contentType: 'application/javascript', body: `window.google={accounts:{id:{initialize(){},renderButton(host,options){host.dataset.sdkLanguage=${JSON.stringify(sdkLanguage)};host.dataset.buttonLanguage=options.locale;}}}};` });
        });
        await page.goto(app.origin);
        await page.getByRole('button', { name: login, exact: true }).click();
        const google = page.locator('.wa-google > div');
        await expect(google).toHaveAttribute('data-sdk-language', language);
        await expect(google).toHaveAttribute('data-button-language', language);
      } finally { await page.close(); }
    }
  } finally { await app.stop(); }
});
