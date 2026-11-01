import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('loads data, filters charts, and exposes table equivalents',async({page})=>{
 await page.goto('/');await expect(page.getByRole('heading',{name:'A clearer view of every campaign.'})).toBeVisible();
 await page.getByLabel('Campaign',{exact:true}).selectOption('Search Brand');
 await expect(page.getByText('$1,250',{exact:true})).toBeVisible();
 await page.getByText('View spend data table',{exact:true}).click();
 await expect(page.getByRole('table',{name:'Spend by campaign (USD)'})).toBeVisible();
 await page.getByRole('button',{name:'Reset demo'}).click();
 await expect(page.getByText('$11,650',{exact:true})).toBeVisible();
});
test('uploads CSV safely and reports malformed input',async({page})=>{
 await page.goto('/');
 await page.getByLabel('Upload campaign CSV').setInputFiles({name:'test.csv',mimeType:'text/csv',buffer:Buffer.from('campaign,spend,clicks,conversions\nTest,100,200,10')});
 await expect(page.getByRole('status')).toContainText('Loaded 1 campaigns');
 await page.getByLabel('Upload campaign CSV').setInputFiles({name:'bad.csv',mimeType:'text/csv',buffer:Buffer.from('wrong,headers\n1,2')});
 await expect(page.getByRole('alert').filter({hasText:'Required columns'})).toContainText('Required columns');
});
test('verified summary, keyboard skip link, and chart navigation',async({page})=>{
 await page.goto('/');await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'Skip to dashboard'})).toBeFocused();
 await page.keyboard.press('Enter');await expect(page.locator('#main')).toBeFocused();
 await page.getByRole('button',{name:'Refresh verified summary'}).click();
 await expect(page.getByRole('status')).toContainText('passed numeric validation');
 const chart=page.locator('.chart-card').first().locator('.a11y_desc');
 await expect(chart).toHaveAttribute('tabindex','0');
 await chart.focus();await expect(chart).toBeFocused();await page.keyboard.press('ArrowDown');
 await expect(page.locator('.chart-card').first().locator('rect').first()).toBeFocused();
 await page.keyboard.press('ArrowRight');
 await expect(page.locator('.chart-card').first().locator('rect').nth(1)).toBeFocused();
});
test('no serious or critical axe violations on default dashboard',async({page})=>{
 await page.goto('/');
 const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 expect(results.violations.filter(v=>['serious','critical'].includes(v.impact||''))).toEqual([]);
});
