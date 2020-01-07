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

// tslint:disable no-lifecycle-call no-use-before-declare no-magic-numbers
// tslint:disable no-any max-file-line-count no-unbound-method use-component-selector

import { ESCAPE } from '@angular/cdk/keycodes';
import { OverlayContainer } from '@angular/cdk/overlay';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, DebugElement, OnInit } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flush,
  inject,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { DtIconModule } from '@dynatrace/barista-components/icon';
import { DtTagAdd, DtTagModule } from '@dynatrace/barista-components/tag';
import {
  createComponent,
  dispatchKeyboardEvent,
} from '@dynatrace/barista-components/testing';

describe('DtTagAdd', () => {
  let fixture: ComponentFixture<DtTagComponent>;
  let instanceDebugElement: DebugElement;
  let addTagNativeElement: HTMLElement;
  let addTagInstance: DtTagAdd;

  let overlayContainer: OverlayContainer;
  let overlayContainerElement: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        DtIconModule.forRoot({ svgIconLocation: `{{name}}.svg` }),
        DtTagModule,
      ],
      declarations: [DtTagComponent],
    });

    TestBed.compileComponents();

    fixture = createComponent(DtTagComponent);
    instanceDebugElement = fixture.debugElement.query(By.directive(DtTagAdd));
    addTagInstance = instanceDebugElement.injector.get<DtTagAdd>(DtTagAdd);
    addTagNativeElement = instanceDebugElement.nativeElement;

    inject([OverlayContainer], (oc: OverlayContainer) => {
      overlayContainer = oc;
      overlayContainerElement = oc.getContainerElement();
    })();
  });

  afterEach(() => {
    overlayContainer.ngOnDestroy();
  });

  it('should add the `dt-tag-add` class', () => {
    expect(addTagNativeElement.classList).toContain('dt-tag-add');
  });

  it('should emit when add() is called', () => {
    const addSpy = jest.fn();
    const instance: DtTagAdd = instanceDebugElement.componentInstance;
    const addTagSubscription = instance.tagAdded.subscribe(addSpy);

    instance._addTag('test');
    fixture.detectChanges();
    expect(addSpy).toHaveBeenCalled();

    addTagSubscription.unsubscribe();
  });

  it('should open panel when showOverlay is true', () => {
    addTagInstance.open();
    fixture.detectChanges();

    const panel = overlayContainerElement.querySelector(
      '.dt-tag-add-overlay',
    ) as HTMLDivElement;

    expect(addTagInstance._showOverlay).toBeTruthy();
    expect(panel).not.toBeNull();
  });

  it('should add tag to tags when add() is called', () => {
    const instance: DtTagAdd = instanceDebugElement.componentInstance;
    expect(fixture.componentInstance.tags.size).toBe(3);
    instance._addTag('Health');
    fixture.detectChanges();
    expect(fixture.componentInstance.tags.size).toBe(4);
  });

  it('should add tag when `add` button in dt-tag-add is clicked', fakeAsync(() => {
    const spy = jest.fn();
    const sub = addTagInstance.tagAdded.subscribe(spy);

    addTagInstance.open();
    fixture.detectChanges();
    flush();

    const panelAddButton = overlayContainerElement.querySelector(
      '.dt-tag-add-submit-button',
    ) as HTMLButtonElement;
    const panelInput = overlayContainerElement.querySelector(
      '.dt-tag-add-input',
    ) as HTMLInputElement;
    panelInput.value = 'test';
    fixture.detectChanges();
    panelAddButton.click();
    fixture.detectChanges();
    flush();

    const tag = ((fixture.debugElement.nativeElement.querySelectorAll(
      'dt-tag',
    ) as HTMLCollection).item(3) as HTMLElement).innerHTML;
    expect(tag).toContain('test');
    expect(spy).toHaveBeenCalled();
    expect(fixture.componentInstance.tags.size).toBe(4);

    sub.unsubscribe();
  }));

  it('should open Overlay when `add-tag` button is pressed', () => {
    const addTagBtn = fixture.debugElement.nativeElement.querySelector(
      'button',
    );
    let panel = overlayContainerElement.querySelector('.dt-tag-add-overlay');

    expect(panel).toBeNull();

    addTagBtn.click();
    fixture.detectChanges();
    panel = overlayContainerElement.querySelector('.dt-tag-add-overlay');

    expect(panel).not.toBeNull();
  });

  it('should close Overlay when backdrop is clicked', fakeAsync(() => {
    addTagInstance.open();
    fixture.detectChanges();
    flush();
    expect(addTagInstance._showOverlay).toBe(true);

    const backdrop = overlayContainerElement.querySelector(
      '.cdk-overlay-backdrop',
    ) as HTMLElement;
    backdrop.click();

    fixture.detectChanges();
    flush();

    expect(addTagInstance._showOverlay).toBe(false);
  }));

  // tslint:disable-next-line: dt-no-focused-tests
  it.only('should propagate attribute to overlay if `uitestid` is provided', fakeAsync(() => {
    addTagInstance.open();
    fixture.detectChanges();
    flush();
    console.log(
      overlayContainerElement
        .querySelector('#cdk-overlay-0')!
        .parentElement!.innerHTML.includes('uitestid'),
    );
    console.log(
      addTagInstance._overlayDir.overlayRef.overlayElement.parentElement!.innerHTML.includes(
        'uitestid="tag-overlay"',
      ),
    );
  }));

  describe('keyevent tests', () => {
    it('should close Overlay when ESCAPE is pressed', () => {
      addTagInstance.open();
      fixture.detectChanges();
      const panel = overlayContainerElement.querySelector(
        '.dt-tag-add-overlay',
      ) as HTMLDivElement;
      expect(panel).not.toBeNull();
      dispatchKeyboardEvent(panel, 'keydown', ESCAPE);
      fixture.detectChanges();

      expect(addTagInstance._showOverlay).toBeFalsy();
    });
  });
});

/** Test component that contains an DtTagAdd. */
@Component({
  selector: 'dt-test-app',
  template: `
    <dt-tag *ngFor="let tag of tags">{{ tag }}</dt-tag>
    <dt-tag-add (tagAdded)="addTag($event)" uitestid="tag"></dt-tag-add>
  `,
})
class DtTagComponent implements OnInit {
  tags = new Set<string>();

  ngOnInit(): void {
    this.tags
      .add('Window')
      .add('Managed')
      .add('Errors');
  }

  addTag(tag: string): void {
    this.tags.add(tag);
  }
}
