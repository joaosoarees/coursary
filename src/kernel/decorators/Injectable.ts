import { Registry } from '@kernel/di/Registry';
import type { Constructor } from '@kernel/di/types';

export function Injectable(): ClassDecorator {
  return (target) => {
    Registry.getInstance().register(target as unknown as Constructor);
  };
}
