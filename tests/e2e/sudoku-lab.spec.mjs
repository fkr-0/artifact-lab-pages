import {test,expect} from '@playwright/test';

test('expert sudoku is interactive, preserves puzzle identity and local progress', async({page})=>{
 await page.goto('/sudoku-lab/index.html?seed=42');
 await expect(page.getByRole('heading',{name:/Think nine/i})).toBeVisible();
 await expect(page.locator('#grid .cell')).toHaveCount(81);
 await expect(page.locator('#progress')).toHaveText('23 / 81');
 const chosen=page.locator('#grid .cell:not(.given)').first();
 await chosen.click();
 await page.keyboard.press('1');
 await expect(page.locator('#progress')).toHaveText('24 / 81');
 await page.locator('#undo').click();
 await expect(page.locator('#progress')).toHaveText('23 / 81');
 await page.locator('#redo').click();
 await expect(page.locator('#progress')).toHaveText('24 / 81');
 await page.reload();
 await expect(page.locator('#progress')).toHaveText('24 / 81');
 await page.locator('#pause').click();
 await expect(page.locator('#veil')).toBeVisible();
 await page.locator('#resume').click();
 await expect(page.locator('#veil')).toBeHidden();
 await page.locator('#restart').click();
});

test('pencil and hints work without revealing a solution by default',async({page})=>{
 page.on('dialog',d=>d.accept());
 await page.goto('/sudoku-lab/index.html?seed=31415');
 await page.locator('#grid .cell:not(.given)').first().click();
 await page.locator('#notes').click();
 await page.keyboard.press('5');
 await expect(page.locator('#progress')).toHaveText('23 / 81');
 await expect(page.locator('#grid .cell.selected .marks')).toBeVisible();
 await page.locator('#hint').click();
 await expect(page.locator('#hint-text')).not.toBeEmpty();
 await page.locator('#new').click();
 await expect(page.locator('#progress')).toHaveText('23 / 81');
 await expect(page).toHaveURL(/seed=/);
});

test('mobile layout exposes full grid and keypad',async({page})=>{
 await page.setViewportSize({width:375,height:812});
 await page.goto('/sudoku-lab/index.html?seed=7');
 await expect(page.locator('#grid .cell')).toHaveCount(81);
 await expect(page.locator('#keypad button')).toHaveCount(9);
 const width=await page.evaluate(()=>document.documentElement.scrollWidth);
 expect(width).toBeLessThanOrEqual(375);
});
