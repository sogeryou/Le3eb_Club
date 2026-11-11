import { buildRechargePackages, moneyConfig, validatePackages } from '../backend/policy/moneyConfig.js';
import { validateLevelingConfig } from '../backend/policy/leveling.js';

validatePackages(buildRechargePackages(moneyConfig), moneyConfig);
validateLevelingConfig();
console.log('validate-money: configured packages and policy passed', moneyConfig.policyId);
