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
  CSSResult,
  LitElement,
  TemplateResult,
  css,
  customElement,
  html,
  property,
  query,
  unsafeCSS,
} from 'lit-element';
import { classMap } from 'lit-html/directives/class-map';
import {
  FLUID_INPUT_BOX_SHADOW,
  fluidDtText,
} from '@dynatrace/fluid-design-tokens';

import { Instance, createPopper, Rect } from '@popperjs/core/lib/popper-lite';
import flip from '@popperjs/core/lib/modifiers/flip';
import offset from '@popperjs/core/lib/modifiers/offset';
import preventOverflow from '@popperjs/core/lib/modifiers/preventOverflow';

preventOverflow.options = {
  mainAxis: true,
  altAxis: true,
};

import { FluidPopoverMouseInsideChange } from './popover-events';

export type FluidPopoverPlacement =
  | 'auto'
  | 'auto-start'
  | 'auto-end'
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'right'
  | 'right-start'
  | 'right-end'
  | 'left'
  | 'left-start'
  | 'left-end';

type FluidPopoverOffsetFunction = ({
  popper,
  reference,
  placement,
}: {
  popper: Rect;
  reference: Rect;
  placement: FluidPopoverPlacement;
}) => [number | null | undefined, number | null | undefined];

export type FluidPopoverOffset =
  | FluidPopoverOffsetFunction
  | [number | null | undefined, number | null | undefined]
  | undefined;

/**
 * This is an experimental popover element built with lit-elements and
 * web-components. It registers itself as `fluid-popover` custom element.
 * @element fluid-popover
 * @cssprop --fluid-popover--foreground-key - Controls the foreground color for the key setting.
 * @cssprop --fluid-popover--background-key - Controls the background color for the key setting.
 * @cssprop --fluid-popover--background-key - Controls the background color for the key setting.
 * @cssprop --fluid-popover--foreground-key-hover - Controls the foreground hover color for the key setting.
 * @cssprop --fluid-popover--background-key-hover - Controls the background hover color for the key setting.
 * @cssprop --fluid-popover--foreground-disabled - Controls the foreground color for the disabled state.
 * @cssprop --fluid-popover--background-disabled - Controls the background color for the disabled state.
 */
@customElement('fluid-popover')
export class FluidPopover extends LitElement {
  /** Styles for the popover component */
  static get styles(): CSSResult {
    return css`
      :host {
        display: block;

        --fluid-popover--background: var(--color-neutral-50);
      }

      .fluid-popover {
        ${unsafeCSS(fluidDtText())};
        display: none;
        overflow: scroll;
        max-height: 350px;
        background: var(--fluid-popover--background);
        box-shadow: ${unsafeCSS(FLUID_INPUT_BOX_SHADOW)} rgba(21, 23, 27, 0.2);
        transition: opacity 1500ms ease-in-out;
        z-index: 10;
      }

      .fluid-popover--open {
        display: block;
      }
    `;
  }

  /**
   * Defines whether the popover is open.
   * @attr
   * @type boolean
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  get open(): boolean {
    return this._open;
  }
  set open(value: boolean) {
    const oldOpen = this._open;
    this._open = value;
    this._togglePopover();
    this.requestUpdate(`open`, oldOpen);
  }
  private _open = false;

  /**
   * The element to connect the popover to
   * @type HTMLElement
   */
  @property({ attribute: false })
  anchor: HTMLElement;

  /** Defines the placement of the popper.js popover */
  @property({ type: String, reflect: true })
  placement: FluidPopoverPlacement = `bottom-start`;

  /** Defines the placement of the popper.js popover */
  @property({ type: Array, reflect: true })
  get fallbackplacement(): FluidPopoverPlacement[] {
    return this._fallbackplacement;
  }
  set fallbackplacement(value: FluidPopoverPlacement[]) {
    const oldFallbackPlacement = this._fallbackplacement;
    this._fallbackplacement = value;
    // Set fallback options for popper.js directive
    flip.options = { fallbackPlacements: this._fallbackplacement };
    this.requestUpdate(`fallbackplacement`, oldFallbackPlacement);
  }
  private _fallbackplacement: FluidPopoverPlacement[];

  /** Defines the offset of the popper.js popover */
  @property({ type: Array, reflect: true })
  get offset(): FluidPopoverOffset {
    return this._offset;
  }
  set offset(value: FluidPopoverOffset) {
    const oldFallbackPlacement = this._fallbackplacement;
    this._offset = value;
    // Set offset for popper.js directive
    offset.options = {
      offset: this._offset,
    };
    this.requestUpdate(`fallbackplacement`, oldFallbackPlacement);
  }
  private _offset: FluidPopoverOffset;

  /**
   * FLuid popover container element
   * @type HTMLDivElement
   */
  @query(`.fluid-popover`)
  private _popover: HTMLDivElement;

  /** Instance of the created popper.js popover */
  private _popperPopoverInstance: Instance | null;

  /** Defines if the mouse is inside the popover */
  private _mouseInside = false;

  /**
   * Creates or destroys the options overlay and sets `open` accordingly
   * Else, popperjs would calculate the updates for an existing overlay even if it is not visible
   */
  private _togglePopover(): void {
    requestAnimationFrame(() => {
      if (this.open) {
        this._createPopover();
      } else {
        this._destroyPopover();
      }
    });
  }

  /** Create a popperjs popover */
  private _createPopover(): void {
    this._popperPopoverInstance = createPopper(this.anchor, this._popover, {
      placement: this.placement,
      modifiers: [flip, preventOverflow, offset],
    });
  }

  /** Destroy the popperjs popover instance */
  private _destroyPopover(): void {
    if (this._popperPopoverInstance) {
      this._popperPopoverInstance.destroy();
      this._popperPopoverInstance = null;
    }
  }

  /** Dispatches event when the mouse enters/leaves the popover */
  private _toggleMouseInside(): void {
    this._mouseInside = !this._mouseInside;
    this.dispatchEvent(new FluidPopoverMouseInsideChange(this._mouseInside));
  }

  /**
   * Render function of the custom element. It is called when one of the
   * observedProperties (annotated with @property) changes.
   */
  render(): TemplateResult {
    const classMapData = {
      'fluid-popover': true,
      'fluid-popover--open': this.open,
    };

    return html`
      <div
        class=${classMap(classMapData)}
        @mouseenter=${this._toggleMouseInside}
        @mouseleave=${this._toggleMouseInside}
      >
        <slot></slot>
      </div>
    `;
  }
}
