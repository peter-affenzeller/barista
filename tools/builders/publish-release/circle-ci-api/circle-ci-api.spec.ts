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

import { CircleCiApi } from './circle-ci-api';
// import { AxiosInstance } from 'axios';

let client: CircleCiApi;

// let testFlush: any;

// beforeEach(() => {
//   client = new CircleCiApi('some-token');
//   client['_apiClient'] = jest.fn(() => ({
//     get: testFlush
//   })) as unknown as AxiosInstance;
// });

test('', async () => {
  await client.getArtefactUrlForBranch(
    'b89786da642171a16a11322236e7f9530b2f2afe',
  );
});
