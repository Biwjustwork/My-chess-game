import { movementRules } from './movementRules';
import { captureRules } from './captureRules';
import { specialRules } from './specialRules';

const rulePool = [
  ...movementRules,
  ...captureRules,
  ...specialRules,
];

export default rulePool;
