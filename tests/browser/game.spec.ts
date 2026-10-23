import { test, expect } from '@playwright/test';

test('ホームから探索を開始し、移動を省略して技を選べる', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();
  await expect(page.locator('#homeView')).toBeVisible();
  await expect(page.locator('#modelError')).toHaveCount(0);
  await page.locator('#homeGo').click();await page.locator('[data-quest-id="hunt"] button').click();
  await expect(page.locator('#questDialog .quest-target')).toContainText('すべての敵を倒す');
  await page.locator('#questConfirm').click();
  await expect(page.locator('#battleView')).toBeVisible();
  await page.locator('#pass').click();
  await expect(page.getByRole('button', { name: /噛みつく/ })).toBeVisible();
  await expect(page.locator('#homeTab')).toHaveCount(0);
  await expect(page.locator('#baseTab')).toHaveCount(0);
  await expect(page.locator('#objective')).toContainText('クリア条件：現在の敵をすべて倒す ／ 残り 1体 · 1/3 前哨戦');
  await expect(page.locator('#attackHelp')).toBeHidden();
  await expect(page.locator('#instruction')).toBeHidden();
  expect(errors).toEqual([]);
  await page.screenshot({ path: test.info().outputPath('battle.png') });
});


test('出発の取消と撤退を明確にし、撤退後は新規戦闘になる', async ({ page }) => {
  await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();
  await expect(page.locator('#battleTab')).toHaveCount(0);
  await page.locator('#homeGo').click();await page.locator('[data-quest-id="hunt"] button').click();
  await page.locator('#questCancel').click();
  await expect(page.locator('#baseView')).toBeVisible();
  await page.locator('[data-quest-id="hunt"] button').click();
  await page.locator('#questConfirm').click();
  const before = await page.evaluate(() => localStorage.getItem('lightShadowSave'));
  await page.locator('#restart').click();
  await page.locator('#questCancel').click();
  await expect(page.locator('#battleView')).toBeVisible();
  await page.locator('#restart').click();
  await page.locator('#questConfirm').click();
  await expect(page.locator('#resultTitle')).toHaveText('クエスト撤退');
  await expect(page.locator('#resultRewards')).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('lightShadowSave'))).toBe(before);
  await page.locator('#resultHome').click();
  await expect(page.locator('#homeGo')).toHaveText('クエストへ ›');
  await page.locator('#homeGo').click();await page.locator('[data-quest-id="hunt"] button').click();
  await page.locator('#questConfirm').click();
  await expect(page.locator('#round')).toHaveText('第1ターン');
});

test('相棒を大きく表示し、装備の試着で保存データを変えない', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()+' '+m.location().url); });
  await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();
  await page.screenshot({ path: test.info().outputPath('home.png') });
  await page.locator('[data-companion="light"]').click();
  await expect(page.locator('#companionDialog')).toBeVisible();
  await expect(page.locator('#companionTitle')).toHaveText('光の猟犬');
  const before = await page.evaluate(() => localStorage.getItem('lightShadowSave'));
  await page.locator('#previewCharm').selectOption('lantern-collar');
  await page.locator('#previewEquipment').check();
  await page.locator('#rotateCompanion').fill('86');
  await page.waitForTimeout(500);
  await page.screenshot({ path: test.info().outputPath('light-equipped.png') });
  expect(await page.evaluate(() => localStorage.getItem('lightShadowSave'))).toBe(before);
  await page.locator('#closeCompanion').click();
  await page.locator('[data-companion="shadow"]').click();
  await page.locator('#previewCharm').selectOption('shadow-weave');
  await page.locator('#previewEquipment').check();
  await page.locator('#rotateCompanion').fill('86');
  await page.waitForTimeout(500);
  await page.screenshot({ path: test.info().outputPath('shadow-equipped.png') });
  await expect(page.locator('#companionTitle')).toHaveText('影の猟犬');
  expect(errors).toEqual([]);
});

test('お守りの作成・付け替え・専用品の後半解放・保存を確認する', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lightShadowSave', JSON.stringify({
    cleared: ['hunt', 'relic'], user: 1, uxp: 0, wins: 2, materials: { metal: 12, crystal: 12 },
    light: { level: 1, xp: 0, power: 0, guard: 0, gear: false },
    shadow: { level: 1, xp: 0, power: 0, guard: 0, gear: false },
  })));
  await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();await page.locator('#homeRoster').click();await page.locator('[data-train-open="dawn"]').click();
  await expect(page.locator('[data-growth-equipment]')).toHaveCount(7);
  await expect(page.locator('[data-growth-equipment="lantern-collar"]')).toBeDisabled();
  await page.locator('[data-growth-equipment="fang"]').click();
  await expect(page.locator('#houndTraining')).toContainText('牙鉄のお守り');
  await page.locator('[data-growth-equipment="ward"]').click();
  await page.locator('[data-growth-equipment="fang"]').click();
  await page.locator('#closeTraining').click();await page.locator('[data-train-open="dusk"]').click();
  await page.locator('[data-growth-equipment="vitality"]').click();
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('lightShadowSave')!));
  expect(save.light.equipment).toBe('fang');expect(save.shadow.equipment).toBe('vitality');
  expect(save.materials).toEqual({metal:9,crystal:8});
  await page.locator('#companionHub').evaluate(e=>e.scrollTop=0);
  await page.screenshot({ path: test.info().outputPath('forge.png') });
  await page.locator('#closeHub').click();await page.locator('[data-companion="shadow"]').click();
  await expect(page.locator('#previewEquipment')).toBeChecked();
  await expect(page.locator('#companionEquipment')).toContainText('装備中');
  await page.locator('#closeCompanion').click();
  await page.locator('#homeGo').click();await page.locator('[data-quest-id="rescue"] button').click();await page.locator('#questConfirm').click();
  await expect(page.locator('#shadowStatus')).toContainText('HP 9/9');
});

test('旧専用装備の引き継ぎと後半の特製品作成', async ({ page }) => {
 await page.addInitScript(() => localStorage.setItem('lightShadowSave', JSON.stringify({
   cleared:['hunt','relic','rescue'],user:1,uxp:0,wins:3,materials:{metal:12,crystal:12},
   light:{level:1,xp:0,power:0,guard:0,gear:true},shadow:{level:1,xp:0,power:0,guard:0,gear:false},
 })));
 await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();await page.locator('[data-companion="light"]').click();
 await expect(page.locator('#previewCharm')).toHaveValue('lantern-collar');
 await expect(page.locator('#companionEquipment')).toContainText('装備中');
 await page.locator('#closeCompanion').click();await page.locator('#homeRoster').click();await page.locator('[data-train-open="dawn"]').click();
 await page.locator('#closeTraining').click();await page.locator('[data-train-open="dusk"]').click();
 await expect(page.locator('[data-growth-equipment]')).toHaveCount(7);
 await page.locator('[data-growth-equipment="shadow-weave"]').click();
 const save=await page.evaluate(()=>JSON.parse(localStorage.getItem('lightShadowSave')!));
 expect(save.shadow.equipment).toBe('shadow-weave');expect(save.light.equipment).toBe('lantern-collar');
 expect(save.materials).toEqual({metal:10,crystal:6});
});

test('新しい描画でも全112マスの投影位置と選択位置が一致する', async ({ page }) => {
  await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();
  const mismatch = await page.evaluate(async () => {
    const moduleUrl = '/src/render/three-world.ts';
    const { HoundWorld } = await import(moduleUrl);
    const canvas = document.createElement('canvas');
    canvas.width = 900; canvas.height = innerHeight > innerWidth ? 1200 : 500;
    const world = new HoundWorld(canvas);
    const errors: string[] = [];
    try {
      for (const [eye, target] of [ [[10.5, 18, 25], [7, .25, 4.35]], [[28, 25, 4.7], [7, .15, 4]] ]) {
        world.camera(eye, target, 20);
        for (let y = 0; y < 8; y++) for (let x = 0; x < 14; x++) {
          const screen = world.project([x + .5, 0, y + .5]);
          const hit = world.pick(screen.x, screen.y, 14, 8);
          if (hit.x !== x || hit.y !== y) errors.push(`${x},${y}`);
        }
      }
    } finally { world.dispose(); }
    return errors;
  });
  expect(mismatch).toEqual([]);
});
