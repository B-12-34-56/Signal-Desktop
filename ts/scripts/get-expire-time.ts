// Copyright 2021 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import { join } from 'path';
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

import { DAY } from '../util/durations';
import { version } from '../../package.json';
import { isNotUpdatable } from '../util/version';

// Try SOURCE_DATE_EPOCH first, then fall back to `git`, then to now().
let unixTimestamp: number;
if (process.env.SOURCE_DATE_EPOCH) {
  unixTimestamp = parseInt(process.env.SOURCE_DATE_EPOCH, 10);
} else {
  try {
    const out = execSync('git show -s --format=%ct').toString('utf8').trim();
    unixTimestamp = parseInt(out, 10);
  } catch (err) {
    console.warn(
      'Not a git repository; falling back to current time for expire-time.'
    );
    unixTimestamp = Math.floor(Date.now() / 1000);
  }
}

const buildCreation = unixTimestamp * 1000;

// NB: Build expirations are also determined via auto‑update settings.
const validDuration = isNotUpdatable(version) ? DAY * 30 : DAY * 90;
const buildExpiration = buildCreation + validDuration;

const localProductionPath = join(
  __dirname,
  '../../config/local-production.json'
);

const localProductionConfig = {
  buildCreation,
  buildExpiration,
  ...(isNotUpdatable(version) ? { updatesEnabled: false } : {}),
};

writeFileSync(localProductionPath, `${JSON.stringify(localProductionConfig)}\n`);
