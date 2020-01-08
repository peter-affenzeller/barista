/**
 * @license
 * Copyright 2019 Dynatrace LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { spawnSync } from 'child_process';

/** Runs NPM publish within a specified directory */
export function npmPublish(packagePath: string): string | null {
  const result = spawnSync(
    'npm',
    ['publish', '--access', 'public', '--tag', 'latest', '--dry-run'],
    {
      cwd: packagePath,
      shell: true,
      env: process.env,
    },
  );

  // We only want to return an error if the exit code is not zero. NPM by default prints the
  // logging messages to "stdout" and therefore just checking for "stdout" is not reliable.
  if (result.status !== 0) {
    return result.stderr.toString();
  }
  return null;
}
