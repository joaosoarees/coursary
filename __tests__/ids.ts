import KSUID from 'ksuid';

import { Account } from '@application/entities/Account';

export const anAccountId = (): Account.Id =>
  Account.toId(KSUID.randomSync().string);
