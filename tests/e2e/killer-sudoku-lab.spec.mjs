import {test,expect} from '@playwright/test';

test('Killer Sudoku renders sum cages, responds to keyboard and saves state',async({page})=>{
 await page.goto('/killer-sudoku-lab/index.html?seed=42');
 await expect(page.getByRole('heading',{name:/Make every sum count/i})).toBeVisible();
 await expect(page.locator('#grid .cell')).toHaveCount(81);
 expect(await page.locator('#grid .cell .cage-sum').count()).toBeGreaterThan(20);
 await expect(page.locator('#progress')).toHaveText('0 / 81');
 await page.locator('#grid .cell').first().click();
 await page.keyboard.press('1');
 await expect(page.locator('#progress')).toHaveText('1 / 81');
 await page.locator('#undo').click();
 await expect(page.locator('#progress')).toHaveText('0 / 81');
 await page.locator('#redo').click();
 await expect(page.locator('#progress')).toHaveText('1 / 81');
 await page.reload();
 await expect(page.locator('#progress')).toHaveText('1 / 81');
 await page.locator('#pause').click();
 await expect(page.locator('#veil')).toBeVisible();
 await page.locator('#resume').click();
 await expect(page.locator('#veil')).toBeHidden();
});
test('Killer cage notes and hints are interactive',async({page})=>{
 page.on('dialog',dialog=>dialog.accept());
 await page.goto('/killer-sudoku-lab/index.html?seed=143');
 await page.locator('#grid .cell').first().click();
 await page.locator('#notes').click();
 await page.keyboard.press('5');
 await expect(page.locator('#progress')).toHaveText('0 / 81');
 await expect(page.locator('#grid .cell.selected .marks')).toBeVisible();
 await page.locator('#hint').click();
 await expect(page.locator('#hint-text')).not.toBeEmpty();
 await page.locator('#new').click();
 await expect(page.locator('#progress')).toHaveText('0 / 81');
 await expect(page).toHaveURL(/seed=/);
});
test('Killer grid fits mobile width and number pad has usable targets',async({page})=>{
 await page.setViewportSize({width:375,height:812});
 await page.goto('/killer-sudoku-lab/index.html?seed=7');
 await expect(page.locator('#grid .cell')).toHaveCount(81);
 await expect(page.locator('#keypad button')).toHaveCount(9);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
 expect(await page.locator('#keypad button').first().evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
});
