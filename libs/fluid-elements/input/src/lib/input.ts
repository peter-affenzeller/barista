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
  css,
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
  unsafeCSS,
} from 'lit-element';
import {
  FLUID_INPUT_BOX_SHADOW,
  FLUID_INPUT_PADDING,
  FLUID_INPUT_PADDING_INLINE,
  fluidDtText,
} from '@dynatrace/fluid-design-tokens';

import { classMap } from 'lit-html/directives/class-map';

/** Defines the possible positions of the fluid-input label. */
export type FluidInputLabelPosition = `top` | `left` | null;

/**
 * This is an experimental input element built with lit-elements and
 * web-components. It registers itself as `fluid-input` custom element.
 * @element fluid-input
 * @cssprop --fluid-input--foreground-key - Controls the foreground color for the default state.
 * @cssprop --fluid-input--background-key - Controls the background color for the default state.
 * @cssprop --fluid-input--border-key - Controls the border color for the default state.
 * @cssprop --fluid-input--foreground-key-hover - Controls the foreground hover color for the default state.
 * @cssprop --fluid-input--background-key-hover - Controls the background hover color for the default state.
 * @cssprop --fluid-input--border-key-hover - Controls the border hover color for the default state.
 * @cssprop --fluid-input--foreground-key-focus - Controls the foreground focus color for the default state.
 * @cssprop --fluid-input--background-key-focus - Controls the background focus color for the default state.
 * @cssprop --fluid-input--border-key-focus - Controls the border focus color for the default state.
 * @cssprop --fluid-input--foreground-negative - Controls the foreground color for the negative state.
 * @cssprop --fluid-input--border-negative - Controls the border color for the negative state.
 * @cssprop --fluid-input--foreground-negative-hover - Controls the foreground hover color for the negative state.
 * @cssprop --fluid-input--border-negative-hover - Controls the border hover color for the negative state.
 * @cssprop --fluid-input--foreground-negative-focus - Controls the foreground focus color for the negative state.
 * @cssprop --fluid-input--border-negative-focus - Controls the border focus color for the negative state.
 * @cssprop --fluid-input--foreground-disabled - Controls the foreground color for the disabled state.
 * @cssprop --fluid-input--background-disabled - Controls the background color for the disabled state.
 * @cssprop --fluid-input--border-disabled - Controls the border color for the disabled state.
 * @cssprop --fluid-input--placeholder - Controls the placeholder color.
 * @cssprop --fluid-input--hint - Controls the hint color.
 */
@customElement('fluid-input')
export class FluidInput extends LitElement {
  /** Styles for the input component */
  static get styles(): CSSResult {
    return css`
      :host {
        display: inline-block;

        --fluid-input--padding: ${unsafeCSS(FLUID_INPUT_PADDING)};

        --fluid-input--foreground-key: var(--color-neutral-140);
        --fluid-input--background-key: var(--color-neutral-140);
        --fluid-input--border-key: var(--color-neutral-100);
        --fluid-input--foreground-key-hover: var(--color-primary-100);
        --fluid-input--background-key-hover: var(--color-neutral-50);
        --fluid-input--border-key-hover: var(--color-primary-100);
        --fluid-input--foreground-key-focus: var(--color-primary-100);
        --fluid-input--background-key-focus: var(--color-neutral-50);
        --fluid-input--border-key-focus: var(--color-primary-100);

        --fluid-input--foreground-negative: var(--color-error-80);
        --fluid-input--border-negative: var(--color-error-80);
        --fluid-input--foreground-negative-hover: var(--color-error-80);
        --fluid-input--border-negative-hover: var(--color-error-80);
        --fluid-input--foreground-negative-focus: var(--color-error-80);
        --fluid-input--border-negative-focus: var(--color-error-80);

        --fluid-input--foreground-disabled: var(--color-neutral-100);
        --fluid-input--background-disabled: var(--color-neutral-60);
        --fluid-input--border-disabled: var(--color-neutral-100);

        --fluid-input--placeholder: var(--color-neutral-100);
        --fluid-input--hint: var(--color-neutral-100);
      }

      /* COLORS */
      .fluid-color--main {
        --fluid-input--foreground: var(--fluid-input--foreground-key);
        --fluid-input--background: var(--fluid-input--background-key);
        --fluid-input--border: var(--fluid-input--border-key);

        --fluid-input--foreground-hover: var(
          --fluid-input--foreground-key-hover
        );
        --fluid-input--background-hover: var(
          --fluid-input--background-key-hover
        );
        --fluid-input--border-hover: var(--fluid-input--border-key-hover);

        --fluid-input--foreground-focus: var(
          --fluid-input--foreground-key-focus
        );
        --fluid-input--background-focus: var(
          --fluid-input--background-key-focus
        );
        --fluid-input--border-focus: var(--fluid-input--border-key-focus);
      }

      .fluid-color--error {
        --fluid-input--foreground: var(--fluid-input--foreground-negative);
        --fluid-input--border: var(--fluid-input--border-negative);

        --fluid-input--foreground-hover: var(
          --fluid-input--foreground-negative
        );
        --fluid-input--border-hover: var(--fluid-input--border-negative);
      }

      /* DISABLED */
      .fluid-color--disabled {
        --fluid-input--foreground: var(--fluid-input--foreground-disabled);
        --fluid-input--background: var(--fluid-input--background-disabled);
        --fluid-input--border: var(--fluid-input--border-disabled);
      }

      .fluid-input-container:hover {
        --fluid-input--foreground: var(--fluid-input--foreground-hover);
        --fluid-input--background: var(--fluid-input--background-hover);
        --fluid-input--border: var(--fluid-input--border-hover);
      }

      .fluid-input-container--focus {
        --fluid-input--foreground: var(--fluid-input--foreground-focus);
        --fluid-input--background: var(--fluid-input--background-focus);
        --fluid-input--border: var(--fluid-input--border-focus);
      }

      .fluid-input {
        ${unsafeCSS(fluidDtText())};
        display: inline-grid;
        color: var(--fluid-input--foreground);
      }

      .fluid-input-hint-container {
        display: inline-grid;
      }

      .fluid-input-container {
        position: relative;
        left: -${unsafeCSS(FLUID_INPUT_PADDING_INLINE)};
        display: inline-grid;
        grid-template-columns: auto auto;
        align-items: center;
        padding: 0 ${unsafeCSS(FLUID_INPUT_PADDING_INLINE)};
        transition: background-color 100ms ease-in-out;
      }

      .fluid-input-container--focus {
        background-color: var(--fluid-input--background-focus);
        box-shadow: ${unsafeCSS(FLUID_INPUT_BOX_SHADOW)} rgba(21, 23, 27, 0.2);
      }

      .fluid-input-container::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: ${unsafeCSS(FLUID_INPUT_PADDING_INLINE)};
        width: calc(100% - 2 * ${unsafeCSS(FLUID_INPUT_PADDING_INLINE)});
        border-bottom-width: 1px;
        border-bottom-style: solid;
        border-bottom-color: var(--fluid-input--border);
        will-change: left width;
        transition: left 100ms ease-in-out, width 100ms ease-in-out;
      }

      .fluid-input-container--focus::after {
        left: 0;
        width: 100%;
      }

      .fluid-input--label-left {
        display: inline-block;
      }

      .fluid-icon-container {
        height: 1rem;
      }

      .fluid-input-hint {
        color: var(--fluid-input--hint);
        font-size: 0.8rem;
      }

      /* SLOTTED ELEMENTS STYLES */
      ::slotted(label) {
        padding: 0;
        font-size: 0.8rem;
      }

      .fluid-input--label-left ::slotted(label) {
        padding-right: ${unsafeCSS(FLUID_INPUT_PADDING)};
        font-size: 1rem;
      }

      ::slotted(input) {
        ${unsafeCSS(fluidDtText())};
        padding: ${unsafeCSS(FLUID_INPUT_PADDING)};
        padding-left: 0;
        width: 100%;
        appearance: none;
        background: none;
        border: none;
        color: var(--fluid-input--foreground-key);
        text-overflow: ellipsis;
      }

      ::slotted(input:focus) {
        outline: none;
      }

      ::slotted(input)::placeholder {
        color: var(--fluid-input--placeholder);
        transition: opacity 100ms ease-in-out;
      }

      ::slotted(input:focus)::placeholder {
        opacity: 0;
      }

      ::slotted(fluid-icon) {
        height: 100%;
        fill: var(--fluid-input--foreground);
      }
    `;
  }

  /**
   * Defines the aria label of the input input field.
   * @attr
   * @type string
   */
  @property({ type: String, reflect: true })
  labelposition: FluidInputLabelPosition = `top`;

  /**
   * Defines the hint of the input input field.
   * @attr
   * @type string
   */
  @property({ type: String, reflect: true })
  hint: string = ``;

  /**
   * @internal Defines if the input should be blurred
   * Used in the fluid-combo-box to keep the input
   * focused when clicking in the popover
   */
  _preventBlur = false;

  /**
   * Defines whether the input is disabled.
   * Used for styling the input container
   */
  @property({ type: Boolean, attribute: false })
  private _disabled = false;

  /**
   * Defines whether the input is focused.
   * Used for styling the container
   */
  @property({ type: Boolean, attribute: false })
  private _focus = false;

  /**
   * Validate slotted element(s) and add event listeners
   * for focusing and blurring an input
   */
  private _handleSlotChange({ target }: { target: HTMLSlotElement }): void {
    const slottedElements = target.assignedElements({
      flatten: true,
    });

    // Only accept one element per slot
    if (slottedElements.length > 1) {
      throw new Error(
        `The fluid-input only takes one input element in the default slot.`,
      );
    }

    const element = slottedElements[0];

    // Only accept input or label element as slotted elements
    if (element.tagName !== `INPUT` && element.tagName !== `LABEL`) {
      throw new Error(
        `The fluid-input only takes an input element or a label as slotted elements.`,
      );
    }

    // Add focus and blur listeners to the input element
    if (element.tagName === `INPUT`) {
      this._disabled = (element as HTMLInputElement).disabled;
      element.addEventListener(`focus`, this._handleFocus.bind(this));
      element.addEventListener(`blur`, this._handleBlur.bind(this));
    }
  }

  /** Set the fluid input focus to apply styles */
  private _handleFocus(): void {
    this._focus = true;
  }

  /** Set the fluid input focus to apply styles */
  private _handleBlur(): void {
    if (!this._preventBlur) {
      this._focus = false;
    }
  }

  /**
   * Render function of the custom element. It is called when one of the
   * observedProperties (annotated with @property) changes.
   */
  render(): TemplateResult {
    const classMapData = {
      'fluid-input': true,
      'fluid-color--main': true,
      /* TODO: validation */
      'fluid-color--error': false,
      'fluid-color--disabled': this._disabled,
      'fluid-input--label-left': this.labelposition === `left`,
    };

    const classMapDataInputContainer = {
      'fluid-input-container': true,
      'fluid-input-container--focus': this._focus,
    };

    return html`
      <div class=${classMap(classMapData)}>
        <slot name="label" @slotchange=${this._handleSlotChange}></slot>
        <div class="fluid-input-hint-container">
          <div class=${classMap(classMapDataInputContainer)}>
            <slot @slotchange=${this._handleSlotChange}></slot>
            <div class="fluid-icon-container">
              <slot name="icon"></slot>
            </div>
          </div>
          ${this.hint
            ? html`<span class="fluid-input-hint">${this.hint}</span>`
            : html`<span class="fluid-input-hint">&nbsp;</span>`}
        </div>
      </div>
    `;
  }
}
