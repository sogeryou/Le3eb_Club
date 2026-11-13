// Standalone restoration guard; intentionally outside the default Vitest suite.
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const routes = `HOME COMMUNITY POST_DETAIL GAME_DETAIL PROFILE ORDER_CONFIRM LEGEND_LIST ALL_REVIEWS CATEGORY_SERVICES IM IM_DETAIL NOTIFICATIONS CONTACTS COMMUNITY_SELECTOR ME WALLET RECHARGE WITHDRAW EXCHANGE_DIAMONDS APPLY_PLAYER APPLY_PLAYER_CATEGORY APPLY_PLAYER_DETAILS APPLY_PLAYER_SERVICE_FORM SETTINGS PURCHASE_HISTORY PLAYER_ORDERS ORDER_DETAIL SETTINGS_EDIT_PROFILE SETTINGS_CHANGE_PASSWORD SETTINGS_LINKED_ACCOUNTS SETTINGS_LANGUAGE SETTINGS_PRIVACY SETTINGS_TERMS PLAYER_CENTER RANKING_CENTER PLAYER_SERVICES COMPANION_LEVEL_DASHBOARD TASK_CENTER LEVEL_BENEFITS INCOME_REVIEW CUSTOMER_REVIEW SETTINGS_NOTIFICATIONS SETTINGS_BLACKLIST FEEDBACK MANAGE_PLAYLINKS ADD_PLAYLINK NEW_USERS NEW_EPALS_LIST`.split(' ');
const routeSource = readFileSync('client/router/routes.ts', 'utf8');
const missing = routes.filter(route => !routeSource.includes(`'${route}'`));
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
  ? (['dist', 'node_modules', '.vite'].includes(entry.name) ? [] : walk(`${dir}/${entry.name}`)) : [`${dir}/${entry.name}`]);
const clientFiles = walk('client').filter(file => /\.(tsx?|css|svg|html)$/.test(file));
const banned = /picsum|unsplash|MOCK_ICEBREAKER_USERS|mockPLAYER|Lumina_Sky|League Pro|Tactical Duo|Battle Royale|Open World|Just Chatting|88886666|(?:green|emerald)-\d|#(?:07382a|f8f1e5|c79a3b|efd9a0|fff9ed|85601c|e0cda5)\b|\b\d[\d,.]*[kKmM]?\s+ONLINE\b/i;
const violations = clientFiles.filter(file => {
  try { return banned.test(readFileSync(file, 'utf8')); } catch { return false; }
});
const stateSource = readFileSync('client/app/useAppState.ts', 'utf8');
const fakeCoupons = /New User Discount|Weekend Special/.test(stateSource);
const fakeAccountState = /useState\(1250\)|new Set\(\['1', '2', '3', '5'\]\)/.test(stateSource);
const homeSource = readFileSync('client/original/OriginalPresentation.tsx', 'utf8');
const missingHomeStructure = !['Trending Realms', 'Legend EPals', 'New EPals', 'More EPals'].every(marker => homeSource.includes(marker));
const unsafeSourceClaims = /userDiamonds\s*\/\s*100|setImage\('\/default-cover\.svg'\)|Last updated: April 4, 2026|Get extra diamonds from happy customers/.test(homeSource);
const missingRender = routes.filter(route => !homeSource.includes(`currentView === '${route}'`));
const protectedDiff = execFileSync('git', ['diff', '--name-only', '8e589eb', '--', 'backend', 'shared', 'admin', 'tests', 'scripts/seed-local.ts', 'scripts/prove-regression-guard.ts'], { encoding: 'utf8' }).trim();
if (missing.length) console.error(`Missing original routes (${missing.length}): ${missing.join(', ')}`);
if (violations.length) console.error(`Forbidden fixture references: ${violations.join(', ')}`);
if (fakeCoupons) console.error('Client state contains fabricated coupons.');
if (fakeAccountState) console.error('Client state contains fabricated account data.');
if (missingHomeStructure) console.error('Original home sections are not restored.');
if (unsafeSourceClaims) console.error('Source prototype contains a fixed money rate, fabricated attachment, or unapproved published claim.');
if (missingRender.length) console.error(`Original route render branches missing: ${missingRender.join(', ')}`);
if (protectedDiff) console.error(`Protected paths changed:\n${protectedDiff}`);
if (missing.length || missingRender.length || violations.length || fakeCoupons || fakeAccountState || missingHomeStructure || unsafeSourceClaims || protectedDiff) process.exitCode = 1;
else console.log(`Restoration guard passed: ${routes.length} original route keys, no banned fixture references, protected paths unchanged.`);
