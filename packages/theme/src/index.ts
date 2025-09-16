import { cssVariableMap } from './tokens';
export * from './tokens';

export const themeCssVariables = () =>
  Object.entries(cssVariableMap)
    .map(([key, value]) => ${key}: ;)
    .join('\n');

