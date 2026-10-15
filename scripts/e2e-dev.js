// Calls the deployed dev API as real clients do, with throwaway accounts that it
// creates, confirms and deletes itself: no mailbox, no token pasted by hand.
// Needs the project's AWS credentials (AWS_PROFILE in .env).
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

const stage = 'dev';
const region = 'sa-east-1';
const baseUrl =
  process.env.E2E_BASE_URL ?? 'https://api-dev.coursary.joaodevdude.com';
const service = `coursary-api-${stage}`;
const table = `${service}-MainTable`;

function aws(...args) {
  const output = execFileSync(
    'aws',
    [...args, '--region', region, '--output', 'json'],
    { encoding: 'utf8' },
  );

  return output.trim() ? JSON.parse(output) : undefined;
}

const poolId = aws(
  'cloudformation',
  'describe-stack-resource',
  '--stack-name',
  service,
  '--logical-resource-id',
  'UserPool',
).StackResourceDetail.PhysicalResourceId;

async function call(method, path, { token, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();

  return { status: response.status, body: text ? JSON.parse(text) : undefined };
}

let failures = 0;

function check(name, response, status, code) {
  const passed =
    response.status === status &&
    (code === undefined || response.body?.error?.code === code);
  failures += passed ? 0 : 1;
  const expected = code ? `${status} ${code}` : String(status);
  const got = `${response.status} ${response.body?.error?.code ?? ''}`.trim();
  console.log(
    `${passed ? 'ok  ' : 'FAIL'} ${name} (expected ${expected}, got ${got})`,
  );
}

const created = [];

async function createAccount(label) {
  const email = `success+e2e-${label}-${Date.now()}@simulator.amazonses.com`;
  const password = `E2e${randomBytes(9).toString('hex')}1`;
  const signUp = await call('POST', '/auth/sign-up', {
    body: { name: `E2E ${label}`, email, password },
  });

  if (signUp.status !== 201) {
    throw new Error(`Sign-up of ${label} answered ${signUp.status}.`);
  }

  created.push({ email, accountId: signUp.body.accountId });
  aws(
    'cognito-idp',
    'admin-confirm-sign-up',
    '--user-pool-id',
    poolId,
    '--username',
    email,
  );
  // The confirmation route needs the code sent by e-mail; this writes what it
  // writes (Q139): the account ACTIVE and both items without expiresAt.
  const accountKey = {
    PK: { S: `ACCOUNT#${signUp.body.accountId}` },
    SK: { S: `ACCOUNT#${signUp.body.accountId}` },
  };
  const claimKey = {
    PK: { S: `EMAIL_CLAIM#${email}` },
    SK: { S: `EMAIL_CLAIM#${email}` },
  };
  aws(
    'dynamodb',
    'update-item',
    '--table-name',
    table,
    '--key',
    JSON.stringify(accountKey),
    '--update-expression',
    'SET #status = :active REMOVE expiresAt',
    '--expression-attribute-names',
    JSON.stringify({ '#status': 'status' }),
    '--expression-attribute-values',
    JSON.stringify({ ':active': { S: 'ACTIVE' } }),
  );
  aws(
    'dynamodb',
    'update-item',
    '--table-name',
    table,
    '--key',
    JSON.stringify(claimKey),
    '--update-expression',
    'REMOVE expiresAt',
  );

  return { email, password, accountId: signUp.body.accountId };
}

const signIn = (account) =>
  call('POST', '/auth/sign-in', {
    body: { email: account.email, password: account.password },
  });

const refresh = (refreshToken) =>
  call('POST', '/auth/refresh', { body: { refreshToken } });

const me = (token) => call('GET', '/me', { token });

async function cleanUp() {
  for (const { email, accountId } of created) {
    try {
      aws(
        'cognito-idp',
        'admin-delete-user',
        '--user-pool-id',
        poolId,
        '--username',
        email,
      );
    } catch {
      // Already gone.
    }

    const { Items = [] } = aws(
      'dynamodb',
      'query',
      '--table-name',
      table,
      '--key-condition-expression',
      'PK = :pk',
      '--expression-attribute-values',
      JSON.stringify({ ':pk': { S: `ACCOUNT#${accountId}` } }),
      '--projection-expression',
      'PK, SK',
    );
    const { Items: courses = [] } = aws(
      'dynamodb',
      'query',
      '--table-name',
      table,
      '--index-name',
      'GSI1',
      '--key-condition-expression',
      'GSI1PK = :pk',
      '--expression-attribute-values',
      JSON.stringify({ ':pk': { S: `INSTRUCTOR#${accountId}` } }),
      '--projection-expression',
      'PK, SK',
    );
    const keys = [
      ...Items,
      ...courses,
      { PK: { S: `EMAIL_CLAIM#${email}` }, SK: { S: `EMAIL_CLAIM#${email}` } },
    ];

    for (const key of keys) {
      aws(
        'dynamodb',
        'delete-item',
        '--table-name',
        table,
        '--key',
        JSON.stringify(key),
      );
    }
  }
}

try {
  const student = await createAccount('student');
  const admin = await createAccount('admin');
  const otherInstructor = await createAccount('instructor');
  const plainStudent = await createAccount('learner');
  aws(
    'lambda',
    'invoke',
    '--function-name',
    `${service}-promoteAdmin`,
    '--cli-binary-format',
    'raw-in-base64-out',
    '--payload',
    JSON.stringify({ email: admin.email }),
    '/dev/null',
  );

  console.log('\n# Single session (Q210)');
  const first = (await signIn(student)).body;
  check('student signs in', await me(first.accessToken), 200);
  const second = (await signIn(student)).body;
  check(
    'a second sign-in ends the first access token',
    await me(first.accessToken),
    401,
    'INVALID_SESSION',
  );
  check(
    'a second sign-in ends the first refresh token',
    await refresh(first.refreshToken),
    401,
    'INVALID_SESSION',
  );
  check('the second access token works', await me(second.accessToken), 200);
  const third = (await refresh(second.refreshToken)).body;
  check(
    'a refresh ends the access token before it',
    await me(second.accessToken),
    401,
    'INVALID_SESSION',
  );
  check('the refreshed access token works', await me(third.accessToken), 200);

  console.log('\n# Admin and permissions');
  const adminTokens = (await signIn(admin)).body;
  check(
    'admin lists students',
    await call('GET', '/admin/users?role=student', {
      token: adminTokens.accessToken,
    }),
    200,
  );
  check(
    'a student is refused on an admin route',
    await call('GET', '/admin/users?role=student', {
      token: third.accessToken,
    }),
    403,
    'FORBIDDEN',
  );
  check(
    'admin cannot disable itself',
    await call('POST', `/admin/users/${admin.accountId}/disable`, {
      token: adminTokens.accessToken,
    }),
    403,
    'CANNOT_CHANGE_OWN_STATUS',
  );
  check(
    'admin makes the student an instructor',
    await call('PUT', `/admin/users/${student.accountId}/role`, {
      token: adminTokens.accessToken,
      body: { role: 'instructor' },
    }),
    200,
  );
  const history = await call(
    'GET',
    `/admin/users/${student.accountId}/role-changes`,
    { token: adminTokens.accessToken },
  );
  check(
    'the role change is in the history',
    {
      status: history.body?.items?.length === 1 ? 200 : 500,
      body: history.body,
    },
    200,
  );

  console.log('\n# Courses (1.13)');
  const instructorToken = third.accessToken;
  await call('PUT', `/admin/users/${otherInstructor.accountId}/role`, {
    token: adminTokens.accessToken,
    body: { role: 'instructor' },
  });
  const otherToken = (await signIn(otherInstructor)).body.accessToken;
  const learnerToken = (await signIn(plainStudent)).body.accessToken;
  const created_ = await call('POST', '/courses', {
    token: instructorToken,
    body: { title: 'E2E course', description: 'Created by e2e:dev' },
  });
  check('an instructor creates a course', created_, 201);
  const courseId = created_.body?.id;
  check(
    'the instructor edits the course',
    await call('PATCH', `/courses/${courseId}`, {
      token: instructorToken,
      body: { title: 'E2E course, edited' },
    }),
    200,
  );
  const mine = await call('GET', '/instructor/courses', {
    token: instructorToken,
  });
  check(
    'the course is in the instructor list',
    {
      status: mine.body?.items?.some((item) => item.id === courseId)
        ? 200
        : 500,
      body: mine.body,
    },
    200,
  );
  check(
    'another instructor does not see the draft',
    await call('PATCH', `/courses/${courseId}`, {
      token: otherToken,
      body: { title: 'Not mine' },
    }),
    404,
    'COURSE_NOT_FOUND',
  );
  check(
    'an admin edits any course',
    await call('PATCH', `/courses/${courseId}`, {
      token: adminTokens.accessToken,
      body: { description: 'Edited by an admin' },
    }),
    200,
  );
  check(
    'a student cannot create a course',
    await call('POST', '/courses', {
      token: learnerToken,
      body: { title: 'Not allowed' },
    }),
    403,
    'FORBIDDEN',
  );
  check(
    'a malformed course id is a validation error',
    await call('PATCH', '/courses/nope', {
      token: instructorToken,
      body: { title: 'X Y Z' },
    }),
    400,
    'VALIDATION',
  );
  await call('PATCH', '/me', {
    token: instructorToken,
    body: { name: 'E2E renamed' },
  });
  const afterRename = await call('PATCH', `/courses/${courseId}`, {
    token: instructorToken,
    body: { description: 'After rename' },
  });
  check(
    'renaming the instructor renames the course copy',
    {
      status: afterRename.body?.instructorName === 'E2E renamed' ? 200 : 500,
      body: afterRename.body,
    },
    200,
  );

  console.log('\n# Disable and enable (Q193, Q212)');
  check(
    'admin disables the student',
    await call('POST', `/admin/users/${student.accountId}/disable`, {
      token: adminTokens.accessToken,
    }),
    200,
  );
  check(
    'the disabled student is refused at once',
    await me(third.accessToken),
    403,
    'ACCOUNT_UNAVAILABLE',
  );
  check(
    'the disabled student cannot sign in',
    await signIn(student),
    403,
    'ACCOUNT_UNAVAILABLE',
  );
  check(
    'the disabled student cannot refresh',
    await refresh(third.refreshToken),
    403,
    'ACCOUNT_UNAVAILABLE',
  );
  check(
    'admin enables the student',
    await call('POST', `/admin/users/${student.accountId}/enable`, {
      token: adminTokens.accessToken,
    }),
    200,
  );
  check(
    'the session from before the disable stays ended',
    await me(third.accessToken),
    401,
    'INVALID_SESSION',
  );
  check('the enabled student signs in again', await signIn(student), 200);

  console.log(
    '\nNot covered here: the password reset needs the code sent by e-mail.',
  );
} finally {
  await cleanUp();
}

console.log(
  failures ? `\n${failures} check(s) failed.` : '\nAll checks passed.',
);
process.exit(failures ? 1 : 0);
