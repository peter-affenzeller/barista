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
  Overlay,
  OverlayConfig,
  OverlayRef,
  ScrollDispatcher,
} from '@angular/cdk/overlay';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  ComponentRef,
  Component,
  ContentChild,
  OnDestroy,
  TemplateRef,
  ViewContainerRef,
  ViewEncapsulation,
  NgZone,
} from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import { isDefined } from '@dynatrace/barista-components/core';

import { DtChart } from '../chart';
import { DtChartTooltipData } from '../highcharts/highcharts-tooltip-types';
import { PlotBackgroundInfo } from '../utils';
import { DtChartTooltipContainer } from './chart-tooltip-container';
import { DEFAULT_DT_CHART_TOOLTIP_POSITIONS } from './chart-tooltip-config';

@Component({
  selector: 'dt-chart-tooltip',
  exportAs: 'dtChartTooltip',
  template: '<ng-content></ng-content>',
  host: {
    class: 'dt-chart-tooltip',
  },
  styleUrls: ['chart-tooltip.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false,
})
export class DtChartTooltip implements OnDestroy {
  /** @internal Reference to the overlay template */
  @ContentChild(TemplateRef, { static: false })
  _overlayTemplate: TemplateRef<void>;

  private readonly _destroy = new Subject<void>();

  /** The reference of the overlay */
  private _overlayRef: OverlayRef | null = null;

  /** The reference of the container of the overlay */
  private _containerRef: DtChartTooltipContainer | null = null;

  /** The reference of the portal to open/close the overlay */
  private _portal: ComponentPortal<DtChartTooltipContainer> | null = null;

  /** The reference of the template portal to pass the overlay template to */
  private _templatePortal: TemplatePortal<any> | null = null;

  private _overlayRefDetachSubscription: Subscription = Subscription.EMPTY;

  constructor(
    private _overlay: Overlay,
    private _viewContainerRef: ViewContainerRef,
    private _scrollDispatcher: ScrollDispatcher,
    private _ngZone: NgZone,
  ) {}

  ngOnDestroy(): void {
    this._destroy.next();
    this._destroy.complete();
    this._overlayRefDetachSubscription.unsubscribe();
  }

  /** @internal Create a new overlay for the tooltip (triggered by the chart) */
  _createOverlay(
    data: DtChartTooltipData,
    parentChart: DtChart,
    plotBackgroundInfo: PlotBackgroundInfo,
  ): void {
    if (parentChart._chartObject && data && data.points) {
      const positionStrategy = this._overlay
        .position()
        .flexibleConnectedTo(
          this._getTooltipPosition(data, parentChart, plotBackgroundInfo),
        )
        .withPositions(DEFAULT_DT_CHART_TOOLTIP_POSITIONS);

      const overlayConfig = new OverlayConfig({
        positionStrategy,
        backdropClass: 'dt-no-pointer',
        hasBackdrop: true,
        panelClass: ['dt-chart-tooltip-overlay', 'dt-no-pointer'],
      });

      /**
       * dismiss the overlay on scroll
       * using the cdk overlay scroll strategy close would
       * immediately detach the component portal, so instead the
       * scroll dispatcher is used to listen for scroll events
       */
      this._scrollDispatcher
        .scrolled()
        .pipe(take(1))
        .subscribe(() => {
          this._ngZone.run(() => this._dismiss());
        });

      const overlayRef = this._overlay.create(overlayConfig);
      const portal = new ComponentPortal(DtChartTooltipContainer);
      this._overlayRefDetachSubscription.unsubscribe();
      this._overlayRefDetachSubscription = overlayRef
        .detachments()
        .subscribe(() => {
          parentChart._resetHighchartsPointer();
        });

      const containerViewRef = overlayRef.attach<DtChartTooltipContainer>(
        portal,
      );

      /** check if there already is an open tooltip */
      if (this._containerRef) {
        /** wait until the open tooltip is dismissed - then open the new one */
        this._containerRef.afterClosed.subscribe(() => {
          this._openTooltip(data, portal, containerViewRef, overlayRef);
        });

        /** dismiss the current open tooltip */
        this._containerRef.exit();
      } else {
        this._openTooltip(data, portal, containerViewRef, overlayRef);
      }
    }
  }

  /** @internal Sets the references for the tooltip and opens it */
  _openTooltip(
    data: DtChartTooltipData,
    portal: ComponentPortal<DtChartTooltipContainer>,
    containerViewRef: ComponentRef<DtChartTooltipContainer>,
    overlayRef: OverlayRef,
  ): void {
    this._portal = portal;
    this._overlayRef = overlayRef;

    // tslint:disable-next-line:no-any
    this._templatePortal = new TemplatePortal<any>(
      this._overlayTemplate,
      this._viewContainerRef,
      { $implicit: data },
    );

    containerViewRef.instance._attachTemplatePortal(this._templatePortal);

    this._containerRef = containerViewRef.instance;
    this._containerRef.enter();
  }

  /** @internal Updates the overlay content (triggered by the chart) */
  _updateOverlayContext(
    data: DtChartTooltipData,
    parentChart: DtChart,
    plotBackgroundInfo: PlotBackgroundInfo,
  ): void {
    if (this._portal && this._templatePortal && this._overlayRef) {
      this._templatePortal.context.$implicit = data;
      const positionStrategy = this._overlay
        .position()
        .flexibleConnectedTo(
          this._getTooltipPosition(data, parentChart, plotBackgroundInfo),
        )
        .withPositions(DEFAULT_DT_CHART_TOOLTIP_POSITIONS);
      this._overlayRef.updatePositionStrategy(positionStrategy);
    }
  }

  /** @internal Dismisses the overlay and cleans up the refs (triggered by the chart) */
  _dismiss(): void {
    if (this._containerRef) {
      this._containerRef.exit();
      /** clean up references after overlay has been closed */
      this._containerRef.afterClosed.subscribe(() => {
        if (this._overlayRef) {
          this._overlayRef.dispose();
          this._overlayRef = null;
          this._containerRef = null;
          this._portal = null;
          this._templatePortal = null;
        }
      });
    }
  }

  /**
   * Calculate an origin point that can be used to position the tooltip.
   */
  private _getTooltipPosition(
    data: DtChartTooltipData,
    chart: DtChart,
    plotBackgroundInfo: PlotBackgroundInfo,
  ): { x: number; y: number } {
    const containerElement: HTMLElement = chart._container.nativeElement;
    const containerElementBB = containerElement.getBoundingClientRect();
    const { x, y } = getHighchartsTooltipPosition(data, plotBackgroundInfo);
    return {
      x: containerElementBB.left + x,
      y: containerElementBB.top + y,
    };
  }
}

/**
 * highcharts provides the tooltip position differently depending on the series type
 * Pie chart: data.point.point.tooltipPos[x, y]
 * Category: data.points[0].point.tooltipPos[x, whatever, whatever]
 * Mixed multiple series(line, column): data.points[0].point.tooltipPos[x, whatever, whatever]
 * Area as first: data.points[0].point.x => xAxis.toPixel(x)
 */
function getHighchartsTooltipPosition(
  data: DtChartTooltipData,
  plotBackgroundInfo: PlotBackgroundInfo,
): { x: number; y: number } {
  const isPieChart = !isDefined(data.points);
  const hasAreaFirstSeries =
    data.points && data.points[0].point && !data.points[0].point.tooltipPos;
  let x: number;
  // set y position for all charts in the middle of the plotbackground vertically
  // tslint:disable-next-line:no-magic-numbers
  let y = plotBackgroundInfo.height / 2 + plotBackgroundInfo.top;
  if (isPieChart) {
    const tooltipPos = data.point!.point.tooltipPos;
    x = tooltipPos![0];
    // override the y position for pie charts
    y = tooltipPos![1];
  } else if (hasAreaFirstSeries) {
    const point = data.points![0].point;
    const xAxis = data.points![0].series.xAxis;
    x = xAxis.toPixels(point.x);
  } else {
    const point = data.points![0].point;
    x = point.tooltipPos![0] + plotBackgroundInfo.left;
  }

  return { x, y };
}
