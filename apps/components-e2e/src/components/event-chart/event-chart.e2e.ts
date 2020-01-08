/**
 * @license
 * Copyright 2020 Dynatrace LLC
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

import {
  eventChartEvents,
  eventChartOverlay,
  laneLabels,
  eventChartEventSelected,
  analyzeButton,
  makeZoneUnstable,
} from './event-chart.po';

fixture.only('EventChart').page('http://localhost:4200/event-chart');

test('should show overlay when hovered', async (testController: TestController) => {
  // Resize the window to check if merged events keep selection.
  await testController.resizeWindow(400, 900);
  // Hover over the first event.
  await testController.hover(eventChartEvents);
  // Wait for the overlay to appear
  await testController.expect(await eventChartOverlay.exists).ok();
});

test('should select the event when clicked', async (testController: TestController) => {
  // Click the first event
  await testController.click(eventChartEvents);
  // The selected event should have a selected class
  await testController.expect(await eventChartEventSelected.exists).ok();
});

test('should pin the overlay when selecting', async (testController: TestController) => {
  // Click the first event
  await testController.click(eventChartEvents);
  // Overlay should be pinned,
  // when hovering over something other than an event
  await testController.hover(laneLabels);
  // The overlay should stay open.
  await testController.expect(await eventChartOverlay.exists).ok();
});

test('should allow to programmatically close the overlay with actions from within the overlay', async (testController: TestController) => {
  // Click the first event to pin the overlay
  await testController.click(eventChartEvents);
  // Click the analyze button, which should close the overlay
  await testController.click(analyzeButton);

  // The overlay should close.
  await testController.expect(await eventChartOverlay.exists).notOk();

  // The selected event should still be selected
  await testController.expect(await eventChartEventSelected.exists).ok();
});

test('should reflow the svg and merge events that would overlap', async (testController: TestController) => {
  // Click the forth event to mark one,
  // that will be merged by resizing.
  await testController.click(eventChartEvents.nth(4));

  // close the overlay programmatically, but keep the selection
  await testController.click(analyzeButton);

  // Resize the window to check if merged events keep selection.
  await testController.resizeWindow(400, 900);

  // Click the make Zone unstable button to trigger a zone run.
  await testController.click(makeZoneUnstable);

  // The selected event should still exist, even if it is merged.
  await testController.expect(await eventChartEventSelected.exists).ok();
});
