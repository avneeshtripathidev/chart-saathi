import { config } from '../config/env.js';
import type { ChartVacancyProvider } from './interface.js';
import { MockProvider } from './mock.provider.js';
import { RailCoreProvider } from './railcore.provider.js';
import { RailKitProvider } from './railkit.provider.js';

let _provider: ChartVacancyProvider | null = null;

export function getProvider(): ChartVacancyProvider {
  if (_provider) return _provider;

  switch (config.CHART_PROVIDER) {
    case 'railkit':
      _provider = new RailKitProvider();
      break;
    case 'railcore':
      _provider = new RailCoreProvider();
      break;
    case 'mock':
    default:
      _provider = new MockProvider();
  }

  return _provider;
}
