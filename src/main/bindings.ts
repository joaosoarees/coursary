import { AuthGateway } from '@application/gateways/AuthGateway';
import { AccountRepository } from '@application/repositories/AccountRepository';
import { DynamoAccountRepository } from '@infra/database/dynamo/repositories/DynamoAccountRepository';
import { CognitoAuthGateway } from '@infra/gateways/CognitoAuthGateway';
import { Registry } from '@kernel/di/Registry';

const registry = Registry.getInstance();

registry.bind(AccountRepository, DynamoAccountRepository);
registry.bind(AuthGateway, CognitoAuthGateway);
