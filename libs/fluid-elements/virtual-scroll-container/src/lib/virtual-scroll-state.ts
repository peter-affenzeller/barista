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

export interface FluidVirtualScrollOptions {
  itemsBatchSize?: number;
  itemsBufferSize?: number;
}

export interface FluidVirtualScrollRenderedItemRange {
  first: number;
  last: number;
}

// Number of items to render each time until the container is filled up
const VIRTUAL_SCROLL_BATCH_SIZE = 5;
// Number of items to render in addition to the initially rendered items
const VIRTUAL_SCROLL_BUFFER_SIZE = 3;

export class VirtualScrollState {
  /** Average item height */
  avgItemHeight: number;

  /** Defines whether the last of the available items has been rendered */
  lastItemRendered = false;

  /**
   * Index of the first and last rendered item.
   *
   * Important note: Never attempt to enforce to alter the object returned by
   * this getter nor rely on its state after {@link #updateStartScrollBuffer()}
   * or {@link #updateEndScrollBuffer()} have been called again!
   * In case you need to store that information past this point, always create
   * a copy right away instead.
   * @ ChMa: pls explain again why it should be copied? I forgot what the potential issue was...
   */
  get renderedItemsRange(): Readonly<FluidVirtualScrollRenderedItemRange> {
    return this._renderedItemsRange;
  }
  private _renderedItemsRange: FluidVirtualScrollRenderedItemRange = Object.seal(
    {
      first: 0,
      last: 0,
    },
  );

  /** Empty placeholder before the rendered items to correctly render the scrollbar */
  get startPlaceholderSize(): number {
    return this._startPlaceholderSize;
  }
  private _startPlaceholderSize = 0;

  /** Empty placeholder after the rendered items to correctly render the scrollbar */
  get endPlaceholderSize(): number {
    return this._endPlaceholderSize;
  }
  private _endPlaceholderSize = 0;

  /** Index of the item to observe for adjusting the start buffer */
  get bufferStartObservedItemIndex(): number {
    return this._bufferStartObservedItemIndex;
  }
  private _bufferStartObservedItemIndex = -1;

  /** Index of the item to observe for adjusting the end buffer */
  get bufferEndObservedItemIndex(): number {
    return this._bufferEndObservedItemIndex;
  }
  private _bufferEndObservedItemIndex = -1;

  /** Total number of items in the virtual scroll panel */
  set itemsCount(value: number) {
    if (value < 0) {
      console.warn('Invalid item count: Item count should not be negative.');
      return;
    }
    this._itemsCount = value;
    // Reset virtual scroll indices
    this._lastRenderedItemIndex = -1;
  }
  private _itemsCount = 0;

  /** Number of items to render when initialising */
  private _itemsBatchSize: number;

  /** Number of initial batches rendered to fill up the whole container */
  private _initialBatches = 0;

  /** Number of items rendered above and below the fold */
  private _itemsBufferSize: number;

  /** Index of the first rendered item */
  private _firstRenderedItemIndex = -1;

  /** Index of the last rendered item */
  private _lastRenderedItemIndex = -1;

  /** Number of currently rendered start buffer items */
  private _startItemsBufferSize = 0;

  /** Number of currently rendered end buffer items */
  private _endItemsBufferSize = 0;

  constructor({
    itemsBatchSize,
    itemsBufferSize,
  }: FluidVirtualScrollOptions = {}) {
    this._itemsBatchSize = itemsBatchSize
      ? itemsBatchSize
      : VIRTUAL_SCROLL_BATCH_SIZE;
    this._itemsBufferSize = itemsBufferSize
      ? itemsBufferSize
      : VIRTUAL_SCROLL_BUFFER_SIZE;
  }

  /** Initializes the array of items to render for the virtual scroll */
  addInitialItemsBatch(): void {
    this._appendItems(this._itemsBatchSize);
    this._initialBatches += 1;
  }

  /** Adds new items to the start of the list, remove items from the end */
  updateStartScrollBuffer(): void {
    const prevRenderedItemsCount = this._renderedItemsCount();

    // Add items to the start
    this._prependItems(this._itemsBufferSize);

    // Calculate start buffer size
    this._startItemsBufferSize =
      this._renderedItemsCount() - prevRenderedItemsCount;

    // Remove items from the end depending on the amount of newly rendered items
    this._renderedItemsRange.last -= this._startItemsBufferSize;
    this._lastRenderedItemIndex = this._renderedItemsRange.last;

    // Calculate number of items of the end buffer
    this._endItemsBufferSize =
      this._renderedItemsCount() -
      this._initialBatches * this._itemsBatchSize -
      this._startItemsBufferSize;

    this._calculateObservedItemsIndices();
  }

  /** Adds new items to the end of the list, remove items from the start */
  updateEndScrollBuffer(): void {
    const prevRenderedItemsCount = this._renderedItemsCount();

    // Add items to the end
    this._appendItems(this._itemsBufferSize);

    // Calculate end buffer size
    this._endItemsBufferSize =
      this._renderedItemsCount() - prevRenderedItemsCount;

    // Remove items from the start depending on the amount of newly rendered items
    if (this._startItemsBufferSize > 0) {
      this._renderedItemsRange.first += this._endItemsBufferSize;
      this._firstRenderedItemIndex = this._renderedItemsRange.first;
    }

    // Calculate number of items of the start buffer
    this._startItemsBufferSize =
      this._renderedItemsCount() -
      this._initialBatches * this._itemsBatchSize -
      this._endItemsBufferSize;

    this._calculateObservedItemsIndices();
  }

  /** Calculates the size of the start and end placeholder based on the average item height */
  calculatePlaceholderSize(): void {
    this._startPlaceholderSize =
      this._renderedItemsRange.first * this.avgItemHeight;
    this._endPlaceholderSize =
      (this._itemsCount - this._renderedItemsRange.last - 1) *
      this.avgItemHeight;
  }

  /** Resets the virtual scroll state */
  reset(): void {
    this.avgItemHeight = 0;
    this.lastItemRendered = false;
    this._renderedItemsRange.first = 0;
    this._renderedItemsRange.last = 0;
    this._startPlaceholderSize = 0;
    this._endPlaceholderSize = 0;
    this._bufferStartObservedItemIndex = -1;
    this._bufferEndObservedItemIndex = -1;
    this._itemsCount = 0;
    this._initialBatches = 0;
    this._firstRenderedItemIndex = -1;
    this._lastRenderedItemIndex = -1;
    this._startItemsBufferSize = 0;
    this._endItemsBufferSize = 0;
  }

  /** Adds items to the end of the rendered items array */
  private _appendItems(itemCount: number): void {
    this._calculateRenderedItemsRange(itemCount, this._lastRenderedItemIndex);
  }

  /** Adds items to the beginning of the rendered items array */
  private _prependItems(itemCount: number): void {
    const startAt = this._firstRenderedItemIndex - this._itemsBufferSize - 1;

    this._calculateRenderedItemsRange(itemCount, startAt);
  }

  /** Calculates the range of items to render */
  private _calculateRenderedItemsRange(
    itemCount: number,
    startAt: number,
  ): void {
    let index = -1;
    let first = -1;

    for (let i = 0; i < itemCount; i++) {
      // Next item's index
      index = startAt + i + 1;

      // When rendering new items at the start of the list when the user is
      // scrolling back up, the index might be negative, depending on the virtual
      // scroll buffer size and current scroll position
      // In this case, continue looping to render all the items of the scroll buffer
      // that are not rendered yet
      if (index < 0) {
        continue;
      }

      // Stop rendering if there are no more items
      if (index >= this._itemsCount) {
        break;
      }

      // Push the new item to the list of rendered items
      if (first === -1) {
        first = index;
      }

      // Store index of first rendered item
      if (index < this._firstRenderedItemIndex || index === 0) {
        this._firstRenderedItemIndex = index;
      }

      // Store index of last rendered item
      if (index > this._lastRenderedItemIndex) {
        this._lastRenderedItemIndex = index;
      }
    }

    if (startAt < this._renderedItemsRange.first) {
      this._renderedItemsRange.first = Math.max(0, startAt);
    }
    this._renderedItemsRange.last = this._lastRenderedItemIndex;
  }

  /** Calculates the indices of the first and last item to be observed */
  private _calculateObservedItemsIndices(): void {
    if (this._itemsCount <= this._renderedItemsCount()) {
      // No need to observe anything since there are not enough items to scroll virtually
      this._bufferStartObservedItemIndex = -1;
      this._bufferEndObservedItemIndex = -1;
    } else if (this._lastRenderedItemIndex === this._itemsCount - 1) {
      // Last item of the list is rendered, no need to observe the end of the list
      // Observe the start of the list to adjust the buffer when scrolling towards the start
      this._bufferEndObservedItemIndex = -1;
      this._bufferStartObservedItemIndex =
        this._lastRenderedItemIndex -
        this._initialBatches * this._itemsBatchSize -
        Math.floor(this._itemsBufferSize * 0.5);
    } else if (this._startItemsBufferSize < this._itemsBufferSize) {
      // No more items to add at the beginning of the list, no need to observe
      // Observe the end of the list to adjust the buffer when scrolling towards the end
      this._bufferStartObservedItemIndex = -1;
      this._bufferEndObservedItemIndex =
        this._lastRenderedItemIndex - Math.floor(this._itemsBufferSize * 0.5);
    } else {
      // Observe start and end of the rendered items
      this._bufferEndObservedItemIndex =
        this._lastRenderedItemIndex - Math.floor(this._itemsBufferSize * 0.5);
      this._bufferStartObservedItemIndex =
        this._bufferEndObservedItemIndex -
        this._initialBatches * this._itemsBatchSize -
        this._itemsBufferSize;
    }
  }

  /** Calculates the number of currently rendered items */
  private _renderedItemsCount(): number {
    return this._renderedItemsRange.last - this._renderedItemsRange.first + 1;
  }
}
