import { DOCUMENT } from '@angular/common';
import {
    AfterContentInit,
    AfterViewInit,
    ChangeDetectorRef,
    ComponentFactoryResolver,
    ContentChildren,
    ContentChild,
    ElementRef,
    EventEmitter,
    HostBinding,
    Inject,
    Input,
    IterableChangeRecord,
    IterableDiffers,
    NgZone,
    OnDestroy,
    OnInit,
    Output,
    QueryList,
    TemplateRef,
    ViewChild,
    ViewChildren,
    ViewContainerRef,
    InjectionToken,
    Optional,
    DoCheck,
    Directive
} from '@angular/core';
import ResizeObserver from 'resize-observer-polyfill';
import 'igniteui-trial-watermark';
import { Subject, pipe } from 'rxjs';
import { takeUntil, first, filter, throttleTime, map } from 'rxjs/operators';
import { cloneArray, flatten, mergeObjects, isIE, compareMaps } from '../core/utils';
import { DataType } from '../data-operations/data-util';
import { FilteringLogic, IFilteringExpression } from '../data-operations/filtering-expression.interface';
import { IGroupByRecord } from '../data-operations/groupby-record.interface';
import { ISortingExpression } from '../data-operations/sorting-expression.interface';
import { IForOfState, IgxGridForOfDirective } from '../directives/for-of/for_of.directive';
import { IgxTextHighlightDirective } from '../directives/text-highlight/text-highlight.directive';
import {
    AbsoluteScrollStrategy,
    HorizontalAlignment,
    VerticalAlignment,
    IgxOverlayService,
    OverlaySettings,
    PositionSettings,
    ConnectedPositioningStrategy,
    ContainerPositionStrategy
} from '../services/public_api';
import { GridBaseAPIService } from './api.service';
import { IgxGridCellComponent } from './cell.component';
import { IColumnVisibilityChangedEventArgs } from './hiding/column-hiding-item.directive';
import { ISummaryExpression } from './summaries/grid-summary';
import { RowEditPositionStrategy, IPinningConfig } from './grid.common';
import { IgxGridToolbarComponent } from './toolbar/grid-toolbar.component';
import { IgxRowDirective } from './row.directive';
import { IgxGridHeaderComponent } from './headers/grid-header.component';
import { IgxOverlayOutletDirective, IgxToggleDirective } from '../directives/toggle/toggle.directive';
import {
    FilteringExpressionsTree, IFilteringExpressionsTree, FilteringExpressionsTreeType
} from '../data-operations/filtering-expressions-tree';
import { IFilteringOperation } from '../data-operations/filtering-condition';
import { Transaction, TransactionType, TransactionService, State } from '../services/public_api';
import {
    IgxRowEditTemplateDirective,
    IgxRowEditTabStopDirective,
    IgxRowEditTextDirective,
    IgxRowEditActionsDirective
} from './grid.rowEdit.directive';
import { IgxGridNavigationService } from './grid-navigation.service';
import { IDisplayDensityOptions, DisplayDensityToken, DisplayDensityBase, DisplayDensity } from '../core/displayDensity';
import { IgxGridRowComponent } from './grid/public_api';
import { IgxFilteringService } from './filtering/grid-filtering.service';
import { IgxGridFilteringCellComponent } from './filtering/base/grid-filtering-cell.component';
import { WatchChanges } from './watch-changes';
import { IgxGridHeaderGroupComponent } from './headers/grid-header-group.component';
import { IGridResourceStrings } from '../core/i18n/grid-resources';
import { CurrentResourceStrings } from '../core/i18n/resources';
import { IgxGridSummaryService } from './summaries/grid-summary.service';
import { IgxSummaryRowComponent } from './summaries/summary-row.component';
import {
    IgxGridSelectionService,
    GridSelectionRange,
    IgxGridCRUDService,
    IgxRow,
    IgxCell,
    isChromium
} from './selection/selection.service';
import { DragScrollDirection } from './selection/drag-select.directive';
import { ICachedViewLoadedEventArgs, IgxTemplateOutletDirective } from '../directives/template-outlet/template_outlet.directive';
import { IgxExcelStyleLoadingValuesTemplateDirective } from './filtering/excel-style/excel-style-search.component';
import {
    IgxExcelStyleSortingTemplateDirective,
    IgxExcelStylePinningTemplateDirective,
    IgxExcelStyleHidingTemplateDirective,
    IgxExcelStyleMovingTemplateDirective,
    IgxExcelStyleSelectingTemplateDirective
} from './filtering/excel-style/grid.excel-style-filtering.component';
import { IgxGridColumnResizerComponent } from './resizing/resizer.component';
import { IgxGridFilteringRowComponent } from './filtering/base/grid-filtering-row.component';
import { CharSeparatedValueData } from '../services/csv/char-separated-value-data';
import { IgxColumnResizingService } from './resizing/resizing.service';
import { IFilteringStrategy } from '../data-operations/filtering-strategy';
import {
    IgxRowExpandedIndicatorDirective, IgxRowCollapsedIndicatorDirective,
    IgxHeaderExpandIndicatorDirective, IgxHeaderCollapseIndicatorDirective
} from './grid/grid.directives';
import {
    GridKeydownTargetType,
    GridSelectionMode,
    GridSummaryPosition,
    GridSummaryCalculationMode,
    FilterMode,
    ColumnPinningPosition,
    RowPinningPosition,
    GridPagingMode
} from './common/enums';
import {
    IGridCellEventArgs,
    IRowSelectionEventArgs,
    IPinColumnEventArgs,
    IGridEditEventArgs,
    IPageEventArgs,
    IRowDataEventArgs,
    IColumnResizeEventArgs,
    IColumnMovingStartEventArgs,
    IColumnMovingEventArgs,
    IColumnMovingEndEventArgs,
    IGridKeydownEventArgs,
    IRowDragStartEventArgs,
    IRowDragEndEventArgs,
    IGridClipboardEvent,
    IGridToolbarExportEventArgs,
    ISearchInfo,
    ICellPosition,
    IRowToggleEventArgs,
    IColumnSelectionEventArgs,
    IPinRowEventArgs
} from './common/events';
import { IgxAdvancedFilteringDialogComponent } from './filtering/advanced-filtering/advanced-filtering-dialog.component';
import { GridType } from './common/grid.interface';
import { IgxDecimalPipeComponent, IgxDatePipeComponent } from './common/pipes';
import { DropPosition } from './moving/moving.service';
import { IgxHeadSelectorDirective, IgxRowSelectorDirective } from './selection/row-selectors';
import { IgxGridToolbarCustomContentDirective } from './toolbar/toolbar.directive';
import { IgxColumnComponent } from './columns/column.component';
import { IgxColumnGroupComponent } from './columns/column-group.component';
import { IGridSortingStrategy } from '../data-operations/sorting-strategy';
import { IgxRowDragGhostDirective, IgxDragIndicatorIconDirective } from './row-drag.directive';
import { isNumber } from 'util';
import { showMessage } from '../core/deprecateDecorators';

const MINIMUM_COLUMN_WIDTH = 136;
const FILTER_ROW_HEIGHT = 50;
let warningShown = false;
// By default row editing overlay outlet is inside grid body so that overlay is hidden below grid header when scrolling.
// In cases when grid has 1-2 rows there isn't enough space in grid body and row editing overlay should be shown above header.
// Default row editing overlay height is higher then row height that is why the case is valid also for row with 2 rows.
// More accurate calculation is not possible, cause row editing overlay is still not shown and we don't know its height,
// but in the same time we need to set row editing overlay outlet before opening the overlay itself.
const MIN_ROW_EDITING_COUNT_THRESHOLD = 2;

export const IgxGridTransaction = new InjectionToken<string>('IgxGridTransaction');



@Directive({
    selector: '[igxGridBaseComponent]'
})
export class IgxGridBaseDirective extends DisplayDensityBase implements
    OnInit, DoCheck, OnDestroy, AfterContentInit, AfterViewInit {
    private _customDragIndicatorIconTemplate: TemplateRef<any>;
    protected _init = true;
    private _cdrRequests = false;
    protected _cdrRequestRepaint = false;

    /**
     * @hidden @internal
     */
    public get scrollSize() {
        return this.verticalScrollContainer.getScrollNativeSize();
    }

    private _resourceStrings = CurrentResourceStrings.GridResStrings;
    private _emptyGridMessage = null;
    private _emptyFilteredGridMessage = null;
    private _isLoading = false;
    private _locale = null;
    public _destroyed = false;
    private overlayIDs = [];
    private _filteringStrategy: IFilteringStrategy;
    private _sortingStrategy: IGridSortingStrategy;
    private _pinning: IPinningConfig = { columns: ColumnPinningPosition.Start };

    private _hostWidth;
    private _advancedFilteringOverlayId: string;
    private _advancedFilteringPositionSettings: PositionSettings = {
        verticalDirection: VerticalAlignment.Middle,
        horizontalDirection: HorizontalAlignment.Center,
        horizontalStartPoint: HorizontalAlignment.Center,
        verticalStartPoint: VerticalAlignment.Middle
    };

    private _advancedFilteringOverlaySettings: OverlaySettings = {
        closeOnOutsideClick: false,
        modal: false,
        positionStrategy: new ConnectedPositioningStrategy(this._advancedFilteringPositionSettings),
    };

    protected _userOutletDirective: IgxOverlayOutletDirective;

    /**
     * @hidden @internal
     */
    @ViewChild('defaultExpandedTemplate', { read: TemplateRef, static: true })
    protected defaultExpandedTemplate: TemplateRef<any>;

    /**
     * @hidden @internal
     */
    @ViewChild('defaultCollapsedTemplate', { read: TemplateRef, static: true })
    protected defaultCollapsedTemplate: TemplateRef<any>;

    /**
     * Gets/Sets the resource strings.
     * @remarks
     * By default it uses EN resources.
     */
    @Input()
    set resourceStrings(value: IGridResourceStrings) {
        this._resourceStrings = Object.assign({}, this._resourceStrings, value);
    }

    get resourceStrings(): IGridResourceStrings {
        return this._resourceStrings;
    }

    /**
     * Gets/Sets whether to autogenerate the columns.
     * @remarks
     * The default value is false. When set to true, it will override all columns declared through code or in markup.
     * @example
     * ```html
     * <igx-grid [data]="Data" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @Input()
    public autoGenerate = false;

    /**
     * @hidden @internal
     */
    public id: string;

    /**
     * Gets/Sets a custom template when empty.
     * @example
     * ```html
     * <igx-grid [id]="'igx-grid-1'" [data]="Data" [emptyGridTemplate]="myTemplate" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @Input()
    public emptyGridTemplate: TemplateRef<any>;

    /**
     * Gets/Sets a custom template when loading.
     * @example
     * ```html
     * <igx-grid [id]="'igx-grid-1'" [data]="Data" [loadingGridTemplate]="myTemplate" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @Input()
    public loadingGridTemplate: TemplateRef<any>;

    /**
     * Gets/Sets the filtering logic of the `IgxGridComponent`.
     * @remarks
     * The default is AND.
     * @example
     * ```html
     * <igx-grid [data]="Data" [autoGenerate]="true" [filteringLogic]="filtering"></igx-grid>
     * ```
     */
    @WatchChanges()
    @Input()
    public get filteringLogic() {
        return this._filteringExpressionsTree.operator;
    }

    public set filteringLogic(value: FilteringLogic) {
        this._filteringExpressionsTree.operator = value;
    }

    /**
     * Gets/Sets the filtering state.
     * @example
     * ```html
     * <igx-grid #grid [data]="Data" [autoGenerate]="true" [(filteringExpressionsTree)]="model.filteringExpressions"></igx-grid>
     * ```
     * @remarks
     * Supports two-way binding.
     */
    @WatchChanges()
    @Input()
    get filteringExpressionsTree() {
        return this._filteringExpressionsTree;
    }

    set filteringExpressionsTree(value) {
        if (value && value instanceof FilteringExpressionsTree) {
            const val = (value as FilteringExpressionsTree);
            for (let index = 0; index < val.filteringOperands.length; index++) {
                if (!(val.filteringOperands[index] instanceof FilteringExpressionsTree)) {
                    const newExpressionsTree = new FilteringExpressionsTree(FilteringLogic.And, val.filteringOperands[index].fieldName);
                    newExpressionsTree.filteringOperands.push(val.filteringOperands[index] as IFilteringExpression);
                    val.filteringOperands[index] = newExpressionsTree;
                }
            }

            value.type = FilteringExpressionsTreeType.Regular;
            this._filteringExpressionsTree = value;
            this._filteringPipeTrigger++;
            this.filteringExpressionsTreeChange.emit(this._filteringExpressionsTree);

            if (this.filteringService.isFilteringExpressionsTreeEmpty(this._filteringExpressionsTree) &&
                !this.advancedFilteringExpressionsTree) {
                this.filteredData = null;
            }

            this.filteringService.refreshExpressions();
            this.selectionService.clearHeaderCBState();
            this.summaryService.clearSummaryCache();
            this.notifyChanges();
        }
    }

    /**
     * Emitted after filtering is performed.
     * @remarks
     * Returns the filtering expressions tree of the column for which filtering was performed.
     * @example
     * ```html
     * <igx-grid #grid [data]="localData" [height]="'305px'" [autoGenerate]="true"
     *              (filteringExpressionsTreeChange)="filteringExprTreeChange($event)"></igx-grid>
     * ```
     */
    @Output()
    public filteringExpressionsTreeChange = new EventEmitter<IFilteringExpressionsTree>();

    /**
     * Emitted after advanced filtering is performed.
     * @remarks
     * Returns the advanced filtering expressions tree.
     * @example
     * ```html
     * <igx-grid #grid [data]="localData" [height]="'305px'" [autoGenerate]="true"
     *           (advancedFilteringExpressionsTreeChange)="advancedFilteringExprTreeChange($event)"></igx-grid>
     * ```
     */
    @Output()
    public advancedFilteringExpressionsTreeChange = new EventEmitter<IFilteringExpressionsTree>();

    /**
     * Gets/Sets the advanced filtering state.
     * @example
     * ```typescript
     * let advancedFilteringExpressionsTree = this.grid.advancedFilteringExpressionsTree;
     * this.grid.advancedFilteringExpressionsTree = logic;
     * ```
     */
    @WatchChanges()
    @Input()
    get advancedFilteringExpressionsTree() {
        return this._advancedFilteringExpressionsTree;
    }

    set advancedFilteringExpressionsTree(value) {
        if (value && value instanceof FilteringExpressionsTree) {
            value.type = FilteringExpressionsTreeType.Advanced;
            this._advancedFilteringExpressionsTree = value;
            this._filteringPipeTrigger++;
        } else {
            this._advancedFilteringExpressionsTree = null;
        }
        this.advancedFilteringExpressionsTreeChange.emit(this._advancedFilteringExpressionsTree);

        if (this.filteringService.isFilteringExpressionsTreeEmpty(this._advancedFilteringExpressionsTree) &&
            !this.advancedFilteringExpressionsTree) {
            this.filteredData = null;
        }

        this.selectionService.clearHeaderCBState();
        this.summaryService.clearSummaryCache();
        this.notifyChanges();

        // Wait for the change detection to update filtered data through the pipes and then emit the event.
        requestAnimationFrame(() => this.onFilteringDone.emit(this._advancedFilteringExpressionsTree));
    }

    /**
     * Gets/Sets the locale.
     * @remarks
     * If not set, returns browser's language.
     */
    @Input()
    get locale(): string {
        if (this._locale) {
            return this._locale;
        } else {
            return 'en';
        }
    }

    set locale(value) {
        this._locale = value;
    }

    @Input()
    get pagingMode() {
        return this._pagingMode;
    }

    set pagingMode(val: GridPagingMode) {
        this._pagingMode = val;
        this._pipeTrigger++;
        this.notifyChanges(true);
    }

    /**
     * Gets/Sets whether the paging feature is enabled.
     * @remarks
     * The default state is disabled (false).
     * @example
     * ```html
     * <igx-grid #grid [data]="Data" [autoGenerate]="true" [paging]="true"></igx-grid>
     * ```
     */
    @Input()
    get paging(): boolean {
        return this._paging;
    }

    set paging(value: boolean) {
        this._paging = value;
        this._pipeTrigger++;
        this.notifyChanges(true);
    }

    /**
     * Gets/Sets the current page index.
     * @example
     * ```html
     *  <igx-grid #grid [data]="Data" [paging]="true" [(page)]="model.page" [autoGenerate]="true"></igx-grid>
     * ```
     * @remarks
     * Supports two-way binding.
     */
    @Input()
    get page(): number {
        return this._page;
    }

    set page(val: number) {
        if (val === this._page || val < 0 || val > this.totalPages - 1) {
            return;
        }
        this.selectionService.clear(true);
        this.onPagingDone.emit({ previous: this._page, current: val });
        this._page = val;
        this.pageChange.emit(this._page);
        this.navigateTo(0);
        this.notifyChanges();
    }

    /**
     * Emitted after the current page is changed.
     * @example
     * ```html
     * <igx-grid (pageChange)="onPageChange($event)"></igx-grid>
     * ```
     * ```typescript
     * public onPageChange(page: number) {
     *   this.currentPage = page;
     * }
     * ```
     */
    @Output()
    public pageChange = new EventEmitter<number>();

    /**
     * Gets/Sets the number of visible items per page.
     * @remarks
     * The default is 15.
     * @example
     * ```html
     * <igx-grid #grid [data]="Data" [paging]="true" [(perPage)]="model.perPage" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @Input()
    get perPage(): number {
        return this._perPage;
    }

    set perPage(val: number) {
        if (val < 0) {
            return;
        }
        this.selectionService.clear(true);
        this._perPage = val;
        this.perPageChange.emit(this._perPage);
        this.page = 0;
        this.endEdit(true);
        this.notifyChanges();
    }

    /**
     * Emitted when `perPage` property value of the grid is changed.
     * @example
     * ```html
     * <igx-grid #grid (perPageChange)="onPerPageChange($event)" [autoGenerate]="true"></igx-grid>
     * ```
     * ```typescript
     * public onPerPageChange(perPage: number) {
     *   this.perPage = perPage;
     * }
     * ```
     */
    @Output()
    public perPageChange = new EventEmitter<number>();

    /**
     * Gets/Sets a custom `ng-template` for the pagination UI of the grid.
     * @example
     * ```html
     * <igx-grid #grid [paging]="true" [myTemplate]="myTemplate" [height]="'305px'"></igx-grid>
     * ```
     */
    @Input()
    public paginationTemplate: TemplateRef<any>;

    /**
     * Gets/Sets whether the column hiding UI is enabled.
     * @remarks
     * By default it is disabled (false). In order for the UI to work, you need to enable the toolbar as shown in the example below.
     * @example
     * ```html
     * <igx-grid [data]="Data" [autoGenerate]="true" [showToolbar]="true" [columnHiding]="true"></igx-grid>
     * ```
     */
    @Input()
    get columnHiding() {
        return this._columnHiding;
    }

    set columnHiding(value) {
        if (this._columnHiding !== value) {
            this._columnHiding = value;
            if (!this._init) {
                this.notifyChanges(true);
            }
        }
    }

    /**
     * Gets/Sets if the row selectors are hidden.
     * @remarks
     *  By default row selectors are shown
     */
    @WatchChanges()
    @Input()
    get hideRowSelectors() {
        return this._hideRowSelectors;
    }

    set hideRowSelectors(value: boolean) {
        this._hideRowSelectors = value;
        this.notifyChanges(true);
    }

    /**
     * Gets/Sets whether rows can be moved.
     * @example
     * ```html
     * <igx-grid #grid [rowDraggable]="true"></igx-grid>
     * ```
     */
    @Input()
    get rowDraggable(): boolean {
        return this._rowDrag && this.hasVisibleColumns;
    }


    set rowDraggable(val: boolean) {
        this._rowDrag = val;
        this.notifyChanges(true);
    }

    /**
     * @hidden
     * @internal
     */
    public rowDragging = false;

    /**
     * Gets the row ID that is being dragged.
     * @remarks
     * The row ID is either the primaryKey value or the data record instance.
     */
    public dragRowID = null;


   /**
    * Gets/Sets whether the rows are editable.
    * @remarks
    * By default it is set to false.
    * @example
    * ```html
    * <igx-grid #grid [showToolbar]="true" [rowEditable]="true" [primaryKey]="'ProductID'" [columnHiding]="true"></igx-grid>
    * ```
    */
    @WatchChanges()
    @Input()
    get rowEditable(): boolean {
        return this._rowEditable;
    }

    set rowEditable(val: boolean) {
        if (!this._init) {
            this.refreshGridState();
        }
        this._rowEditable = val;
        this.notifyChanges();
    }

    /**
     * @hidden
     * @internal
     */
    @Input()
    public class = '';

    /**
     * Gets/Sets the height.
     * @example
     * ```html
     * <igx-grid #grid [data]="Data" [height]="'305px'" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @WatchChanges()
    @HostBinding('style.height')
    @Input()
    public get height() {
        return this._height;
    }

    public set height(value: string) {
        if (this._height !== value) {
            this._height = value;
            this.nativeElement.style.height = value;
            this.notifyChanges(true);
        }
    }

    /**
     * @hidden @internal
     */
    @HostBinding('style.width')
    get hostWidth() {
        return this._width || this._hostWidth;
    }

    /**
     * Gets/Sets the width of the grid.
     * @example
     * ```typescript
     * let gridWidth = this.grid.width;
     * ```
     */
    @WatchChanges()
    @Input()
    get width() {
        return this._width;
    }

    set width(value) {
        if (this._width !== value) {
            this._width = value;
            this.nativeElement.style.width = value;
            this.notifyChanges(true);
        }
    }

    /**
     * Gets the width of the header.
     * @example
     * ```html
     * let gridHeaderWidth = this.grid.headerWidth;
     * ```
     */
    get headerWidth() {
        return parseInt(this.width, 10) - 17;
    }

    /**
     * Gets/Sets the styling classes applied to all even `IgxGridRowComponent`s in the grid.
     * @example
     * ```html
     * <igx-grid #grid [data]="Data" [evenRowCSS]="'igx-grid--my-even-class'" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @Input()
    public evenRowCSS = 'igx-grid__tr--even';

    /**
     * Gets/Sets the styling classes applied to all odd `IgxGridRowComponent`s in the grid.
     * @example
     * ```html
     * <igx-grid #grid [data]="Data" [evenRowCSS]="'igx-grid--my-odd-class'" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @Input()
    public oddRowCSS = 'igx-grid__tr--odd';

    /**
     * Gets/Sets the row height.
     * @example
     * ```html
     * <igx-grid #grid [data]="localData" [showToolbar]="true" [rowHeight]="100" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @WatchChanges()
    @Input()
    public get rowHeight() {
        return this._rowHeight ? this._rowHeight : this.defaultRowHeight;
    }

    public set rowHeight(value) {
        this._rowHeight = parseInt(value, 10);
    }

    /**
     * Gets/Sets the default width of the columns.
     * @example
     * ```html
     * <igx-grid #grid [data]="localData" [showToolbar]="true" [columnWidth]="100" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @WatchChanges()
    @Input()
    public get columnWidth(): string {
        return this._columnWidth;
    }
    public set columnWidth(value: string) {
        this._columnWidth = value;
        this.columnWidthSetByUser = true;
        this.notifyChanges(true);
    }

    /**
     * Gets/Sets the primary key.
     * @example
     * ```html
     * <igx-grid #grid [data]="localData" [showToolbar]="true" [primaryKey]="'ProductID'" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @WatchChanges()
    @Input()
    public primaryKey;

    /**
     * Get/Sets the message displayed when there are no records.
     * @example
     * ```html
     * <igx-grid #grid [data]="Data" [emptyGridMessage]="'The grid is empty'" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @Input()
    set emptyGridMessage(value: string) {
        this._emptyGridMessage = value;
    }
    get emptyGridMessage(): string {
        return this._emptyGridMessage || this.resourceStrings.igx_grid_emptyGrid_message;
    }

    /**
     * Gets/Sets whether the grid is going to show a loading indicator.
     * @example
     * ```html
     * <igx-grid #grid [data]="Data" [isLoading]="true" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @WatchChanges()
    @Input()
    set isLoading(value: boolean) {
        if (this._isLoading !== value) {
            this._isLoading = value;
            this.evaluateLoadingState();
        }
        Promise.resolve().then(() => {
            // wait for the current detection cycle to end before triggering a new one.
            this.notifyChanges();
        });
    }

    get isLoading(): boolean {
        return this._isLoading;
    }

    /**
     * Gets/Sets whether the columns should be auto-generated once again after the initialization of the grid
     * @remarks
     * This will allow to bind the grid to remote data and having auto-generated columns at the same time.
     * Note that after generating the columns, this property would be disabled to avoid re-creating
     * columns each time a new data is assigned.
     * @example
     * ```typescript
     *  this.grid.shouldGenerate = true;
     * ```
     */
    public shouldGenerate: boolean;

    /**
     * Gets/Sets the message displayed when there are no records and the grid is filtered.
     * @example
     * ```html
     * <igx-grid #grid [data]="Data" [emptyGridMessage]="'The grid is empty'" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @Input()
    set emptyFilteredGridMessage(value: string) {
        this._emptyFilteredGridMessage = value;
    }

    get emptyFilteredGridMessage(): string {
        return this._emptyFilteredGridMessage || this.resourceStrings.igx_grid_emptyFilteredGrid_message;
    }

    /**
     * Gets/Sets the title to be displayed in the built-in column hiding UI.
     * @example
     * ```html
     * <igx-grid [showToolbar]="true" [columnHiding]="true" columnHidingTitle="Column Hiding"></igx-grid>
     * ```
     */
    @Input()
    public columnHidingTitle = '';

    /**
     * Gets/Sets the initial pinning configuration.
     * @remarks
     * Allows to apply pinning the columns to the start or the end.
     * Note that pinning to both sides at a time is not allowed.
     * @example
     * ```html
     * <igx-grid [pinning]="pinningConfig"></igx-grid>
     * ```
     */
    @Input()
    get pinning() {
        return this._pinning;
    }
    set pinning(value) {
        if (value !== this._pinning) {
            this.resetCaches();
        }
        this._pinning = value;
    }


    /**
     * Gets/Sets if the built-in column pinning UI should be shown in the toolbar.
     * @example
     * ```html
     * <igx-grid #grid [data]="localData" [columnPinning]="'true" [height]="'305px'" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @WatchChanges()
    @Input()
    get columnPinning() {
        return this._columnPinning;
    }
    set columnPinning(value) {
        if (this._columnPinning !== value) {
            this._columnPinning = value;
            if (!this._init) {
                this.notifyChanges(true);
            }
        }
    }

    /**
     * Gets/Sets the title to be displayed in the UI of the column pinning.
     * @example
     * ```html
     * <igx-grid #grid [data]="localData" [columnPinning]="'true" [columnPinningTitle]="'Column Hiding'" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @Input()
    public columnPinningTitle = '';

    /**
     * Gets/Sets if the filtering is enabled.
     * @example
     * ```html
     * <igx-grid #grid [data]="localData" [allowFiltering]="true" [height]="'305px'" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @Input()
    get allowFiltering() {
        return this._allowFiltering;
    }

    set allowFiltering(value) {
        if (this._allowFiltering !== value) {
            this._allowFiltering = value;
            this.filteringService.registerSVGIcons();

            if (!this._init) {
                this.calcGridHeadRow();
            }

            this.filteringService.isFilterRowVisible = false;
            this.filteringService.filteredColumn = null;

            this.notifyChanges(true);
        }
    }

    /**
     * Gets/Sets a value indicating whether the advanced filtering is enabled.
     * @example
     * ```html
     * <igx-grid #grid [data]="localData" [allowAdvancedFiltering]="true" [showToolbar]="true" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @Input()
    get allowAdvancedFiltering() {
        return this._allowAdvancedFiltering;
    }

    set allowAdvancedFiltering(value) {
        if (this._allowAdvancedFiltering !== value) {
            this._allowAdvancedFiltering = value;
            this.filteringService.registerSVGIcons();

            if (!this._init) {
                this.notifyChanges(true);
            }
        }
    }

    /**
     * Gets/Sets the filter mode.
     * @example
     * ```html
     * <igx-grid #grid [data]="localData" [filterMode]="'quickFilter'" [height]="'305px'" [autoGenerate]="true"></igx-grid>
     * ```
     * @remarks
     * By default it's set to FilterMode.quickFilter.
     */
    @Input()
    get filterMode() {
        return this._filterMode;
    }

    set filterMode(value) {
        this._filterMode = value;

        if (this.filteringService.isFilterRowVisible) {
            this.filteringRow.close();
        }
        this.notifyChanges(true);
    }

    /**
     * Gets/Sets the summary position.
     * @example
     * ```html
     * <igx-grid #grid [data]="localData" summaryPosition="top" [autoGenerate]="true"></igx-grid>
     * ```
     * @remarks
     * By default it is bottom.
     */
    @Input()
    get summaryPosition() {
        return this._summaryPosition;
    }

    set summaryPosition(value) {
        this._summaryPosition = value;
        this.notifyChanges();
    }

    /**
     * Gets/Sets the summary calculation mode.
     * @example
     * ```html
     * <igx-grid #grid [data]="localData" summaryCalculationMode="rootLevelOnly" [autoGenerate]="true"></igx-grid>
     * ```
     * @remarks
     * By default it is rootAndChildLevels which means the summaries are calculated for the root level and each child level.
     */
    @Input()
    get summaryCalculationMode() {
        return this._summaryCalculationMode;
    }

    set summaryCalculationMode(value) {
        this._summaryCalculationMode = value;
        if (!this._init) {
            this.endEdit(true);
            this.summaryService.resetSummaryHeight();
            this.notifyChanges(true);
        }
    }

    /**
     * Gets/Sets the filtering strategy of the grid.
     * @example
     * ```html
     *  <igx-grid #grid [data]="localData" [filterStrategy]="filterStrategy"></igx-grid>
     * ```
     */
    @Input()
    get filterStrategy(): IFilteringStrategy {
        return this._filteringStrategy;
    }

    set filterStrategy(classRef: IFilteringStrategy) {
        this._filteringStrategy = classRef;
    }

    /**
     * Gets/Sets the sorting strategy of the grid.
     * @example
     * ```html
     *  <igx-grid #grid [data]="localData" [sortStrategy]="sortStrategy"></igx-grid>
     * ```
     */
    @Input()
    get sortStrategy(): IGridSortingStrategy {
        return this._sortingStrategy;
    }

    set sortStrategy(value: IGridSortingStrategy) {
        this._sortingStrategy = value;
    }

    /**
     * Gets/Sets a unique values strategy used by the Excel Style Filtering
     * @remarks
     * Provides a callback for loading unique column values on demand.
     * If this property is provided, the unique values it generates will be used by the Excel Style Filtering.
     * @example
     * ```html
     * <igx-grid [data]="localData" [filterMode]="'excelStyleFilter'" [uniqueColumnValuesStrategy]="columnValuesStrategy"></igx-grid>
     * ```
     */
    @Input()
    public uniqueColumnValuesStrategy: (column: IgxColumnComponent,
        filteringExpressionsTree: IFilteringExpressionsTree,
        done: (values: any[]) => void) => void;

    /**
     * Emitted when `IgxGridCellComponent` is clicked.
     * @remarks
     * Returns the `IgxGridCellComponent`.
     * @example
     * ```html
     * <igx-grid #grid (onCellClick)="onCellClick($event)" [data]="localData" [height]="'305px'" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @Output()
    public onCellClick = new EventEmitter<IGridCellEventArgs>();

    /**
     * Emitted when `IgxGridCellComponent` is selected.
     * @remarks
     *  Returns the `IgxGridCellComponent`.
     * @example
     * ```html
     * <igx-grid #grid (onSelection)="onCellSelect($event)" [data]="localData" [height]="'305px'" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @Output()
    public onSelection = new EventEmitter<IGridCellEventArgs>();

    /**
     *  Emitted when `IgxGridRowComponent` is selected.
     * @example
     * ```html
     * <igx-grid #grid (onRowSelectionChange)="onCellClickChange($event)" [data]="localData" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @Output()
    public onRowSelectionChange = new EventEmitter<IRowSelectionEventArgs>();

   /**
    *  Emitted when `IgxColumnComponent` is selected.
    * @example
    * ```html
    * <igx-grid #grid (onColumnSelectionChange)="onColumnSelectionChange($event)" [data]="localData" [autoGenerate]="true"></igx-grid>
    * ```
    */
    @Output()
    public onColumnSelectionChange = new EventEmitter<IColumnSelectionEventArgs>();

    /**
     * Emitted when `IgxColumnComponent` is pinned.
     * @remarks
     * The index that the column is inserted at may be changed through the `insertAtIndex` property.
     * @example
     * ```typescript
     * public columnPinning(event) {
     *     if (event.column.field === "Name") {
     *       event.insertAtIndex = 0;
     *     }
     * }
     * ```
     */
    @Output()
    public onColumnPinning = new EventEmitter<IPinColumnEventArgs>();

    /**
     * Emitted when editing and **not** submitting the value.
     * @remarks
     * (e.g. `Esc` key was pressed)
     * This event is cancelable.
     * @example
     * ```html
     * <igx-grid #grid3 (onCellEditCancel)="editCancel($event)" [data]="data" [primaryKey]="'ProductID'">
     * </igx-grid>
     * ```
     */
    @Output()
    public onCellEditCancel = new EventEmitter<IGridEditEventArgs>();

    /**
     * Emitted when cell enters edit mode.
     * @remarks
     * This event is cancelable.
     * @example
     * ```html
     * <igx-grid #grid3 (onCellEditEnter)="editStart($event)" [data]="data" [primaryKey]="'ProductID'">
     * </igx-grid>
     * ```
     */
    @Output()
    public onCellEditEnter = new EventEmitter<IGridEditEventArgs>();

    /**
     * Emitted when cell has been edited.
     * @remarks
     * Event is fired after editing is completed, when the cell is exiting edit mode.
     * This event is cancelable.
     * @example
     * ```html
     * <igx-grid #grid3 (onCellEdit)="editDone($event)" [data]="data" [primaryKey]="'ProductID'">
     * </igx-grid>
     * ```
     */
    @Output()
    public onCellEdit = new EventEmitter<IGridEditEventArgs>();

    /**
     * Emitted when a row enters edit mode.
     * @remarks
     * Emitted when [rowEditable]="true".
     * This event is cancelable.
     * @example
     * ```html
     * <igx-grid #grid3 (onRowEditEnter)="editStart($event)" [primaryKey]="'ProductID'" [rowEditable]="true">
     * </igx-grid>
     * ```
     */
    @Output()
    public onRowEditEnter = new EventEmitter<IGridEditEventArgs>();

    /**
     * Emitted when exiting edit mode for a row.
     * @remarks
     * Emitted when [rowEditable]="true" & `endEdit(true)` is called.
     * Emitted when changing rows during edit mode, selecting an un-editable cell in the edited row,
     * performing paging operation, column resizing, pinning, moving or hitting  `Done`
     * button inside of the rowEditingOverlay, or hitting the `Enter` key while editing a cell.
     * This event is cancelable.
     * @example
     * ```html
     * <igx-grid #grid3 (onRowEdit)="editDone($event)" [data]="data" [primaryKey]="'ProductID'" [rowEditable]="true">
     * </igx-grid>
     * ```
     */
    @Output()
    public onRowEdit = new EventEmitter<IGridEditEventArgs>();

    /**
     * Emitted when row editing is canceled.
     * @remarks
     * Emits when [rowEditable]="true" & `endEdit(false)` is called.
     * Emitted when changing hitting `Esc` key during cell editing and when click on the `Cancel` button
     * in the row editing overlay.
     * This event is cancelable.
     * @example
     * ```html
     * <igx-grid #grid3 (onRowEditCancel)="editCancel($event)" [data]="data" [primaryKey]="'ProductID'" [rowEditable]="true">
     * </igx-grid>
     * ```
     */
    @Output()
    public onRowEditCancel = new EventEmitter<IGridEditEventArgs>();

    /**
     * Emitted when a column is initialized.
     * @remarks
     * Returns the column object.
     * @example
     * ```html
     * <igx-grid #grid [data]="localData" [onColumnInit]="initColumns($event)" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @Output()
    public onColumnInit = new EventEmitter<IgxColumnComponent>();

    /**
     * Emitted when sorting is performed through the UI.
     * @remarks
     * Returns the sorting expression.
     * @example
     * ```html
     * <igx-grid #grid [data]="localData" [autoGenerate]="true" (onSortingDone)="sortingDone($event)"></igx-grid>
     * ```
     */
    @Output()
    public onSortingDone = new EventEmitter<ISortingExpression | Array<ISortingExpression>>();

    /**
     * Emitted when filtering is performed through the UI.
     * @remarks
     * Returns the filtering expressions tree of the column for which filtering was performed.
     * @example
     * ```html
     * <igx-grid #grid [data]="localData" [height]="'305px'" [autoGenerate]="true" (onFilteringDone)="filteringDone($event)"></igx-grid>
     * ```
     */
    @Output()
    public onFilteringDone = new EventEmitter<IFilteringExpressionsTree>();

    /**
     * Emitted when paging is performed.
     * @remarks
     * Returns an object consisting of the previous and next pages.
     * @example
     * ```html
     * <igx-grid #grid [data]="localData" [height]="'305px'" [autoGenerate]="true" (onPagingDone)="pagingDone($event)"></igx-grid>
     * ```
     */
    @Output()
    public onPagingDone = new EventEmitter<IPageEventArgs>();

    /**
     * Emitted when a row added through the API.
     * @remarks
     * Returns the data for the new `IgxGridRowComponent` object.
     * @example
     * ```html
     * <igx-grid #grid [data]="localData" (onRowAdded)="rowAdded($event)" [height]="'305px'" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @Output()
    public onRowAdded = new EventEmitter<IRowDataEventArgs>();

    /**
     * Emitted when a row is deleted through API.
     * @remarks
     * Returns an `IRowDataEventArgs` object.
     * @example
     * ```html
     * <igx-grid #grid [data]="localData" (onRowDeleted)="rowDeleted($event)" [height]="'305px'" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @Output()
    public onRowDeleted = new EventEmitter<IRowDataEventArgs>();

    /**
     * Emitted when a new chunk of data is loaded from virtualization.
     * @example
     * ```typescript
     *  <igx-grid #grid [data]="localData" [autoGenerate]="true" (onDataPreLoad)='handleDataPreloadEvent()'></igx-grid>
     * ```
     */
    @Output()
    public onDataPreLoad = new EventEmitter<IForOfState>();

    /**
     * Emitted when column is resized.
     * @remarks
     * Returns the `IgxColumnComponent` object's old and new width.
     * @example
     * ```html
     * <igx-grid #grid [data]="localData" (onColumnResized)="resizing($event)" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @Output()
    public onColumnResized = new EventEmitter<IColumnResizeEventArgs>();

    /**
     * Emitted when a cell is right clicked.
     * @remarks
     * Returns the `IgxGridCellComponent` object.
     * ```html
     * <igx-grid #grid [data]="localData" (onContextMenu)="contextMenu($event)" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @Output()
    public onContextMenu = new EventEmitter<IGridCellEventArgs>();

    /**
     * Emitted when a cell is double clicked.
     * @remarks
     * Returns the `IgxGridCellComponent` object.
     * @example
     * ```html
     * <igx-grid #grid [data]="localData" (onDoubleClick)="dblClick($event)" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @Output()
    public onDoubleClick = new EventEmitter<IGridCellEventArgs>();

    /**
     * Emitted when column visibility is changed.
     * @remarks
     * Args: { column: any, newValue: boolean }
     * @example
     * ```html
     * <igx-grid [columnHiding]="true" [showToolbar]="true" (onColumnVisibilityChanged)="visibilityChanged($event)"></igx-grid>
     * ```
     */
    @Output()
    public onColumnVisibilityChanged = new EventEmitter<IColumnVisibilityChangedEventArgs>();

    /**
     * Emitted when column moving starts.
     * @remarks
     * Returns the moved `IgxColumnComponent` object.
     * @example
     * ```html
     * <igx-grid [columnHiding]="true" [showToolbar]="true" (onColumnMovingStart)="movingStart($event)"></igx-grid>
     * ```
     */
    @Output()
    public onColumnMovingStart = new EventEmitter<IColumnMovingStartEventArgs>();

    /**
     * Emitted during the column moving operation.
     * @remarks
     * Returns the source and target `IgxColumnComponent` objects. This event is cancelable.
     * @example
     * ```html
     * <igx-grid [columnHiding]="true" [showToolbar]="true" (onColumnMoving)="moving($event)"></igx-grid>
     * ```
     */
    @Output()
    public onColumnMoving = new EventEmitter<IColumnMovingEventArgs>();

    /**
     * Emitted when column moving ends.
     * @remarks
     * Returns the source and target `IgxColumnComponent` objects.
     * @example
     * ```html
     * <igx-grid [columnHiding]="true" [showToolbar]="true" (onColumnMovingEnd)="movingEnds($event)"></igx-grid>
     * ```
     */
    @Output()
    public onColumnMovingEnd = new EventEmitter<IColumnMovingEndEventArgs>();

    /**
     * Emitted when keydown is triggered over element inside grid's body.
     * @remarks
     * This event is fired only if the key combination is supported in the grid.
     * Return the target type, target object and the original event. This event is cancelable.
     * @example
     * ```html
     *  <igx-grid (onGridKeydown)="customKeydown($event)"></igx-grid>
     * ```
     */
    @Output()
    public onGridKeydown = new EventEmitter<IGridKeydownEventArgs>();

    /**
     * Emitted when start dragging a row.
     * @remarks
     * Return the dragged row.
     */
    @Output()
    public onRowDragStart = new EventEmitter<IRowDragStartEventArgs>();

    /**
     * Emitted when dropping a row.
     * @remarks
     * Return the dropped row.
     */
    @Output()
    public onRowDragEnd = new EventEmitter<IRowDragEndEventArgs>();

    /**
     * Emitted when a copy operation is executed.
     * @remarks
     * Fired only if copy behavior is enabled through the [`clipboardOptions`]{@link IgxGridBaseDirective#clipboardOptions}.
     */
    @Output()
    onGridCopy = new EventEmitter<IGridClipboardEvent>();

    /**
     * @hidden @internal
     */
    @Output()
    public expansionStatesChange = new EventEmitter<Map<any, boolean>>();

    /**
     * Emitted when the expanded state of a row gets changed.
     * @example
     * ```html
     * <igx-grid [data]="employeeData" (onRowToggle)="rowToggle($event)" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @Output()
    public onRowToggle = new EventEmitter<IRowToggleEventArgs>();

    /**
     * Emitted when the pinned state of a row is changed.
     * @example
     * ```html
     * <igx-grid [data]="employeeData" (onRowPinning)="rowPin($event)" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @Output()
    public onRowPinning = new EventEmitter<IPinRowEventArgs>();

    /**
     * @hidden @internal
     */
    @ViewChild(IgxGridColumnResizerComponent)
    public resizeLine: IgxGridColumnResizerComponent;

    /**
     * @hidden @internal
     */
    @ViewChild('loadingOverlay', { static: true })
    public loadingOverlay: ElementRef;

    /**
     * @hidden @internal
     */
    @ViewChild('igxLoadingOverlayOutlet', { read: IgxOverlayOutletDirective, static: true })
    public loadingOutlet: IgxOverlayOutletDirective;

    /**
     * @hidden @internal
     */
    @ContentChildren(IgxColumnComponent, { read: IgxColumnComponent, descendants: true })
    public columnList: QueryList<IgxColumnComponent> = new QueryList<IgxColumnComponent>();

    /**
     * @hidden @internal
     */
    @ContentChild(IgxExcelStyleSortingTemplateDirective, { read: IgxExcelStyleSortingTemplateDirective })
    public excelStyleSortingTemplateDirective: IgxExcelStyleSortingTemplateDirective;

    /**
     * @hidden @internal
     */
    @ContentChild(IgxExcelStyleMovingTemplateDirective, { read: IgxExcelStyleMovingTemplateDirective })
    public excelStyleMovingTemplateDirective: IgxExcelStyleMovingTemplateDirective;

    /**
     * @hidden @internal
     */
    @ContentChild(IgxExcelStyleHidingTemplateDirective, { read: IgxExcelStyleHidingTemplateDirective })
    public excelStyleHidingTemplateDirective: IgxExcelStyleHidingTemplateDirective;

    /**
     * @hidden @internal
     */
    @ContentChild(IgxExcelStyleSelectingTemplateDirective, { read: IgxExcelStyleSelectingTemplateDirective })
    public excelStyleSelectingTemplateDirective: IgxExcelStyleSelectingTemplateDirective;

    /**
     * @hidden @internal
     */
    @ContentChild(IgxExcelStylePinningTemplateDirective, { read: IgxExcelStylePinningTemplateDirective })
    public excelStylePinningTemplateDirective: IgxExcelStylePinningTemplateDirective;

    /**
     * @hidden @internal
     */
    @ContentChild(IgxExcelStyleLoadingValuesTemplateDirective, { read: IgxExcelStyleLoadingValuesTemplateDirective, static: true })
    public excelStyleLoadingValuesTemplateDirective: IgxExcelStyleLoadingValuesTemplateDirective;

    /**
     * @hidden @internal
     */
    @ViewChildren(IgxGridHeaderGroupComponent, { read: IgxGridHeaderGroupComponent })
    public headerGroups: QueryList<IgxGridHeaderGroupComponent>;

    /**
     * A list of all `IgxGridHeaderGroupComponent`.
     * @example
     * ```typescript
     * const headerGroupsList = this.grid.headerGroupsList;
     * ```
     */
    get headerGroupsList(): IgxGridHeaderGroupComponent[] {
        return this.headerGroups ? flatten(this.headerGroups.toArray()) : [];
    }

    /**
     * A list of all `IgxGridHeaderComponent`.
     * @example
     * ```typescript
     * const headers = this.grid.headerCellList;
     * ```
     */
    get headerCellList(): IgxGridHeaderComponent[] {
        return this.headerGroupsList.map((headerGroup) => headerGroup.headerCell).filter((headerCell) => headerCell);
    }

    /**
     * A list of all `IgxGridFilteringCellComponent`.
     * @example
     * ```typescript
     * const filterCells = this.grid.filterCellList;
     * ```
     */
    get filterCellList(): IgxGridFilteringCellComponent[] {
        return this.headerGroupsList.map((headerGroup) => headerGroup.filterCell).filter((filterCell) => filterCell);
    }

    @ViewChildren('row')
    private _rowList: QueryList<IgxGridRowComponent>;

    @ViewChildren('pinnedRow')
    private _pinnedRowList: QueryList<IgxGridRowComponent>;

    @ViewChildren('summaryRow', { read: IgxSummaryRowComponent })
    protected _summaryRowList: QueryList<IgxSummaryRowComponent>;

    /**
     * @hidden @internal
     */
    public get summariesRowList() {
        const res = new QueryList<any>();
        if (!this._summaryRowList) {
            return res;
        }
        const sumList = this._summaryRowList.filter((item) => {
            return item.element.nativeElement.parentElement !== null;
        });
        res.reset(sumList);
        return res;
    }

    /**
     * A list of `IgxGridRowComponent`.
     * @example
     * ```typescript
     * const rowList = this.grid.rowList;
     * ```
     */
    public get rowList() {
        const res = new QueryList<any>();
        if (!this._rowList) {
            return res;
        }
        const rList = this._rowList
            .filter((item) => {
                return item.element.nativeElement.parentElement !== null;
            })
            .sort((a, b) => {
                return a.index - b.index;
            });
        res.reset(rList);
        return res;
    }

    @ViewChildren(IgxRowDirective, { read: IgxRowDirective })
    private _dataRowList: QueryList<IgxRowDirective<IgxGridBaseDirective>>;

    /**
     * A list of currently rendered `IgxGridRowComponent`'s.
     * @example
     * ```typescript
     * const dataList = this.grid.dataRowList;
     * ```
     */
    public get dataRowList(): QueryList<IgxRowDirective<IgxGridBaseDirective>> {
        const res = new QueryList<IgxRowDirective<IgxGridBaseDirective>>();
        if (!this._dataRowList) {
            return res;
        }
        const rList = this._dataRowList.filter((item) => {
            return item.element.nativeElement.parentElement !== null;
        }).sort((a, b) => {
            return a.index - b.index;
        });
        res.reset(rList);
        return res;
    }

    /**
     * A template reference for the template when the filtered grid is empty.
     * @example
     * ```
     * const emptyTempalte = this.grid.emptyGridTemplate;
     * ```
     */
    @ViewChild('emptyFilteredGrid', { read: TemplateRef, static: true })
    public emptyFilteredGridTemplate: TemplateRef<any>;

    /**
     * A template reference for the template when the grid is empty.
     * @example
     * ```
     * const emptyTempalte = this.grid.emptyGridTemplate;
     * ```
     */
    @ViewChild('defaultEmptyGrid', { read: TemplateRef, static: true })
    public emptyGridDefaultTemplate: TemplateRef<any>;

    /**
     * @hidden @internal
     */
    @ViewChild('defaultLoadingGrid', { read: TemplateRef, static: true })
    public loadingGridDefaultTemplate: TemplateRef<any>;

    /**
     * @hidden @internal
     */
    @ViewChild('scrollContainer', { read: IgxGridForOfDirective, static: true })
    public parentVirtDir: IgxGridForOfDirective<any>;

    /**
     * Returns the template which will be used by the toolbar to show custom content.
     * @example
     * ```typescript
     * let customContentTemplate = this.grid.toolbarCustomContentTemplate;
     * ```
     */
    public get toolbarCustomContentTemplate(): IgxGridToolbarCustomContentDirective {
        return this.toolbarCustomContentTemplates.first;
    }

    /**
     * @hidden
     * @internal
     */
    @ContentChildren(IgxGridToolbarCustomContentDirective, { read: IgxGridToolbarCustomContentDirective, descendants: false })
    public toolbarCustomContentTemplates: QueryList<IgxGridToolbarCustomContentDirective>;

    /**
     * @hidden
     * @internal
     */
    public get headSelectorTemplate(): TemplateRef<IgxHeadSelectorDirective> {
        if (this.headSelectorsTemplates && this.headSelectorsTemplates.first) {
            return this.headSelectorsTemplates.first.templateRef;
        }

        return null;
    }

    /**
     * @hidden
     * @internal
     */
    @ContentChildren(IgxHeadSelectorDirective, { read: IgxHeadSelectorDirective, descendants: false })
    public headSelectorsTemplates: QueryList<IgxHeadSelectorDirective>;

    /**
     * @hidden
     * @internal
     */
    get isPinningToStart() {
        return this.pinning.columns !== ColumnPinningPosition.End;
    }

    /**
     * @hidden
     * @internal
     */
    get isRowPinningToTop() {
        return this.pinning.rows !== RowPinningPosition.Bottom;
    }

    /**
     * @hidden
     * @internal
     */
    public get rowSelectorTemplate(): TemplateRef<IgxRowSelectorDirective> {
        if (this.rowSelectorsTemplates && this.rowSelectorsTemplates.first) {
            return this.rowSelectorsTemplates.first.templateRef;
        }

        return null;
    }

    /**
     * @hidden
     * @internal
     */
    @ContentChildren(IgxRowSelectorDirective, { read: IgxRowSelectorDirective, descendants: false })
    public rowSelectorsTemplates: QueryList<IgxRowSelectorDirective>;

    /**
     * @hidden
     * @internal
     */
    @ContentChildren(IgxRowDragGhostDirective, { read: TemplateRef, descendants: false })
    public dragGhostCustomTemplates: QueryList<TemplateRef<any>>;

    /**
     * @hidden @internal
     */
    @ViewChild('verticalScrollContainer', { read: IgxGridForOfDirective, static: true })
    public verticalScrollContainer: IgxGridForOfDirective<any>;

    /**
     * @hidden @internal
     */
    @ViewChild('verticalScrollHolder', { read: IgxGridForOfDirective, static: true })
    public verticalScroll: IgxGridForOfDirective<any>;

    /**
     * @hidden @internal
     */
    @ViewChild('scr', { read: ElementRef, static: true })
    public scr: ElementRef;

    /**
     * @hidden @internal
     */
    @ViewChild('footer', { read: ElementRef })
    public footer: ElementRef;

    /**
     * @hidden @internal
     */
    @ViewChild('hContainer', { read: IgxGridForOfDirective, static: true })
    public headerContainer: IgxGridForOfDirective<any>;

    /**
     * @hidden @internal
     */
    @ViewChild('headerSelectorContainer')
    public headerSelectorContainer: ElementRef;

    /**
     * @hidden @internal
     */
    @ViewChild('headerDragContainer')
    public headerDragContainer: ElementRef;

    /**
     * @hidden @internal
     */
    @ViewChild('headerGroupContainer')
    public headerGroupContainer: ElementRef;

    /**
     * @hidden @internal
     */
    @ViewChild('filteringRow', { read: IgxGridFilteringRowComponent })
    public filteringRow: IgxGridFilteringRowComponent;

    /**
     * @hidden @internal
     */
    @ViewChild('theadRow', { static: true })
    public theadRow: ElementRef;

    /**
     * @hidden @internal
     */
    @ViewChild('tbody', { static: true })
    public tbody: ElementRef;

    /**
     * @hidden @internal
     */
    @ViewChild('pinContainer', { read: ElementRef })
    public pinContainer: ElementRef;

    /**
     * @hidden @internal
     */
    @ViewChild('tfoot', { static: true })
    public tfoot: ElementRef;

    /**
     * @hidden @internal
     */
    @ViewChild('igxFilteringOverlayOutlet', { read: IgxOverlayOutletDirective, static: true })
    protected _outletDirective: IgxOverlayOutletDirective;

    /**
     * @hidden @internal
     */
    @ViewChild('igxRowEditingOverlayOutlet', { read: IgxOverlayOutletDirective, static: true })
    public rowEditingOutletDirective: IgxOverlayOutletDirective;

    /**
     * @hidden @internal
     */
    @ViewChildren(IgxTemplateOutletDirective, { read: IgxTemplateOutletDirective })
    public tmpOutlets: QueryList<any> = new QueryList<any>();


    /**
     * @hidden @internal
     */
    public get rowOutletDirective() {
        return this.rowEditingOutletDirective;
    }

    /**
     * @hidden @internal
     */
    public get parentRowOutletDirective() {
        return this.outlet;
    }

    /**
     * @hidden
     * @internal
     */
    @ViewChild('dragIndicatorIconBase', { read: TemplateRef, static: true })
    public dragIndicatorIconBase: TemplateRef<any>;

    /**
     * @hidden @internal
     */
    @ViewChild('defaultRowEditTemplate', { read: TemplateRef, static: true })
    private defaultRowEditTemplate: TemplateRef<any>;

    /**
     * @hidden @internal
     */
    @ContentChild(IgxRowEditTemplateDirective, { read: TemplateRef })
    public rowEditCustom: TemplateRef<any>;

    /**
     * @hidden @internal
     */
    public get rowEditContainer(): TemplateRef<any> {
        return this.rowEditCustom ? this.rowEditCustom : this.defaultRowEditTemplate;
    }
    /**
     * @hidden @internal
     */
    @ContentChild(IgxRowEditTextDirective, { read: TemplateRef })
    public rowEditText: TemplateRef<any>;

    /**
     * @hidden @internal
     */
    @ContentChild(IgxRowEditActionsDirective, { read: TemplateRef })
    public rowEditActions: TemplateRef<any>;


    /**
     * The custom template, if any, that should be used when rendering a row expand indicator.
     */
    @ContentChild(IgxRowExpandedIndicatorDirective, { read: TemplateRef })
    public rowExpandedIndicatorTemplate: TemplateRef<any> = null;

    /**
     * The custom template, if any, that should be used when rendering a row collapse indicator.
     */
    @ContentChild(IgxRowCollapsedIndicatorDirective, { read: TemplateRef })
    public rowCollapsedIndicatorTemplate: TemplateRef<any> = null;

    /**
     * The custom template, if any, that should be used when rendering a header expand indicator.
     */
    @ContentChild(IgxHeaderExpandIndicatorDirective, { read: TemplateRef })
    public headerExpandIndicatorTemplate: TemplateRef<any> = null;

    /**
     * The custom template, if any, that should be used when rendering a header collapse indicator.
     */
    @ContentChild(IgxHeaderCollapseIndicatorDirective, { read: TemplateRef })
    public headerCollapseIndicatorTemplate: TemplateRef<any> = null;

    /**
     * @hidden
     * @internal
     */
    @ContentChildren(IgxDragIndicatorIconDirective, { read: TemplateRef, descendants: false })
    public dragIndicatorIconTemplates: QueryList<TemplateRef<any>>;

    /**
     * The custom template, if any, that should be used when rendering the row drag indicator icon
     */
    public get dragIndicatorIconTemplate(): TemplateRef<any> {
        return this._customDragIndicatorIconTemplate || this.dragIndicatorIconTemplates.first;
    }

    public set dragIndicatorIconTemplate(val: TemplateRef<any>) {
        this._customDragIndicatorIconTemplate = val;
    }

    /**
     * @hidden @internal
     */
    public get rowInEditMode(): IgxRowDirective<IgxGridBaseDirective & GridType> {
        const editRowState = this.crudService.row;
        return editRowState !== null ? this.rowList.find(e => e.rowID === editRowState.id) : null;
    }

    /**
     * @hidden @internal
     */
    public get firstEditableColumnIndex(): number {
        const index = this.visibleColumns.filter(col => col.editable)
            .map(c => c.visibleIndex).sort((a, b) => a - b);
        return index.length ? index[0] : null;
    }

    /**
     * @hidden @internal
     */
    public get lastEditableColumnIndex(): number {
        const index = this.visibleColumns.filter(col => col.editable)
            .map(c => c.visibleIndex).sort((a, b) => a > b ? -1 : 1);
        return index.length ? index[0] : null;
    }

    /**
     * @hidden @internal
     */
    @ViewChildren(IgxRowEditTabStopDirective)
    public rowEditTabsDEFAULT: QueryList<IgxRowEditTabStopDirective>;

    /**
     * @hidden @internal
     */
    @ContentChildren(IgxRowEditTabStopDirective, { descendants: true })
    public rowEditTabsCUSTOM: QueryList<IgxRowEditTabStopDirective>;

    /**
     * @hidden @internal
     * TODO: Nav service logic doesn't handle 0 results from this querylist
     */
    public get rowEditTabs(): QueryList<IgxRowEditTabStopDirective> {
        return this.rowEditTabsCUSTOM.length ? this.rowEditTabsCUSTOM : this.rowEditTabsDEFAULT;
    }

    /**
     * @hidden @internal
     */
    @ViewChild(IgxToggleDirective)
    public rowEditingOverlay: IgxToggleDirective;

    /**
     * @hidden @internal
     */
    @HostBinding('attr.tabindex')
    public tabindex = 0;

    get activeDescendant() {
        const activeElem = this.navigation.activeNode;
        if (activeElem) {
            return !this.navigation.isDataRow(activeElem.row, true) ? this.id + '_' + activeElem.row :
                this.id + '_' + activeElem.row + '_' + activeElem.column;
        }
        return null;
    }

    /**
     * @hidden @internal
     */
    @HostBinding('attr.class')
    get hostClass(): string {
        const classes = [this.getComponentDensityClass('igx-grid')];
        // The custom classes should be at the end.
        classes.push(this.class);
        return classes.join(' ');
    }

    get bannerClass(): string {
        const position = this.rowEditPositioningStrategy.isTop ? 'igx-banner__border-top' : 'igx-banner__border-bottom';
        return `${this.getComponentDensityClass('igx-banner')} ${position}`;
    }

    /**
     * @hidden @internal
     */
    @HostBinding('attr.role')
    public hostRole = 'grid';

    /**
     * @hidden @internal
     */
    get pipeTrigger(): number {
        return this._pipeTrigger;
    }

    /**
     * @hidden @internal
     */
    get filteringPipeTrigger(): number {
        return this._filteringPipeTrigger;
    }

    /**
     * @hidden @internal
     */
    get summaryPipeTrigger(): number {
        return this._summaryPipeTrigger;
    }

    /**
     * Gets/Sets the sorting state.
     * @remarks
     * Supports two-way data binding.
     * @example
     * ```html
     * <igx-grid #grid [data]="Data" [autoGenerate]="true" [(sortingExpressions)]="model.sortingExpressions"></igx-grid>
     * ```
     */
    @WatchChanges()
    @Input()
    get sortingExpressions(): ISortingExpression[] {
        return this._sortingExpressions;
    }

    set sortingExpressions(value: ISortingExpression[]) {
        this._sortingExpressions = cloneArray(value);
        this.sortingExpressionsChange.emit(this._sortingExpressions);
        this.notifyChanges();
    }

    /**
     * Emitted before sorting is performed.
     * @remarks
     * Returns the sorting expressions.
     * @example
     * ```html
     * <igx-grid #grid [data]="localData" [autoGenerate]="true" (sortingExpressionsChange)="sortingExprChange($event)"></igx-grid>
     * ```
     */
    @Output()
    public sortingExpressionsChange = new EventEmitter<ISortingExpression[]>();

    /**
     * @hidden @internal
     */
    get maxLevelHeaderDepth() {
        if (this._maxLevelHeaderDepth === null) {
            this._maxLevelHeaderDepth = this.hasColumnLayouts ?
                this.columnList.reduce((acc, col) => Math.max(acc, col.rowStart), 0) :
                this.columnList.reduce((acc, col) => Math.max(acc, col.level), 0);
        }
        return this._maxLevelHeaderDepth;
    }

    /**
     * Gets the number of hidden columns.
     * @example
     * ```typescript
     * const hiddenCol = this.grid.hiddenColumnsCount;
     * ``
     */
    get hiddenColumnsCount() {
        return this.columnList.filter((col) => col.columnGroup === false && col.hidden === true).length;
    }

    /**
     * Gets/Sets the text to be displayed inside the toggle button.
     * @remarks
     * Used for the built-in column hiding UI of the`IgxColumnComponent`.
     * @example
     * ```html
     * <igx-grid [columnHiding]="true" [showToolbar]="true" [hiddenColumnsText]="'Hidden Columns'"></igx-grid>
     * ```
     */
    @WatchChanges()
    @Input()
    get hiddenColumnsText() {
        return this._hiddenColumnsText;
    }

    set hiddenColumnsText(value) {
        this._hiddenColumnsText = value;

    }

    /**
     * Gets/Sets the text to be displayed inside the toggle button.
     * @remarks
     * Used for the built-in column pinning UI of the`IgxColumnComponent`.
     * @example
     * ```html
     * <igx-grid [pinnedColumnsText]="'PinnedCols Text" [data]="data" [width]="'100%'" [height]="'500px'"></igx-grid>
     * ```
     */
    @WatchChanges()
    @Input()
    get pinnedColumnsText() {
        return this._pinnedColumnsText;
    }
    set pinnedColumnsText(value) {
        this._pinnedColumnsText = value;
    }

    /**
     * Get transactions service for the grid.
     */
    get transactions(): TransactionService<Transaction, State> {
        return this._transactions;
    }

    /**
     * @hidden @internal
     */
    public columnsWithNoSetWidths = null;

    /* Toolbar related definitions */
    private _showToolbar = false;
    private _exportExcel = false;
    private _exportCsv = false;
    private _toolbarTitle: string = null;
    private _exportText: string = null;
    private _exportExcelText: string = null;
    private _exportCsvText: string = null;
    private _rowEditable = false;
    private _currentRowState: any;
    private _filteredSortedData = null;
    /**
     * @hidden @internal
     */
    public get currentRowState(): any {
        return this._currentRowState;
    }

    /**
     * Provides access to the `IgxToolbarComponent`.
     * @example
     * ```typescript
     * const gridToolbar = this.grid.toolbar;
     * ```
     */
    @ViewChild('toolbar', { read: IgxGridToolbarComponent })
    public toolbar: IgxGridToolbarComponent = null;

    @ViewChild('toolbar', { read: ElementRef })
    private toolbarHtml: ElementRef = null;

    /**
     * Gets/Sets whether the toolbar is shown.
     * @example
     * ```html
     * <igx-grid [data]="localData" [showToolbar]="true" [autoGenerate]="true" ></igx-grid>
     * ```
     */
    @WatchChanges()
    @Input()
    public get showToolbar(): boolean {
        return this._showToolbar;
    }
    public set showToolbar(newValue: boolean) {
        if (this._showToolbar !== newValue) {
            this._showToolbar = newValue;
            if (!this._init) {
                this.notifyChanges(true);
            }
        }
    }

    /**
     * Gets/Sets the toolbar's title.
     * @example
     * ```html
     * <igx-grid [data]="localData" [showToolbar]="true" [autoGenerate]="true" [toolbarTitle]="'My Grid'"></igx-grid>
     * ```
     */
    @WatchChanges()
    @Input()
    public get toolbarTitle(): string {
        return this._toolbarTitle;
    }

    public set toolbarTitle(newValue: string) {
        if (this._toolbarTitle !== newValue) {
            this._toolbarTitle = newValue;
            if (!this._init) {
                this.notifyChanges(true);
            }
        }
    }

    /**
     * Gets/Sets whether exporting to MS Excel is enabled or disabled.
     * @example
     * ```html
     * <igx-grid [data]="localData" [showToolbar]="true" [autoGenerate]="true" [exportExcel]="true"></igx-grid>
     * ```
     */
    @WatchChanges()
    @Input()
    public get exportExcel(): boolean {
        return this.getExportExcel();
    }

    public set exportExcel(newValue: boolean) {
        if (this._exportExcel !== newValue) {
            this._exportExcel = newValue;
            if (!this._init) {
                this.notifyChanges(true);
            }
        }
    }

    /**
     * Gets/Sets whether the option for exporting to CSV is enabled or disabled.
     * ```html
     * <igx-grid [data]="localData" [showToolbar]="true" [autoGenerate]="true" [exportCsv]="true"></igx-grid>
     * ```
     */
    @WatchChanges()
    @Input()
    public get exportCsv(): boolean {
        return this.getExportCsv();
    }
    public set exportCsv(newValue: boolean) {
        if (this._exportCsv !== newValue) {
            this._exportCsv = newValue;
            if (!this._init) {
                this.notifyChanges(true);
            }
        }
    }

    /**
     * Gets/Sets the textual content for the main export button.
     * @example
     * ```html
     * <igx-grid [data]="localData" [showToolbar]="true" [exportText]="'My Exporter'" [exportCsv]="true"></igx-grid>
     * ```
     */
    @WatchChanges()
    @Input()
    public get exportText(): string {
        return this._exportText;
    }

    public set exportText(newValue: string) {
        if (this._exportText !== newValue) {
            this._exportText = newValue;
            if (!this._init) {
                this.notifyChanges(true);
            }
        }
    }

    /**
     * Gets/Sets the textual content for the MS Excel export button.
     * ```html
     * <igx-grid [exportExcelText]="'My Excel Exporter" [showToolbar]="true" [exportText]="'My Exporter'" [exportCsv]="true"></igx-grid>
     * ```
     */
    @WatchChanges()
    @Input()
    public get exportExcelText(): string {
        return this._exportExcelText;
    }
    public set exportExcelText(newValue: string) {
        if (this._exportExcelText !== newValue) {
            this._exportExcelText = newValue;
            if (!this._init) {
                this.notifyChanges(true);
            }
        }
    }

    /**
     * Gets/Sets the textual content for the CSV export button.
     * @example
     * ```html
     * <igx-grid [exportCsvText]="'My Csv Exporter" [showToolbar]="true" [exportText]="'My Exporter'" [exportExcel]="true"></igx-grid>
     * ```
     */
    @WatchChanges()
    @Input()
    public get exportCsvText(): string {
        return this._exportCsvText;
    }
    public set exportCsvText(newValue: string) {
        if (this._exportCsvText !== newValue) {
            this._exportCsvText = newValue;
            if (!this._init) {
                this.notifyChanges(true);
            }
        }
    }

    /**
     * Controls the copy behavior of the grid.
     */
    @Input()
    clipboardOptions = {
        /**
         * Enables/disables the copy behavior
         */
        enabled: true,
        /**
         * Include the columns headers in the clipboard output.
         */
        copyHeaders: true,
        /**
         * Apply the columns formatters (if any) on the data in the clipboard output.
         */
        copyFormatters: true,
        /**
         * The separator used for formatting the copy output. Defaults to `\t`.
         */
        separator: '\t'
    };

    /**
     * Gets/Sets cell selection mode.
     * @remarks
     * By default the cell selection mode is multiple
     * @param selectionMode: GridSelectionMode
     */
    @WatchChanges()
    @Input()
    get cellSelection() {
        return this._cellSelectionMode;
    }

    set cellSelection(selectionMode: GridSelectionMode) {
        this._cellSelectionMode = selectionMode;
        if (this.gridAPI.grid) {
            this.selectionService.clear(true);
            this.notifyChanges();
        }
    }

    /**
     * Gets/Sets row selection mode
     * @remarks
     * By default the row selection mode is none
     * @param selectionMode: GridSelectionMode
     */
    @WatchChanges()
    @Input()
    get rowSelection() {
        return this._rowSelectionMode;
    }

    set rowSelection(selectionMode: GridSelectionMode) {
        this._rowSelectionMode = selectionMode;
        if (this.gridAPI.grid && this.columnList) {
            this.selectionService.clearAllSelectedRows();
            this.notifyChanges(true);
        }
    }

    /**
     * Gets/Sets column selection mode
     * @remarks
     * By default the row selection mode is none
     * @param selectionMode: GridSelectionMode
     */
    @WatchChanges()
    @Input()
    get columnSelection() {
        return this._columnSelectionMode;
    }

    set columnSelection(selectionMode: GridSelectionMode) {
        this._columnSelectionMode = selectionMode;
        if (this.gridAPI.grid) {
            this.selectionService.clearAllSelectedColumns();
            this.notifyChanges(true);
        }
    }

    /**
     * @hidden @internal
     */
    public rowEditMessage;

    /**
     * Emitted when an export process is initiated by the user.
     * @example
     * ```typescript
     * toolbarExporting(event: IGridToolbarExportEventArgs){
     *     const toolbarExporting = event;
     * }
     * ```
     */
    @Output()
    public onToolbarExporting = new EventEmitter<IGridToolbarExportEventArgs>();

    /* End of toolbar related definitions */

    /**
     * Emitted when making a range selection.
     * @remarks
     * Range selection can be made either through drag selection or through keyboard selection.
     */
    @Output()
    onRangeSelection = new EventEmitter<GridSelectionRange>();

    /**
     * @hidden @internal
     */
    public pagingState;
    /**
     * @hidden @internal
     */
    public calcWidth: number;
    /**
     * @hidden @internal
     */
    public calcHeight = 0;
    /**
     * @hidden @internal
     */
    public tfootHeight: number;
    /**
     * @hidden @internal
     */
    public chipsGoupingExpressions = [];
    /**
     * @hidden @internal
     */
    public summariesHeight: number;

    /**
     * @hidden @internal
     */
    public draggedColumn: IgxColumnComponent;


    /**
     * @hidden @internal
     */
    public disableTransitions = false;

    /**
     * @hidden @internal
     */
    public lastSearchInfo: ISearchInfo = {
        searchText: '',
        caseSensitive: false,
        exactMatch: false,
        activeMatchIndex: 0,
        matchInfoCache: []
    };

    /**
     * @hidden @internal
     */
    public columnWidthSetByUser = false;

    /**
     * @hidden @internal
     */
    public pinnedRecords: any[];

    /**
     * @hidden @internal
     */
    public unpinnedRecords: any[];

    data: any[];
    filteredData: any[];

    /**
     * @hidden
     */
    protected destroy$ = new Subject<any>();

    protected _filteredSortedPinnedData: any[];
    protected _filteredSortedUnpinnedData: any[];
    protected _filteredPinnedData: any[];

    /**
     * @hidden
     */
    public _filteredUnpinnedData;

    /**
     * @hidden
     */
    protected _perPage = 15;
    /**
     * @hidden
     */
    protected _page = 0;
    /**
     * @hidden
     */
    protected _paging = false;
    /**
     * @hidden
     */
    protected _pagingMode = GridPagingMode.local;
    /**
     * @hidden @internal
     */
    public _totalRecords = -1;
    /**
     * @hidden
     */
    protected _hideRowSelectors = false;
    /**
     * @hidden
     */
    protected _rowDrag = false;
    /**
     * @hidden
     */
    protected _pipeTrigger = 0;
    /**
     * @hidden
     */
    protected _filteringPipeTrigger = 0;
    /**
     * @hidden
     */
    protected _summaryPipeTrigger = 0;
    /**
     * @hidden
     */
    protected _columns: IgxColumnComponent[] = [];
    /**
     * @hidden
     */
    protected _pinnedColumns: IgxColumnComponent[] = [];
    /**
     * @hidden
     */
    protected _unpinnedColumns: IgxColumnComponent[] = [];
    /**
     * @hidden
     */
    protected _filteringExpressionsTree: IFilteringExpressionsTree = new FilteringExpressionsTree(FilteringLogic.And);
    /**
     * @hidden
     */
    protected _advancedFilteringExpressionsTree: IFilteringExpressionsTree;
    /**
     * @hidden
     */
    protected _sortingExpressions: Array<ISortingExpression> = [];
    /**
     * @hidden
     */
    protected _maxLevelHeaderDepth = null;
    /**
     * @hidden
     */
    protected _columnHiding = false;
    /**
     * @hidden
     */
    protected _columnPinning = false;

    protected _pinnedRecordIDs = [];

    /**
     * @hidden
     */
    protected _hasVisibleColumns;
    protected _allowFiltering = false;
    protected _allowAdvancedFiltering = false;
    protected _filterMode = FilterMode.quickFilter;

    protected observer: ResizeObserver = new ResizeObserver(() => { });

    protected resizeNotify = new Subject();


    private columnListDiffer;
    private rowListDiffer;
    private _hiddenColumnsText = '';
    private _pinnedColumnsText = '';
    private _height = '100%';
    private _width = '100%';
    private _rowHeight;
    protected _baseFontSize: number;
    private _horizontalForOfs: Array<IgxGridForOfDirective<any>> = [];
    private _multiRowLayoutRowSize = 1;
    protected _loadingId;
    protected _expansionStates: Map<any, boolean> = new Map<any, boolean>();
    protected _defaultExpandState = false;
    // Caches
    private _totalWidth = NaN;
    private _pinnedVisible = [];
    private _unpinnedVisible = [];
    private _pinnedWidth = NaN;
    private _unpinnedWidth = NaN;
    private _visibleColumns = [];
    private _columnGroups = false;
    private _autoGeneratedCols = [];
    protected _headerFeaturesWidth = NaN;

    private _columnWidth: string;

    protected _defaultTargetRecordNumber = 10;

    private _summaryPosition = GridSummaryPosition.bottom;
    private _summaryCalculationMode = GridSummaryCalculationMode.rootAndChildLevels;
    private _cellSelectionMode = GridSelectionMode.multiple;
    private _rowSelectionMode = GridSelectionMode.none;
    private _columnSelectionMode = GridSelectionMode.none;

    private rowEditPositioningStrategy = new RowEditPositionStrategy({
        horizontalDirection: HorizontalAlignment.Right,
        verticalDirection: VerticalAlignment.Bottom,
        horizontalStartPoint: HorizontalAlignment.Left,
        verticalStartPoint: VerticalAlignment.Bottom,
        closeAnimation: null
    });

    private rowEditSettings = {
        scrollStrategy: new AbsoluteScrollStrategy(),
        modal: false,
        closeOnOutsideClick: false,
        outlet: this.rowOutletDirective,
        positionStrategy: this.rowEditPositioningStrategy
    };

    private verticalScrollHandler = (event) => {
        this.verticalScrollContainer.onScroll(event);
        this.disableTransitions = true;

        this.zone.run(() => {
            this.zone.onStable.pipe(first()).subscribe(() => {
                this.verticalScrollContainer.onChunkLoad.emit(this.verticalScrollContainer.state);
                if (this.rowEditable) {
                    this.changeRowEditingOverlayStateOnScroll(this.rowInEditMode);
                }
            });
        });
        this.disableTransitions = false;

        this.hideOverlays();
    }

    private horizontalScrollHandler = (event) => {
        const scrollLeft = event.target.scrollLeft;
        this.headerContainer.onHScroll(scrollLeft);
        this._horizontalForOfs.forEach(vfor => vfor.onHScroll(scrollLeft));
        this.cdr.markForCheck();

        this.zone.run(() => {
            this.zone.onStable.pipe(first()).subscribe(() => {
                this.parentVirtDir.onChunkLoad.emit(this.headerContainer.state);
            });
        });

        this.hideOverlays();
    }

    /**
     * @hidden
     * @internal
     */
    public get headerFeaturesWidth() {
        return this._headerFeaturesWidth;
    }

    /**
     * @hidden
     * @internal
     */
    public isDetailRecord(rec) {
        return false;
    }

    /**
     * @hidden
     * @internal
     */
    public isGroupByRecord(rec) {
        return false;
    }

    /**
     * @hidden @internal
     */
    public isGhostRecord(record: any): boolean {
        return record.ghostRecord !== undefined;
    }

    /**
     * @hidden
     * Returns the row index of a row that takes into account the full view data like pinning.
     */
    public getDataViewIndex(rowIndex, pinned) {
        if (pinned && !this.isRowPinningToTop) {
            rowIndex = rowIndex + this.unpinnedDataView.length;
        } else if (!pinned && this.isRowPinningToTop) {
            rowIndex = rowIndex + this.pinnedDataView.length;
        }
        return rowIndex;
    }

    /**
     * @hidden
     * @internal
     */
    public get hasDetails() {
        return false;
    }

    /**
     * Returns the state of the grid virtualization.
     * @remarks
     * Includes the start index and how many records are rendered.
     * @example
     * ```typescript
     * const gridVirtState = this.grid1.virtualizationState;
     * ```
     */
    get virtualizationState() {
        return this.verticalScrollContainer.state;
    }

    /**
     * @hidden
     */
    set virtualizationState(state) {
        this.verticalScrollContainer.state = state;
    }

    /**
     * @hidden
     * @internal
     */
    public hideOverlays() {
        this.overlayIDs.forEach(overlayID => {
            this.overlayService.hide(overlayID);
            this.overlayService.onClosed.pipe(
                filter(o => o.id === overlayID),
                takeUntil(this.destroy$)).subscribe(() => {
                    this.nativeElement.focus();
                });
        });
    }

    /**
     * Returns whether the record is pinned or not.
     *
     * @param rowIndex Index of the record in the `dataView` collection.
     *
     * @hidden
     * @internal
     */
    public isRecordPinnedByViewIndex(rowIndex: number) {
        return this.hasPinnedRecords && (this.isRowPinningToTop && rowIndex < this.pinnedDataView.length) ||
            (!this.isRowPinningToTop && rowIndex >= this.unpinnedDataView.length);
    }

    /**
     * Returns whether the record is pinned or not.
     *
     * @param rowIndex Index of the record in the `filteredSortedData` collection.
     */
    public isRecordPinnedByIndex(rowIndex: number) {
        return this.hasPinnedRecords && (this.isRowPinningToTop && rowIndex < this._filteredSortedPinnedData.length) ||
            (!this.isRowPinningToTop && rowIndex >= this._filteredSortedUnpinnedData.length);
    }

    /**
     * @hidden
     * @internal
     */
    public isRecordPinned(rec) {
        return this.getInitialPinnedIndex(rec) !== -1;
    }

    /**
     * @hidden
     * @internal
     * Returns the record index in order of pinning by the user. Does not consider sorting/filtering.
     */
    public getInitialPinnedIndex(rec) {
        const id = this.gridAPI.get_row_id(rec);
        return this._pinnedRecordIDs.indexOf(id);
    }

    /**
     * @hidden
     * @internal
     */
    public get hasPinnedRecords() {
        return this._pinnedRecordIDs.length > 0;
    }

    /**
     * @hidden
     * @internal
     */
    public get pinnedRecordsCount() {
        return this._pinnedRecordIDs.length;
    }

    constructor(
        public selectionService: IgxGridSelectionService,
        public crudService: IgxGridCRUDService,
        public colResizingService: IgxColumnResizingService,
        public gridAPI: GridBaseAPIService<IgxGridBaseDirective & GridType>,
        @Inject(IgxGridTransaction) protected _transactions: TransactionService<Transaction, State>,
        private elementRef: ElementRef,
        private zone: NgZone,
        @Inject(DOCUMENT) public document,
        public cdr: ChangeDetectorRef,
        protected resolver: ComponentFactoryResolver,
        protected differs: IterableDiffers,
        protected viewRef: ViewContainerRef,
        public navigation: IgxGridNavigationService,
        public filteringService: IgxFilteringService,
        @Inject(IgxOverlayService) protected overlayService: IgxOverlayService,
        public summaryService: IgxGridSummaryService,
        @Optional() @Inject(DisplayDensityToken) protected _displayDensityOptions: IDisplayDensityOptions) {
        super(_displayDensityOptions);
        this.cdr.detach();
    }

    _setupServices() {
        this.gridAPI.grid = this;
        this.crudService.grid = this;
        this.selectionService.grid = this;
        this.navigation.grid = this;
        this.filteringService.grid = this;
        this.summaryService.grid = this;
    }

    _setupListeners() {
        const destructor = takeUntil<any>(this.destroy$);
        this.onRowAdded.pipe(destructor).subscribe(args => this.refreshGridState(args));
        this.onRowDeleted.pipe(destructor).subscribe(args => {
            this.summaryService.deleteOperation = true;
            this.summaryService.clearSummaryCache(args);
        });

        this.transactions.onStateUpdate.pipe(destructor).subscribe(() => {
            this.selectionService.clearHeaderCBState();
            this.summaryService.clearSummaryCache();
            this._pipeTrigger++;
            this.notifyChanges();
        });

        this.resizeNotify.pipe(destructor, filter(() => !this._init),  throttleTime(100, undefined, {leading: true, trailing: true}))
            .subscribe(() => {
                this.zone.run(() => {
                    this.notifyChanges(true);
                });
            });

        this.onPagingDone.pipe(destructor).subscribe(() => {
            this.endEdit(true);
            this.selectionService.clear(true);
        });

        this.onColumnMoving.pipe(destructor).subscribe(() => this.endEdit(true));
        this.onColumnResized.pipe(destructor).subscribe(() => this.endEdit(true));

        this.overlayService.onOpening.pipe(destructor).subscribe((event) => {
            if (this._advancedFilteringOverlayId === event.id) {
                const instance = event.componentRef.instance as IgxAdvancedFilteringDialogComponent;
                if (instance) {
                    instance.initialize(this, this.overlayService, event.id);
                }
            }
        });

        this.overlayService.onOpened.pipe(destructor).subscribe((event) => {
            // do not hide the advanced filtering overlay on scroll
            if (this._advancedFilteringOverlayId === event.id) {
                const instance = event.componentRef.instance as IgxAdvancedFilteringDialogComponent;
                if (instance) {
                    instance.setAddButtonFocus();
                }
                return;
            }

            if (this.overlayService.getOverlayById(event.id)?.settings?.outlet === this.outlet &&
                this.overlayIDs.indexOf(event.id) < 0) {
                this.overlayIDs.push(event.id);
            }
        });

        this.overlayService.onClosed.pipe(destructor, filter(() => !this._init)).subscribe((event) => {
            if (this._advancedFilteringOverlayId === event.id) {
                this._advancedFilteringOverlayId = null;
                return;
            }

            const ind = this.overlayIDs.indexOf(event.id);
            if (ind !== -1) {
                this.overlayIDs.splice(ind, 1);
            }
        });

        this.verticalScrollContainer.onDataChanging.pipe(destructor, filter(() => !this._init)).subscribe(($event) => {
            const shouldRecalcSize = this.isPercentHeight &&
                (!this.calcHeight || this.calcHeight === this.getDataBasedBodyHeight() ||
                    this.calcHeight === this.renderedRowHeight * this._defaultTargetRecordNumber);
            if (shouldRecalcSize) {
                this.calculateGridHeight();
                $event.containerSize = this.calcHeight;
            }
            this.evaluateLoadingState();
        });

        this.verticalScrollContainer.onScrollbarVisibilityChanged.pipe(destructor, filter(() => !this._init)).subscribe(() => {
            // called to recalc all widths that may have changes as a result of
            // the vert. scrollbar showing/hiding
            this.notifyChanges(true);
        });

        this.verticalScrollContainer.onContentSizeChange.pipe(destructor, filter(() => !this._init)).subscribe(($event) => {
            this.calculateGridSizes(false);
        });

        this.onDensityChanged.pipe(destructor).subscribe(() => {
            this.endEdit(true);
            this.summaryService.summaryHeight = 0;
            this.notifyChanges(true);
        });
    }

    /**
     * @hidden
     */
    public ngOnInit() {
        super.ngOnInit();
        this._setupServices();
        this._setupListeners();
        this.rowListDiffer = this.differs.find([]).create(null);
        this.columnListDiffer = this.differs.find([]).create(null);
        this.calcWidth = this.width && this.width.indexOf('%') === -1 ? parseInt(this.width, 10) : 0;
        this.shouldGenerate = this.autoGenerate;
    }

    protected setupColumns() {
        if (this.autoGenerate) {
            this.autogenerateColumns();
        }

        this.initColumns(this.columnList, (col: IgxColumnComponent) => this.onColumnInit.emit(col));
        this.columnListDiffer.diff(this.columnList);

        this.columnList.changes
            .pipe(takeUntil(this.destroy$))
            .subscribe((change: QueryList<IgxColumnComponent>) => {
                this.onColumnsChanged(change);
            });
    }

    /**
     * @hidden
     * @internal
     */
    public resetColumnsCaches() {
        this.columnList.forEach(column => column.resetCaches());
    }

    /**
     * @hidden
     * @internal
     */
    public resetForOfCache() {
        const firstVirtRow = this.dataRowList.first;
        if (firstVirtRow) {
            if (this._cdrRequests) {
                firstVirtRow.virtDirRow.cdr.detectChanges();
            }
            firstVirtRow.virtDirRow.assumeMaster();
        }
    }

    /**
     * @hidden
     * @internal
     */
    public setFilteredData(data, pinned: boolean) {
        if (this.hasPinnedRecords && pinned) {
            this._filteredPinnedData = data || [];
            const filteredUnpinned =  this._filteredUnpinnedData || [];
            const filteredData =  [... this._filteredPinnedData, ... filteredUnpinned];
            this.filteredData =  filteredData.length > 0 ? filteredData : this._filteredUnpinnedData;
        } else if (this.hasPinnedRecords && !pinned) {
            this._filteredUnpinnedData = data;
        } else {
            this.filteredData = data;
        }
    }

    /**
     * @hidden
     * @internal
     */
    public resetColumnCollections() {
        this._visibleColumns.length = 0;
        this._pinnedVisible.length = 0;
        this._unpinnedVisible.length = 0;
    }

    /**
     * @hidden
     * @internal
     */
    public resetCachedWidths() {
        this._unpinnedWidth = NaN;
        this._pinnedWidth = NaN;
        this._totalWidth = NaN;
    }

    /**
     * @hidden
     * @internal
     */
    public resetCaches(recalcFeatureWidth = true) {
        if (recalcFeatureWidth) {
            this._headerFeaturesWidth = NaN;
        }
        this.resetForOfCache();
        this.resetColumnsCaches();
        this.resetColumnCollections();
        this.resetCachedWidths();
        this.hasVisibleColumns = undefined;
        this._columnGroups = this.columnList.some(col => col.columnGroup);
    }

    /**
     * @hidden
     */
    public ngAfterContentInit() {
        this.setupColumns();
    }

    /**
     * @hidden
     * @internal
     */
    public setFilteredSortedData(data, pinned: boolean) {
        data = data || [];
        if (this.pinnedRecordsCount > 0 && pinned) {
            this._filteredSortedPinnedData = data;
            this.pinnedRecords = data;
            this._filteredSortedData = this.isRowPinningToTop ? [... this._filteredSortedPinnedData, ... this._filteredSortedUnpinnedData] :
            [... this._filteredSortedUnpinnedData, ... this._filteredSortedPinnedData];
            this.refreshSearch(true, false);
        } else if (this.pinnedRecordsCount > 0 && !pinned) {
            this._filteredSortedUnpinnedData = data;
        } else {
            this._filteredSortedData = data;
            this.refreshSearch(true, false);
        }
    }

    /**
     * @hidden @internal
     */
    public _setupRowObservers() {
        const elementFilter = (item: IgxRowDirective<any> | IgxSummaryRowComponent) => this.isDefined(item.nativeElement.parentElement);
        const extractForOfs = pipe(map((collection: any[]) => collection.filter(elementFilter).map(item => item.virtDirRow)));
        const rowListObserver = extractForOfs(this._dataRowList.changes);
        const summaryRowObserver = extractForOfs(this._summaryRowList.changes);
        const resetHorizontalForOfs = () => {
            this._horizontalForOfs = [
                ...this._dataRowList.filter(elementFilter).map(item => item.virtDirRow),
                ...this._summaryRowList.filter(elementFilter).map(item => item.virtDirRow)
            ];
        };
        rowListObserver.pipe(takeUntil(this.destroy$)).subscribe(resetHorizontalForOfs);
        summaryRowObserver.pipe(takeUntil(this.destroy$)).subscribe(resetHorizontalForOfs);
        resetHorizontalForOfs();
    }

    /**
     * @hidden @internal
     */
    public _zoneBegoneListeners() {
        this.zone.runOutsideAngular(() => {
            this.verticalScrollContainer.getScroll().addEventListener('scroll', this.verticalScrollHandler);
            this.headerContainer.getScroll().addEventListener('scroll', this.horizontalScrollHandler);
            this.observer = new ResizeObserver(() => this.resizeNotify.next());
            this.observer.observe(this.nativeElement);
        });
    }

    /**
     * @hidden
     */
    public ngAfterViewInit() {
        this.initPinning();
        this.calculateGridSizes();
        this._init = false;
        this.cdr.reattach();
        this._setupRowObservers();
        this._zoneBegoneListeners();

        const vertScrDC = this.verticalScrollContainer.displayContainer;
        vertScrDC.addEventListener('scroll', this.preventContainerScroll);

        this._pinnedRowList.changes
        .pipe(takeUntil(this.destroy$))
        .subscribe((change: QueryList<IgxGridRowComponent>) => {
            this.onPinnedRowsChanged(change);
        });
    }

    /**
     * @hidden @internal
     */
    public notifyChanges(repaint = false) {
        this._cdrRequests = true;
        this._cdrRequestRepaint = repaint;
        this.cdr.markForCheck();
    }

    protected resetNotifyChanges() {
        this._cdrRequestRepaint = false;
        this._cdrRequests = false;
    }

    /**
     * @hidden @internal
     */
    public ngDoCheck() {
        super.ngDoCheck();
        if (this._init) {
            return;
        }

        if (this._cdrRequestRepaint) {
            this.resetNotifyChanges();
            this.calculateGridSizes();
            this.refreshSearch(true);
            return;
        }

        if (this._cdrRequests) {
            this.resetNotifyChanges();
            this.cdr.detectChanges();
        }
    }

    /**
     * @hidden
     * @internal
     */
    public getDragGhostCustomTemplate() {
        if (this.dragGhostCustomTemplates && this.dragGhostCustomTemplates.first) {
            return this.dragGhostCustomTemplates.first;
        }

        return null;
    }

    /**
     * @hidden @internal
     */
    public ngOnDestroy() {
        this.tmpOutlets.forEach((tmplOutlet) => {
            tmplOutlet.cleanCache();
        });

        this.destroy$.next(true);
        this.destroy$.complete();
        this._destroyed = true;

        if (this._advancedFilteringOverlayId) {
            this.overlayService.hide(this._advancedFilteringOverlayId);
        }

        this.zone.runOutsideAngular(() => {
            this.observer.disconnect();
            this.verticalScrollContainer.getScroll().removeEventListener('scroll', this.verticalScrollHandler);
            this.headerContainer.getScroll().removeEventListener('scroll', this.horizontalScrollHandler);
            const vertScrDC = this.verticalScrollContainer.displayContainer;
            vertScrDC.removeEventListener('scroll', this.preventContainerScroll);
        });
    }

    /**
     * @hidden @internal
     */
    public dataLoading(event) {
        this.onDataPreLoad.emit(event);
    }

    /**
     * Toggles the specified column's visibility.
     * @example
     * ```typescript
     * this.grid1.toggleColumnVisibility({
     *       column: this.grid1.columns[0],
     *       newValue: true
     * });
     * ```
     */
    public toggleColumnVisibility(args: IColumnVisibilityChangedEventArgs) {
        const col = args.column ? this.columnList.find((c) => c === args.column) : undefined;

        if (!col) {
            return;
        }

        col.hidden = args.newValue;
        this.onColumnVisibilityChanged.emit(args);
    }

    /**
     * Gets/Sets a list of key-value pairs [row ID, expansion state].
     * @remarks
     * Includes only states that differ from the default one.
     * Supports two-way binding.
     * @example
     * ```html
     * <igx-grid #grid [data]="data" [(expansionStates)]="model.expansionStates">
     * </igx-grid>
     * ```
     */
    @Input()
    public get expansionStates() {
        return this._expansionStates;
    }

    public set expansionStates(value) {
        this._expansionStates = new Map<any, boolean>(value);
        this.expansionStatesChange.emit(this._expansionStates);
        this.notifyChanges(true);
        if (this.gridAPI.grid) {
            this.cdr.detectChanges();
        }
    }

    /**
     * Expands all rows.
     * @example
     * ```typescript
     * this.grid.expandAll();
     * ```
     */
    public expandAll() {
        this._defaultExpandState = true;
        this.expansionStates = new Map<any, boolean>();
    }

    /**
     * Collapses all rows.
     * @example
     * ```typescript
     * this.grid.collapseAll();
     * ```
     */
    public collapseAll() {
        this._defaultExpandState = false;
        this.expansionStates = new Map<any, boolean>();
    }

    /**
     * Expands the row by its id.
     * @remarks
     * ID is either the primaryKey value or the data record instance.
     * @example
     * ```typescript
     * this.grid.expandRow(rowID);
     * ```
     * @param rowID The row id - primaryKey value or the data record instance.
     */
    public expandRow(rowID: any) {
        this.gridAPI.set_row_expansion_state(rowID, true);
    }

    /**
     * Collapses the row by its id.
     * @remarks
     * ID is either the primaryKey value or the data record instance.
     * @example
     * ```typescript
     * this.grid.collapseRow(rowID);
     * ```
     * @param rowID The row id - primaryKey value or the data record instance.
     */
    public collapseRow(rowID: any) {
        this.gridAPI.set_row_expansion_state(rowID, false);
    }


    /**
     * Toggles the row by its id.
     * @remarks
     * ID is either the primaryKey value or the data record instance.
     * @example
     * ```typescript
     * this.grid.toggleRow(rowID);
     * ```
     * @param rowID The row id - primaryKey value or the data record instance.
     */
    public toggleRow(rowID: any) {
        const rec = this.gridAPI.get_rec_by_id(rowID);
        const state = this.gridAPI.get_row_expansion_state(rec);
        this.gridAPI.set_row_expansion_state(rowID, !state);
    }

    /**
     * @hidden
     * @internal
     */
    public getDefaultExpandState(rec: any) {
        return this._defaultExpandState;
    }

    /**
     * Gets the native element.
     * @example
     * ```typescript
     * const nativeEl = this.grid.nativeElement.
     * ```
     */
    get nativeElement() {
        return this.elementRef.nativeElement;
    }

    /**
     * Gets/Sets the outlet used to attach the grid's overlays to.
     * @remark
     * If set, returns the outlet defined outside the grid. Otherwise returns the grid's internal outlet directive.
     */
    @Input()
    get outlet() {
        return this.resolveOutlet();
    }

    set outlet(val: IgxOverlayOutletDirective) {
        this._userOutletDirective = val;
    }

    protected resolveOutlet() {
        return this._userOutletDirective ? this._userOutletDirective : this._outletDirective;
    }


    /**
     * Gets the default row height.
     * @example
     * ```typescript
     * const rowHeigh = this.grid.defaultRowHeight;
     * ```
     */
    get defaultRowHeight(): number {
        switch (this.displayDensity) {
            case DisplayDensity.cosy:
                return 40;
            case DisplayDensity.compact:
                return 32;
            default:
                return 50;
        }
    }

    /**
     * @hidden @internal
     */
    get defaultSummaryHeight(): number {
        switch (this.displayDensity) {
            case DisplayDensity.cosy:
                return 30;
            case DisplayDensity.compact:
                return 24;
            default:
                return 36;
        }
    }

    /**
     * Returns the `IgxGridHeaderGroupComponent`'s minimum allowed width.
     * @remarks
     * Used internally for restricting header group component width.
     * The values below depend on the header cell default right/left padding values.
     */
    get defaultHeaderGroupMinWidth(): number {
        switch (this.displayDensity) {
            case DisplayDensity.cosy:
                return 32;
            case DisplayDensity.compact:
                return 24;
            default:
                return 48;
        }
    }

    /**
     * @hidden @internal
     */
    public paginatorClassName(): string {
        switch (this.displayDensity) {
            case DisplayDensity.cosy:
                return 'igx-paginator--cosy';
            case DisplayDensity.compact:
                return 'igx-paginator--compact';
            default:
                return 'igx-paginator';
        }
    }

    /**
     * Gets the current width of the container for the pinned `IgxColumnComponent`s.
     * @example
     * ```typescript
     * const pinnedWidth = this.grid.getPinnedWidth;
     * ```
     */
    get pinnedWidth() {
        if (!isNaN(this._pinnedWidth)) { return this._pinnedWidth; }
        this._pinnedWidth = this.getPinnedWidth();
        return this._pinnedWidth;
    }

    /**
     * Gets the current width of the container for the unpinned `IgxColumnComponent`s.
     * @example
     * ```typescript
     * const unpinnedWidth = this.grid.getUnpinnedWidth;
     * ```
     */
    get unpinnedWidth() {
        if (!isNaN(this._unpinnedWidth)) { return this._unpinnedWidth; }
        this._unpinnedWidth = this.getUnpinnedWidth();
        return this._unpinnedWidth;
    }

    /**
     * @hidden @internal
     */
    get isHorizontalScrollHidden() {
        const diff = this.unpinnedWidth - this.totalWidth;
        return this.width === null || diff >= 0;
    }

    /**
     * @hidden @internal
     * Gets the combined width of the columns that are specific to the enabled grid features. They are fixed.
     */
    public featureColumnsWidth(expander?: ElementRef) {
        if (Number.isNaN(this._headerFeaturesWidth)) {
            const rowSelectArea = this.headerSelectorContainer ?
                this.headerSelectorContainer.nativeElement.getBoundingClientRect().width : 0;
            const rowDragArea = this.rowDraggable && this.headerDragContainer ?
                this.headerDragContainer.nativeElement.getBoundingClientRect().width : 0;
            const groupableArea = this.headerGroupContainer ?
                this.headerGroupContainer.nativeElement.getBoundingClientRect().width : 0;
            const expanderWidth = expander ? expander.nativeElement.getBoundingClientRect().width : 0;
            this._headerFeaturesWidth = rowSelectArea + rowDragArea + groupableArea + expanderWidth;
        }
        return this._headerFeaturesWidth;
    }

    /**
     * @hidden @internal
     */
    get summariesMargin() {
        return this.featureColumnsWidth();
    }

    /**
     * Gets an array of `IgxColumnComponent`s.
     * @example
     * ```typescript
     * const colums = this.grid.columns.
     * ```
     */
    get columns(): IgxColumnComponent[] {
        return this._columns;
    }

    /**
     * Gets an array of the pinned `IgxColumnComponent`s.
     * @example
     * ```typescript
     * const pinnedColumns = this.grid.pinnedColumns.
     * ```
     */
    get pinnedColumns(): IgxColumnComponent[] {
        if (this._pinnedVisible.length) {
            return this._pinnedVisible;
        }
        this._pinnedVisible = this._pinnedColumns.filter(col => !col.hidden);
        return this._pinnedVisible;
    }

    /**
     * Gets an array of the pinned `IgxRowComponent`s.
     * @example
     * ```typescript
     * const pinnedRow = this.grid.pinnedRows;
     * ```
     */
    get pinnedRows(): IgxGridRowComponent[] {
        return this._pinnedRowList.toArray().sort((a, b) => {
            return a.index - b.index;
        });
    }

    /**
     * Gets an array of unpinned `IgxColumnComponent`s.
     * @example
     * ```typescript
     * const unpinnedColumns = this.grid.unpinnedColumns.
     * ```
     */
    get unpinnedColumns(): IgxColumnComponent[] {
        if (this._unpinnedVisible.length) {
            return this._unpinnedVisible;
        }
        this._unpinnedVisible = this._unpinnedColumns.filter((col) => !col.hidden);
        return this._unpinnedVisible;
    }

    /**
     * Gets the `width` to be set on `IgxGridHeaderGroupComponent`.
     */
    public getHeaderGroupWidth(column: IgxColumnComponent): string {
        if (this.hasColumnLayouts) {
            return '';
        }
        const colWidth = column.width;
        const minWidth = this.defaultHeaderGroupMinWidth;
        const isPercentageWidth = colWidth && typeof colWidth === 'string' && colWidth.indexOf('%') !== -1;

        if (!isPercentageWidth && parseInt(colWidth, 10) < minWidth) {
            return minWidth + 'px';
        }

        return colWidth;
    }

    /**
     * Returns the `IgxColumnComponent` by field name.
     * @example
     * ```typescript
     * const myCol = this.grid1.getColumnByName("ID");
     * ```
     * @param name
     */
    public getColumnByName(name: string): IgxColumnComponent {
        return this.columnList.find((col) => col.field === name);
    }

    public getColumnByVisibleIndex(index: number): IgxColumnComponent {
        return this.visibleColumns.find((col) => !col.columnGroup && !col.columnLayout && col.visibleIndex === index);
    }

    /**
     * Returns the `IgxRowDirective` by index.
     * @example
     * ```typescript
     * const myRow = this.grid1.getRowByIndex(1);
     * ```
     * @param index
     */
    public getRowByIndex(index: number): IgxRowDirective<IgxGridBaseDirective & GridType> {
        return this.gridAPI.get_row_by_index(index);
    }

    /**
     * Returns `IgxGridRowComponent` object by the specified primary key .
     * @remarks
     * Requires that the `primaryKey` property is set.
     * @example
     * ```typescript
     * const myRow = this.grid1.getRowByKey("cell5");
     * ```
     * @param keyValue
     */
    public getRowByKey(keyValue: any): IgxRowDirective<IgxGridBaseDirective & GridType> {
        return this.gridAPI.get_row_by_key(keyValue);
    }

    /**
     * Returns an array of visible `IgxColumnComponent`s.
     * @example
     * ```typescript
     * const visibleColumns = this.grid.visibleColumns.
     * ```
     */
    get visibleColumns(): IgxColumnComponent[] {
        if (this._visibleColumns.length) {
            return this._visibleColumns;
        }
        this._visibleColumns = this.columnList.filter(c => !c.hidden);
        return this._visibleColumns;
    }

    /**
     * Returns the `IgxGridCellComponent` that matches the conditions.
     * @example
     * ```typescript
     * const myCell = this.grid1.getCellByColumn(2,"UnitPrice");
     * ```
     * @param rowIndex
     * @param columnField
     */
    public getCellByColumn(rowIndex: number, columnField: string): IgxGridCellComponent {
        const columnId = this.columnList.map((column) => column.field).indexOf(columnField);
        if (columnId !== -1) {
            return this.gridAPI.get_cell_by_index(rowIndex, columnId);
        }
    }

    public getCellByColumnVisibleIndex(rowIndex: number, index: number): IgxGridCellComponent {
        return this.gridAPI.get_cell_by_visible_index(rowIndex, index);

    }

    /**
     * Returns an `IgxGridCellComponent` object by the specified primary key and column field.
     * @remarks
     * Requires that the primaryKey property is set.
     * @example
     * ```typescript
     * grid.getCellByKey(1, 'index');
     * ```
     * @param rowSelector match any rowID
     * @param columnField
     */
    public getCellByKey(rowSelector: any, columnField: string): IgxGridCellComponent {
        return this.gridAPI.get_cell_by_key(rowSelector, columnField);
    }

    /**
     * Gets the total number of pages.
     * @example
     * ```typescript
     * const totalPages = this.grid.totalPages;
     * ```
     */
    get totalPages(): number {
        if (this.pagingState) {
            return this.pagingState.metadata.countPages;
        }
        return this._totalRecords >= 0 ? Math.ceil(this._totalRecords / this.perPage) : -1;
    }

    /**
     * Gets if the current page is the first page.
     * @example
     * ```typescript
     * const firstPage = this.grid.isFirstPage;
     * ```
     */
    get isFirstPage(): boolean {
        return this.page === 0;
    }

    /**
     * Goes to the next page, if the grid is not already at the last page.
     * @example
     * ```typescript
     * this.grid1.nextPage();
     * ```
     */
    public nextPage(): void {
        if (!this.isLastPage) {
            this.page += 1;
        }
    }

    /**
     * Goes to the previous page, if the grid is not already at the first page.
     * @example
     * ```typescript
     * this.grid1.previousPage();
     * ```
     */
    public previousPage(): void {
        if (!this.isFirstPage) {
            this.page -= 1;
        }
    }

    /**
     * Returns the total number of records.
     * @remarks
     * Only functions when paging is enabled.
     * @example
     * ```typescript
     * const totalRecords = this.grid.totalRecords;
     * ```
     */
    @Input()
    get totalRecords(): number {
        return this._totalRecords >= 0 ? this._totalRecords : this.pagingState?.metadata.countRecords;
    }

    set totalRecords(total: number) {
        if (total >= 0) {
            this._totalRecords = total;
            this._pipeTrigger++;
            this.notifyChanges();
        }
    }

    /**
     * Returns if the current page is the last page.
     * @example
     * ```typescript
     * const lastPage = this.grid.isLastPage;
     * ```
     */
    get isLastPage(): boolean {
        return this.page + 1 >= this.totalPages;
    }

    /**
     * Returns the total width of the `IgxGridComponent`.
     * @example
     * ```typescript
     * const gridWidth = this.grid.totalWidth;
     * ```
     */
    get totalWidth(): number {
        if (!isNaN(this._totalWidth)) { return this._totalWidth; }
        // Take only top level columns
        const cols = this.visibleColumns.filter(col => col.level === 0 && !col.pinned);
        let totalWidth = 0;
        let i = 0;
        for (i; i < cols.length; i++) {
            totalWidth += parseInt(cols[i].calcWidth, 10) || 0;
        }
        this._totalWidth = totalWidth;
        return totalWidth;
    }

    /**
     * @hidden
     * @internal
     */
    get showRowSelectors(): boolean {
        return this.isRowSelectable && this.hasVisibleColumns && !this.hideRowSelectors;
    }

    /**
     * @hidden
     * @internal
     */
    get showDragIcons(): boolean {
        return this.rowDraggable && this.columns.length > this.hiddenColumnsCount;
    }

    /**
     * @hidden
     */
    protected _moveColumns(from: IgxColumnComponent, to: IgxColumnComponent, pos: DropPosition) {
        const list = this.columnList.toArray();
        this._reorderColumns(from, to, pos, list);
        const newList = this._resetColumnList(list);
        this.columnList.reset(newList);
        this.columnList.notifyOnChanges();
        this._columns = this.columnList.toArray();
    }

    /**
     * @hidden
     */
    protected _resetColumnList(list?) {
        if (!list) {
            list = this.columnList.toArray();
        }
        let newList = [];
        list.filter(c => c.level === 0).forEach(p => {
            newList.push(p);
            if (p.columnGroup) {
                newList = newList.concat(p.allChildren);
            }
        });
        return newList;
    }

    /**
     * @hidden
     */
    protected _reorderColumns(from: IgxColumnComponent, to: IgxColumnComponent, position: DropPosition, columnCollection: any[]) {
        const fromIndex = columnCollection.indexOf(from);
        const childColumnsCount = from.allChildren.length;
        // remove item(s) to be moved.
        const fromCollection = columnCollection.splice(fromIndex, childColumnsCount + 1);

        let dropIndex = columnCollection.indexOf(to);

        if (position === DropPosition.AfterDropTarget) {
            dropIndex++;
            if (to.columnGroup) {
                dropIndex += to.allChildren.length;
            }
        }
        columnCollection.splice(dropIndex, 0, ...fromCollection);
    }
    /**
     * @hidden
     */
    protected _moveChildColumns(parent: IgxColumnComponent, from: IgxColumnComponent, to: IgxColumnComponent, pos: DropPosition) {
        const buffer = parent.children.toArray();
        this._reorderColumns(from, to, pos, buffer);
        parent.children.reset(buffer);
    }
    /**
     * Moves a column to the specified drop target.
     * @example
     * ```typescript
     * grid.moveColumn(compName, persDetails);
     * ```
     */
    public moveColumn(column: IgxColumnComponent, dropTarget: IgxColumnComponent, pos: DropPosition = DropPosition.None) {

        if (column === dropTarget) {
            return;
        }
        let position = pos;
        if (position === DropPosition.None) {
            warningShown = showMessage(
                'DropPosition.None is deprecated.' +
                'Use DropPosition.AfterDropTarget instead.',
                warningShown);
            position =  DropPosition.AfterDropTarget;
        }
        if ((column.level !== dropTarget.level) ||
            (column.topLevelParent !== dropTarget.topLevelParent)) {
            return;
        }

        this.endEdit(true);
        if (column.level) {
            this._moveChildColumns(column.parent, column, dropTarget, position);
        }

        if (dropTarget.pinned && column.pinned) {
            this._reorderColumns(column, dropTarget, position, this._pinnedColumns);
        }

        if (dropTarget.pinned && !column.pinned) {
            column.pin();
            if (!this.isPinningToStart) {
                if (pos === DropPosition.AfterDropTarget) {
                    position = DropPosition.AfterDropTarget;
                } else {
                    position = DropPosition.None;
                }
            }
            this._reorderColumns(column, dropTarget, position, this._pinnedColumns);
        }

        if (!dropTarget.pinned && column.pinned) {
            column.unpin();
            let list = [];

            if (this.pinnedColumns.indexOf(column) === -1 && this.pinnedColumns.indexOf(dropTarget) === -1) {
                list = this._unpinnedColumns;
            } else {
                list = this._pinnedColumns;
            }

            const fi = list.indexOf(column);
            const ti = list.indexOf(dropTarget);

            if (pos === DropPosition.BeforeDropTarget && fi < ti) {
                position = DropPosition.BeforeDropTarget;
            } else if (pos === DropPosition.AfterDropTarget && fi > ti) {
                position = DropPosition.AfterDropTarget;
            } else {
                position = DropPosition.None;
            }
        }

        if (!dropTarget.pinned) {
            this._reorderColumns(column, dropTarget, position, this._unpinnedColumns);
        }

        this._moveColumns(column, dropTarget, position);
        this.notifyChanges();
        if (this.hasColumnLayouts) {
            this.columns.filter(x => x.columnLayout).forEach(x => x.populateVisibleIndexes());
        }
        // after reordering is done reset cached column collections.
        this.resetColumnCollections();
        column.resetCaches();

        const args = {
            source: column,
            target: dropTarget
        };

        this.onColumnMovingEnd.emit(args);
    }

    /**
     * Goes to the desired page index.
     * @example
     * ```typescript
     * this.grid1.paginate(1);
     * ```
     * @param val
     */
    public paginate(val: number): void {
        if (val < 0 || val > this.totalPages - 1) {
            return;
        }

        this.page = val;
    }

    /**
     * Manually marks the `IgxGridComponent` for change detection.
     * @example
     * ```typescript
     * this.grid1.markForCheck();
     * ```
     */
    public markForCheck() {
        this.cdr.detectChanges();
    }

    /**
     * Creates a new `IgxGridRowComponent` and adds the data record to the end of the data source.
     * @example
     * ```typescript
     * this.grid1.addRow(record);
     * ```
     * @param data
     */
    public addRow(data: any): void {
        // commit pending states prior to adding a row
        this.endEdit(true);
        this.gridAPI.addRowToData(data);

        this.onRowAdded.emit({ data });
        this._pipeTrigger++;
        this.notifyChanges();
    }

    /**
     * Removes the `IgxGridRowComponent` and the corresponding data record by primary key.
     * @remarks
     * Requires that the `primaryKey` property is set.
     * The method accept rowSelector as a parameter, which is the rowID.
     * @example
     * ```typescript
     * this.grid1.deleteRow(0);
     * ```
     * @param rowSelector
     */
    public deleteRow(rowSelector: any): void {
        if (this.primaryKey !== undefined && this.primaryKey !== null) {
            this.deleteRowById(rowSelector);
        }
    }

    /** @hidden */
    public deleteRowById(rowId: any) {
        this.gridAPI.deleteRowById(rowId);
    }

    /**
     * @hidden
     */
    protected deleteRowFromData(rowID: any, index: number) {
        //  if there is a row (index !== 0) delete it
        //  if there is a row in ADD or UPDATE state change it's state to DELETE
        if (index !== -1) {
            if (this.transactions.enabled) {
                const transaction: Transaction = { id: rowID, type: TransactionType.DELETE, newValue: null };
                this.transactions.add(transaction, this.data[index]);
            } else {
                this.data.splice(index, 1);
            }
        } else {
            const state: State = this.transactions.getState(rowID);
            this.transactions.add({ id: rowID, type: TransactionType.DELETE, newValue: null }, state && state.recordRef);
        }
    }

    /**
     * Updates the `IgxGridRowComponent` and the corresponding data record by primary key.
     * @remarks
     * Requires that the `primaryKey` property is set.
     * @example
     * ```typescript
     * this.gridWithPK.updateCell('Updated', 1, 'ProductName');
     * ```
     * @param value the new value which is to be set.
     * @param rowSelector corresponds to rowID.
     * @param column corresponds to column field.
     */
    public updateCell(value: any, rowSelector: any, column: string): void {
        if (this.isDefined(this.primaryKey)) {
            const col = this.columnList.toArray().find(c => c.field === column);
            if (col) {
                // Simplify
                const rowData = this.gridAPI.getRowData(rowSelector);
                const index = this.gridAPI.get_row_index_in_data(rowSelector);
                // If row passed is invalid
                if (index < 0) {
                    return;
                }
                const id = {
                    rowID: rowSelector,
                    columnID: col.index,
                    rowIndex: index
                };

                const cell = new IgxCell(id, index, col, rowData[col.field], rowData[col.field], rowData);
                const args = this.gridAPI.update_cell(cell, value);

                if (this.crudService.cell && this.crudService.sameCell(cell)) {
                    if (args.cancel) {
                        return;
                    }
                    this.gridAPI.escape_editMode();
                }
                this.cdr.detectChanges();
            }
        }
    }

    /**
     * Updates the `IgxGridRowComponent`
     * @remarks
     * The row is specified by
     * rowSelector parameter and the data source record with the passed value.
     * This method will apply requested update only if primary key is specified in the grid.
     * @example
     * ```typescript
     * grid.updateRow({
     *       ProductID: 1, ProductName: 'Spearmint', InStock: true, UnitsInStock: 1, OrderDate: new Date('2005-03-21')
     *   }, 1);
     * ```
     * @param value
     * @param rowSelector correspond to rowID
     */
    public updateRow(value: any, rowSelector: any): void {
        if (this.isDefined(this.primaryKey)) {
            const editableCell = this.crudService.cell;
            if (editableCell && editableCell.id.rowID === rowSelector) {
                this.gridAPI.escape_editMode();
            }
            const row = new IgxRow(rowSelector, -1, this.gridAPI.getRowData(rowSelector));
            this.gridAPI.update_row(row, value);

            // TODO: fix for #5934 and probably break for #5763
            // consider adding of third optional boolean parameter in updateRow.
            // If developer set this parameter to true we should call notifyChanges(true), and
            // vise-versa if developer set it to false we should call notifyChanges(false).
            // The parameter should default to false
            this.notifyChanges();
        }
    }

    /**
     * Sort a single `IgxColumnComponent`.
     * @remarks
     * Sort the `IgxGridComponent`'s `IgxColumnComponent` based on the provided array of sorting expressions.
     * @example
     * ```typescript
     * this.grid.sort({ fieldName: name, dir: SortingDirection.Asc, ignoreCase: false });
     * ```
     */
    public sort(expression: ISortingExpression | Array<ISortingExpression>): void {
        this.endEdit(false);
        if (expression instanceof Array) {
            this.gridAPI.sort_multiple(expression);
        } else {
            this.gridAPI.sort(expression);
        }
        requestAnimationFrame(() => this.onSortingDone.emit(expression));
    }

    /**
     * Filters a single `IgxColumnComponent`.
     * @example
     * ```typescript
     * public filter(term) {
     *      this.grid.filter("ProductName", term, IgxStringFilteringOperand.instance().condition("contains"));
     * }
     * ```
     * @param name
     * @param value
     * @param conditionOrExpressionTree
     * @param ignoreCase
     */
    public filter(name: string, value: any, conditionOrExpressionTree?: IFilteringOperation | IFilteringExpressionsTree,
        ignoreCase?: boolean) {
        this.filteringService.filter(name, value, conditionOrExpressionTree, ignoreCase);
    }

    /**
     * Filters all the `IgxColumnComponent` in the `IgxGridComponent` with the same condition.
     * @example
     * ```typescript
     * grid.filterGlobal('some', IgxStringFilteringOperand.instance().condition('contains'));
     * ```
     * @param value
     * @param condition
     * @param ignoreCase
     */
    public filterGlobal(value: any, condition, ignoreCase?) {
        this.filteringService.filterGlobal(value, condition, ignoreCase);
    }

    /**
     * Enables summaries for the specified column and applies your customSummary.
     * @remarks
     * If you do not provide the customSummary, then the default summary for the column data type will be applied.
     * @example
     * ```typescript
     * grid.enableSummaries([{ fieldName: 'ProductName' }, { fieldName: 'ID' }]);
     * ```
     * Enable summaries for the listed columns.
     * @example
     * ```typescript
     * grid.enableSummaries('ProductName');
     * ```
     * @param rest
     */
    public enableSummaries(...rest) {
        if (rest.length === 1 && Array.isArray(rest[0])) {
            this._multipleSummaries(rest[0], true);
        } else {
            this._summaries(rest[0], true, rest[1]);
        }
    }

    /**
     * Disable summaries for the specified column.
     * @example
     * ```typescript
     * grid.disableSummaries('ProductName');
     * ```
     * @remarks
     * Disable summaries for the listed columns.
     * @example
     * ```typescript
     * grid.disableSummaries([{ fieldName: 'ProductName' }]);
     * ```
     */
    public disableSummaries(...rest) {
        if (rest.length === 1 && Array.isArray(rest[0])) {
            this._disableMultipleSummaries(rest[0]);
        } else {
            this._summaries(rest[0], false);
        }
    }

    /**
     * If name is provided, clears the filtering state of the corresponding `IgxColumnComponent`.
     * @remarks
     * Otherwise clears the filtering state of all `IgxColumnComponent`s.
     * @example
     * ```typescript
     * this.grid.clearFilter();
     * ```
     * @param name
     */
    public clearFilter(name?: string) {
        this.filteringService.clearFilter(name);
    }

    /**
     * If name is provided, clears the sorting state of the corresponding `IgxColumnComponent`.
     * @remarks
     * otherwise clears the sorting state of all `IgxColumnComponent`.
     * @example
     * ```typescript
     * this.grid.clearSort();
     * ```
     * @param name
     */
    public clearSort(name?: string) {
        if (!name) {
            this.sortingExpressions = [];
            return;
        }
        if (!this.gridAPI.get_column_by_name(name)) {
            return;
        }
        this.gridAPI.clear_sort(name);
    }

    /**
     * @hidden @internal
     */
    public refreshGridState(args?) {
        this.endEdit(true);
        this.selectionService.clearHeaderCBState();
        this.summaryService.clearSummaryCache(args);
    }

    // TODO: We have return values here. Move them to event args ??

    /**
     * Pins a column by field name.
     * @remarks
     * Returns whether the operation is successful.
     * @example
     * ```typescript
     * this.grid.pinColumn("ID");
     * ```
     * @param columnName
     * @param index
     */
    public pinColumn(columnName: string | IgxColumnComponent, index?): boolean {
        const col = columnName instanceof IgxColumnComponent ? columnName : this.getColumnByName(columnName);
        return col.pin(index);
    }

    /**
     * Unpins a column by field name. Returns whether the operation is successful.
     * @example
     * ```typescript
     * this.grid.pinColumn("ID");
     * ```
     * @param columnName
     * @param index
     */
    public unpinColumn(columnName: string | IgxColumnComponent, index?): boolean {
        const col = columnName instanceof IgxColumnComponent ? columnName : this.getColumnByName(columnName);
        return col.unpin(index);
    }

    /**
     * Pin the row by its id.
     * @remarks
     * ID is either the primaryKey value or the data record instance.
     * @example
     * ```typescript
     * this.grid.pinRow(rowID);
     * ```
     * @param rowID The row id - primaryKey value or the data record instance.
     * @param index The index at which to insert the row in the pinned collection.
     */
    public pinRow(rowID: any, index?: number): boolean {
        if (this._pinnedRecordIDs.indexOf(rowID) !== -1) {
            return false;
        }
        const row = this.gridAPI.get_row_by_key(rowID);

        const eventArgs: IPinRowEventArgs = {
            insertAtIndex: index,
            isPinned: true,
            rowID: rowID,
            row: row
        };
        this.onRowPinning.emit(eventArgs);

        this.endEdit(true);

        const insertIndex = typeof eventArgs.insertAtIndex === 'number' ? eventArgs.insertAtIndex : this._pinnedRecordIDs.length;
        this._pinnedRecordIDs.splice(insertIndex, 0, rowID);
        this._pipeTrigger++;
        if (this.gridAPI.grid) {
            this.notifyChanges();
        }
    }

    /**
     * Unpin the row by its id.
     * @remarks
     * ID is either the primaryKey value or the data record instance.
     * @example
     * ```typescript
     * this.grid.unpinRow(rowID);
     * ```
     * @param rowID The row id - primaryKey value or the data record instance.
     */
    public unpinRow(rowID: any) {
        const index =  this._pinnedRecordIDs.indexOf(rowID);
        if (index === -1) {
            return false;
        }
        const row = this.gridAPI.get_row_by_key(rowID);
        const eventArgs: IPinRowEventArgs = {
            isPinned: false,
            rowID: rowID,
            row: row
        };
        this.onRowPinning.emit(eventArgs);
        this.endEdit(true);
        this._pinnedRecordIDs.splice(index, 1);
        this._pipeTrigger++;
        if (this.gridAPI.grid) {
            this.cdr.detectChanges();
        }
        return true;
    }

    get pinnedRowHeight() {
        const containerHeight = this.pinContainer ? this.pinContainer.nativeElement.offsetHeight : 0;
        return this.hasPinnedRecords ? containerHeight : 0;
    }

    get totalHeight() {
        return this.calcHeight ? this.calcHeight + this.pinnedRowHeight : this.calcHeight;
    }

    /**
     * Recalculates grid width/height dimensions.
     * @remarks
     * Should be run when changing DOM elements dimentions manually that affect the grid's size.
     * @example
     * ```typescript
     * this.grid.reflow();
     * ```
     */
    public reflow() {
        this.calculateGridSizes();
    }

    /**
     * Finds the next occurrence of a given string in the grid and scrolls to the cell if it isn't visible.
     * @remarks
     * Returns how many times the grid contains the string.
     * @example
     * ```typescript
     * this.grid.findNext("financial");
     * ```
     * @param text the string to search.
     * @param caseSensitive optionally, if the search should be case sensitive (defaults to false).
     * @param exactMatch optionally, if the text should match the entire value  (defaults to false).
     */
    public findNext(text: string, caseSensitive?: boolean, exactMatch?: boolean): number {
        return this.find(text, 1, caseSensitive, exactMatch);
    }

    /**
     * Finds the previous occurrence of a given string in the grid and scrolls to the cell if it isn't visible.
     * @remarks
     * Returns how many times the grid contains the string.
     * @example
     * ```typescript
     * this.grid.findPrev("financial");
     * ```
     * @param text the string to search.
     * @param caseSensitive optionally, if the search should be case sensitive (defaults to false).
     * @param exactMatch optionally, if the text should match the entire value (defaults to false).
     */
    public findPrev(text: string, caseSensitive?: boolean, exactMatch?: boolean): number {
        return this.find(text, -1, caseSensitive, exactMatch);
    }

    /**
     * Reapplies the existing search.
     * @remarks
     * Returns how many times the grid contains the last search.
     * @example
     * ```typescript
     * this.grid.refreshSearch();
     * ```
     * @param updateActiveInfo
     */
    public refreshSearch(updateActiveInfo?: boolean, endEdit = true): number {
        if (this.lastSearchInfo.searchText) {
            this.rebuildMatchCache();

            if (updateActiveInfo) {
                const activeInfo = IgxTextHighlightDirective.highlightGroupsMap.get(this.id);
                this.lastSearchInfo.matchInfoCache.forEach((match, i) => {
                    if (match.column === activeInfo.column &&
                        match.row === activeInfo.row &&
                        match.index === activeInfo.index &&
                        compareMaps(match.metadata, activeInfo.metadata)) {
                        this.lastSearchInfo.activeMatchIndex = i;
                    }
                });
            }

            return this.find(this.lastSearchInfo.searchText,
                0,
                this.lastSearchInfo.caseSensitive,
                this.lastSearchInfo.exactMatch,
                false,
                endEdit);
        } else {
            return 0;
        }
    }

    /**
     * Removes all the highlights in the cell.
     * @example
     * ```typescript
     * this.grid.clearSearch();
     * ```
     */
    public clearSearch() {
        this.lastSearchInfo = {
            searchText: '',
            caseSensitive: false,
            exactMatch: false,
            activeMatchIndex: 0,
            matchInfoCache: []
        };

        this.rowList.forEach((row) => {
            if (row.cells) {
                row.cells.forEach((c) => {
                    c.clearHighlight();
                });
            }
        });
    }

    /**
     * Returns if the `IgxGridComponent` has sortable columns.
     * @example
     * ```typescript
     * const sortableGrid = this.grid.hasSortableColumns;
     * ```
     */
    get hasSortableColumns(): boolean {
        return this.columnList.some((col) => col.sortable);
    }

    /**
     * Returns if the `IgxGridComponent` has editable columns.
     * @example
     * ```typescript
     * const editableGrid = this.grid.hasEditableColumns;
     * ```
     */
    get hasEditableColumns(): boolean {
        return this.columnList.some((col) => col.editable);
    }

    /**
     * Returns if the `IgxGridComponent` has fiterable columns.
     * @example
     * ```typescript
     * const filterableGrid = this.grid.hasFilterableColumns;
     * ```
     */
    get hasFilterableColumns(): boolean {
        return this.columnList.some((col) => col.filterable);
    }

    /**
     * Returns if the `IgxGridComponent` has summarized columns.
     * @example
     * ```typescript
     * const summarizedGrid = this.grid.hasSummarizedColumns;
     * ```
     */
    get hasSummarizedColumns(): boolean {
        return this.summaryService.hasSummarizedColumns;
    }

    /**
     * @hidden @internal
     */
    get rootSummariesEnabled(): boolean {
        return this.summaryCalculationMode !== GridSummaryCalculationMode.childLevelsOnly;
    }

    /**
     * @hidden @internal
     */
    get hasVisibleColumns(): boolean {
        if (this._hasVisibleColumns === undefined) {
            return this.columnList ? this.columnList.some(c => !c.hidden) : false;
        }
        return this._hasVisibleColumns;
    }

    set hasVisibleColumns(value) {
        this._hasVisibleColumns = value;
    }
    /**
     * Returns if the `IgxGridComponent` has moveable columns.
     * @example
     * ```typescript
     * const movableGrid = this.grid.hasMovableColumns;
     * ```
     */
    get hasMovableColumns(): boolean {
        return this.columnList && this.columnList.some((col) => col.movable);
    }

    /**
     * Returns if the `IgxGridComponent` has column groups.
     * @example
     * ```typescript
     * const groupGrid = this.grid.hasColumnGroups;
     * ```
     */
    get hasColumnGroups(): boolean {
        return this._columnGroups;
    }
    /**
     * Returns if the `IgxGridComponent` has column layouts for multi-row layout definition.
     * @example
     * ```typescript
     * const layoutGrid = this.grid.hasColumnLayouts;
     * ```
     */
    public get hasColumnLayouts() {
        return !!this.columnList.some(col => col.columnLayout);
    }

    /**
     * Returns an array of the selected `IgxGridCellComponent`s.
     * @example
     * ```typescript
     * const selectedCells = this.grid.selectedCells;
     * ```
     */
    get selectedCells(): IgxGridCellComponent[] | any[] {
        if (this.dataRowList) {
            return this.dataRowList.map((row) => row.cells.filter((cell) => cell.selected))
                .reduce((a, b) => a.concat(b), []);
        }
        return [];
    }

    /**
     * @hidden @internal
     */
    get multiRowLayoutRowSize() {
        return this._multiRowLayoutRowSize;
    }

    /**
     * @hidden
     */
    protected get rowBasedHeight() {
        return this.dataLength * this.rowHeight;
    }

    /**
     * @hidden
     */
    protected get isPercentWidth() {
        return this.width && this.width.indexOf('%') !== -1;
    }

    /**
     * @hidden @internal
     */
    public get isPercentHeight() {
        return this._height && this._height.indexOf('%') !== -1;
    }

    /**
     * @hidden
     * Sets columns defaultWidth property
     */
    protected _derivePossibleWidth() {
        if (!this.columnWidthSetByUser) {
            this._columnWidth = this.width !== null ? this.getPossibleColumnWidth() : MINIMUM_COLUMN_WIDTH + 'px';
        }
        this.columnList.forEach((column: IgxColumnComponent) => {
            if (this.hasColumnLayouts && parseInt(this._columnWidth, 10)) {
                const columnWidthCombined = parseInt(this._columnWidth, 10) * (column.colEnd ? column.colEnd - column.colStart : 1);
                column.defaultWidth = columnWidthCombined + 'px';
            } else {
                column.defaultWidth = this._columnWidth;
                column.resetCaches();
            }
        });
        this.resetCachedWidths();
    }

    /**
     * @hidden
     */
    protected get defaultTargetBodyHeight(): number {
        const allItems = this.dataLength;
        return this.renderedRowHeight * Math.min(this._defaultTargetRecordNumber,
            this.paging ? Math.min(allItems, this.perPage) : allItems);
    }

    /**
     * @hidden @internal
     * The rowHeight input is bound to min-height css prop of rows that adds a 1px border in all cases
     */
    public get renderedRowHeight(): number {
        return this.rowHeight + 1;
    }

    /**
     * @hidden
     * @internal
     */
    protected calcGridHeadRow() {
        if (this.maxLevelHeaderDepth) {
            this._baseFontSize = parseFloat(getComputedStyle(this.document.documentElement).getPropertyValue('font-size'));
            let minSize = (this.maxLevelHeaderDepth + 1) * this.defaultRowHeight / this._baseFontSize;
            if (this._allowFiltering && this._filterMode === FilterMode.quickFilter) {
                minSize += (FILTER_ROW_HEIGHT + 1) / this._baseFontSize;
            }
            this.theadRow.nativeElement.style.minHeight = `${minSize}rem`;
        }
    }

    /**
     * @hidden
     * Sets TBODY height i.e. this.calcHeight
     */
    protected calculateGridHeight() {
        this.calcGridHeadRow();
        this.summariesHeight = 0;
        if (this.hasSummarizedColumns && this.rootSummariesEnabled) {
            this.summariesHeight = this.summaryService.calcMaxSummaryHeight();
        }

        this.calcHeight = this._calculateGridBodyHeight();
        if (this.pinnedRowHeight && this.calcHeight) {
            this.calcHeight -= this.pinnedRowHeight;
        }
    }

    /**
     * @hidden
     */
    protected getGroupAreaHeight(): number {
        return 0;
    }

    /**
     * @hidden
     */
    protected getComputedHeight(elem) {
        return elem.offsetHeight ? parseFloat(this.document.defaultView.getComputedStyle(elem).getPropertyValue('height')) : 0;
    }
    /**
     * @hidden
     */
    protected getFooterHeight(): number {
        return this.summariesHeight || this.getComputedHeight(this.tfoot.nativeElement);
    }
    /**
     * @hidden
     */
    protected getTheadRowHeight(): number {
        const height = this.getComputedHeight(this.theadRow.nativeElement);
        return (!this.allowFiltering || (this.allowFiltering && this.filterMode !== FilterMode.quickFilter)) ?
        height - this.getFilterCellHeight() :
        height;
    }

    /**
     * @hidden
     */
    protected getToolbarHeight(): number {
        let toolbarHeight = 0;
        if (this.showToolbar && this.toolbarHtml != null) {
            const height = this.getComputedHeight(this.toolbarHtml.nativeElement);
            toolbarHeight = this.toolbarHtml.nativeElement.firstElementChild ?
            height : 0;
        }
        return toolbarHeight;
    }

    /**
     * @hidden
     */
    protected getPagingFooterHeight(): number {
        let pagingHeight = 0;
        if (this.footer) {
            const height = this.getComputedHeight(this.footer.nativeElement);
            pagingHeight = this.footer.nativeElement.firstElementChild ?
            height : 0;
        }
        return pagingHeight;
    }

    /**
     * @hidden
     */
    protected getFilterCellHeight(): number {
        const headerGroupNativeEl = (this.headerGroupsList.length !== 0) ?
            this.headerGroupsList[0].element.nativeElement : null;
        const filterCellNativeEl = (headerGroupNativeEl) ?
            headerGroupNativeEl.querySelector('igx-grid-filtering-cell') : null;
        return (filterCellNativeEl) ? filterCellNativeEl.offsetHeight : 0;
    }

    /**
     * @hidden
     */
    protected _calculateGridBodyHeight(): number {
        if (!this._height) {
            return null;
        }
        const actualTheadRow = this.getTheadRowHeight();
        const footerHeight = this.getFooterHeight();
        const toolbarHeight = this.getToolbarHeight();
        const pagingHeight = this.getPagingFooterHeight();
        const groupAreaHeight = this.getGroupAreaHeight();
        const scrHeight = this.getComputedHeight(this.scr.nativeElement);
        const renderedHeight = toolbarHeight + actualTheadRow +
            footerHeight + pagingHeight + groupAreaHeight +
            scrHeight;

        let gridHeight = 0;

        if (this.isPercentHeight) {
            const computed = this.document.defaultView.getComputedStyle(this.nativeElement).getPropertyValue('height');
            const autoSize = this._shouldAutoSize(renderedHeight);
            if (autoSize || computed.indexOf('%') !== -1) {
                const bodyHeight = this.getDataBasedBodyHeight();
                return bodyHeight > 0 ? bodyHeight : null;
            }
            gridHeight = parseFloat(computed);
        } else {
            gridHeight = parseInt(this._height, 10);
        }
        const height = Math.abs(gridHeight - renderedHeight);

        if (Math.round(height) === 0 || isNaN(gridHeight)) {
            const bodyHeight = this.defaultTargetBodyHeight;
            return bodyHeight > 0 ? bodyHeight : null;
        }
        return height;
    }

    protected checkContainerSizeChange() {
        const origHeight = this.nativeElement.parentElement.offsetHeight;
        this.nativeElement.style.display = 'none';
        const height = this.nativeElement.parentElement.offsetHeight;
        this.nativeElement.style.display = '';
        return origHeight !== height;
    }

    protected _shouldAutoSize(renderedHeight) {
        this.tbody.nativeElement.style.display = 'none';
        let res = !this.nativeElement.parentElement ||
            this.nativeElement.parentElement.clientHeight === 0 ||
            this.nativeElement.parentElement.clientHeight === renderedHeight;
        if (!isChromium()) {
            // If grid causes the parent container to extend (for example when container is flex)
            // we should always auto-size since the actual size of the container will continuously change as the grid renders elements.
            res = this.checkContainerSizeChange();
        }
        this.tbody.nativeElement.style.display = '';
        return res;
    }

    /**
     * @hidden @internal
     */
    public get outerWidth() {
        return this.hasVerticalScroll() ? this.calcWidth + this.scrollSize : this.calcWidth;
    }

    /**
     * @hidden @internal
     * Gets the visible content height that includes header + tbody + footer.
     */
    public getVisibleContentHeight() {
        let height = this.theadRow.nativeElement.clientHeight + this.tbody.nativeElement.clientHeight;
        if (this.hasSummarizedColumns) {
            height += this.tfoot.nativeElement.clientHeight;
        }
        return height;
    }

    /**
     * @hidden @internal
     */
    public getPossibleColumnWidth(baseWidth: number = null) {
        let computedWidth;
        if (baseWidth !== null) {
            computedWidth = baseWidth;
        } else {
            computedWidth = this.calcWidth ||
                parseInt(this.document.defaultView.getComputedStyle(this.nativeElement).getPropertyValue('width'), 10);
        }

        computedWidth -= this.featureColumnsWidth();

        const visibleChildColumns = this.visibleColumns.filter(c => !c.columnGroup);


        // Column layouts related
        let visibleCols = [];
        const columnBlocks = this.visibleColumns.filter(c => c.columnGroup);
        const colsPerBlock = columnBlocks.map(block => block.getInitialChildColumnSizes(block.children));
        const combinedBlocksSize = colsPerBlock.reduce((acc, item) => acc + item.length, 0);
        colsPerBlock.forEach(blockCols => visibleCols = visibleCols.concat(blockCols));
        //

        const columnsWithSetWidths = this.hasColumnLayouts ?
            visibleCols.filter(c => c.widthSetByUser) :
            visibleChildColumns.filter(c => c.widthSetByUser);

        const columnsToSize = this.hasColumnLayouts ?
            combinedBlocksSize - columnsWithSetWidths.length :
            visibleChildColumns.length - columnsWithSetWidths.length;
        const sumExistingWidths = columnsWithSetWidths
            .reduce((prev, curr) => {
                const colWidth = curr.width;
                const widthValue = parseInt(colWidth, 10);
                const currWidth = colWidth && typeof colWidth === 'string' && colWidth.indexOf('%') !== -1 ?
                    widthValue / 100 * computedWidth :
                    widthValue;
                return prev + currWidth;
            }, 0);

        // When all columns are hidden, return 0px width
        if (!sumExistingWidths && !columnsToSize) {
            return '0px';
        }

        const columnWidth = Math.floor(!Number.isFinite(sumExistingWidths) ?
            Math.max(computedWidth / columnsToSize, MINIMUM_COLUMN_WIDTH) :
            Math.max((computedWidth - sumExistingWidths) / columnsToSize, MINIMUM_COLUMN_WIDTH));

        return columnWidth + 'px';
    }

    /**
     * @hidden
     * Sets grid width i.e. this.calcWidth
     */
    protected calculateGridWidth() {
        let width;

        if (this.isPercentWidth) {
            /* width in %*/
            const computed = this.document.defaultView.getComputedStyle(this.nativeElement).getPropertyValue('width');
            width = computed.indexOf('%') === -1 ? parseInt(computed, 10) : null;
        } else {
            width = parseInt(this.width, 10);
        }

        if (!width && this.nativeElement) {
            width = this.nativeElement.offsetWidth;
        }


        if (this.width === null || !width) {
            width = this.getColumnWidthSum();
        }

        if (this.hasVerticalScroll() && this.width !== null) {
            width -= this.scrollSize;
        }
        if ((Number.isFinite(width) || width === null) && width !== this.calcWidth) {
            this.calcWidth = width;
        }
        this._derivePossibleWidth();
    }

    private getColumnWidthSum(): number {
        let colSum = 0;
        const cols = this.hasColumnLayouts ?
            this.visibleColumns.filter(x => x.columnLayout) : this.visibleColumns.filter(x => !x.columnGroup);
        cols.forEach((item) => {
            const isWidthInPercent = item.width && typeof item.width === 'string' && item.width.indexOf('%') !== -1;
            if (isWidthInPercent) {
                item.width = item.calcWidth || MINIMUM_COLUMN_WIDTH + 'px';
            }
            colSum += parseInt((item.width || item.defaultWidth), 10) || MINIMUM_COLUMN_WIDTH;
        });
        if (!colSum) {
            return null;
        }
        this.cdr.detectChanges();
        colSum += this.featureColumnsWidth();
        return colSum;
    }

    /**
     * @hidden @internal
     */
    public hasVerticalScroll() {
        if (this._init) { return false; }
        const isScrollable = this.verticalScrollContainer ? this.verticalScrollContainer.isScrollable() : false;
        return !!(this.calcWidth && this.dataView &&
            this.dataView.length > 0 &&
            isScrollable);
    }

    /**
     * @hidden @internal
     */
    protected getDataBasedBodyHeight(): number {
        return !this.data || (this.data.length < this._defaultTargetRecordNumber) ?
            0 : this.defaultTargetBodyHeight;
    }

    /**
     * @hidden @internal
     */
    protected onPinnedRowsChanged(change: QueryList<IgxGridRowComponent>) {
        const diff = this.rowListDiffer.diff(change);
        if (diff) {
            this.notifyChanges(true);
         }
    }

    /**
     * @hidden
     */
    protected onColumnsChanged(change: QueryList<IgxColumnComponent>) {
        const diff = this.columnListDiffer.diff(change);
        if (this.autoGenerate && this.columnList.length === 0 && this._autoGeneratedCols.length > 0) {
            // In Ivy if there are nested conditional templates the content children are re-evaluated
            // hence autogenerated columns are cleared and need to be reset.
            this.columnList.reset(this._autoGeneratedCols);
            return;
        }
        if (diff) {
            let added = false;
            let removed = false;

            this.initColumns(this.columnList);


            diff.forEachAddedItem((record: IterableChangeRecord<IgxColumnComponent>) => {
                this.onColumnInit.emit(record.item);
                added = true;
            });

            diff.forEachRemovedItem((record: IterableChangeRecord<IgxColumnComponent | IgxColumnGroupComponent>) => {
                const isColumnGroup = record.item instanceof IgxColumnGroupComponent;
                if (!isColumnGroup) {
                    // Clear Grouping
                    this.gridAPI.clear_groupby(record.item.field);

                    // Clear Filtering
                    this.gridAPI.clear_filter(record.item.field);

                    // Close filter row
                    if (this.filteringService.isFilterRowVisible
                        && this.filteringService.filteredColumn
                        && this.filteringService.filteredColumn.field === record.item.field) {
                        this.filteringRow.close();
                    }

                    // Clear Sorting
                    this.gridAPI.clear_sort(record.item.field);

                    // Remove column selection
                    this.selectionService.deselectColumnsWithNoEvent([record.item.field]);
                }
                removed = true;
            });

            this.resetCaches();

            if (added || removed) {
                this.summaryService.clearSummaryCache();
                Promise.resolve().then(() => {
                    // `onColumnsChanged` can be executed midway a current detectChange cycle and markForCheck will be ignored then.
                    // This ensures that we will wait for the current cycle to end so we can trigger a new one and ngDoCheck to fire.
                    this.notifyChanges(true);
                });
            }
        }
    }

    /**
     * @hidden
     */
    protected calculateGridSizes(recalcFeatureWidth = true) {
        /*
            TODO: (R.K.) This layered lasagne should be refactored
            ASAP. The reason I have to reset the caches so many times is because
            after teach `detectChanges` call they are filled with invalid
            state. Of course all of this happens midway through the grid
            sizing process which of course, uses values from the caches, thus resulting
            in a broken layout.
        */
        this.resetCaches(recalcFeatureWidth);
        this.cdr.detectChanges();
        const hasScroll = this.hasVerticalScroll();
        this.calculateGridWidth();
        this.resetCaches(recalcFeatureWidth);
        this.cdr.detectChanges();
        this.calculateGridHeight();

        if (this.rowEditable) {
            this.repositionRowEditingOverlay(this.rowInEditMode);
        }

        if (this.filteringService.isFilterRowVisible) {
            this.filteringRow.resetChipsArea();
        }

        this.cdr.detectChanges();
        // in case scrollbar has appeared recalc to size correctly.
        if (hasScroll !== this.hasVerticalScroll()) {
            this.calculateGridWidth();
            this.cdr.detectChanges();
        }
        if (this.zone.isStable) {
            this.zone.run(() => {
                this._applyWidthHostBinding();
                this.cdr.detectChanges();
            });
        } else {
            this.zone.onStable.pipe(first()).subscribe(() => {
                this.zone.run(() => {
                    this._applyWidthHostBinding();
                });
            });
        }
        this.resetCaches(recalcFeatureWidth);
    }

    private _applyWidthHostBinding() {
        let width = this._width;
        if (width === null) {
            let currentWidth = this.calcWidth;
            if (this.hasVerticalScroll()) {
                currentWidth += this.scrollSize;
            }
            width = currentWidth + 'px';
            this.resetCaches();
        }
        this._hostWidth = width;
        this.cdr.markForCheck();
    }

    /**
     * Gets calculated width of the pinned area.
     * @example
     * ```typescript
     * const pinnedWidth = this.grid.getPinnedWidth();
     * ```
     * @param takeHidden If we should take into account the hidden columns in the pinned area.
     */
    public getPinnedWidth(takeHidden = false) {
        const fc = takeHidden ? this._pinnedColumns : this.pinnedColumns;
        let sum = 0;
        for (const col of fc) {
            if (col.level === 0) {
                sum += parseInt(col.calcWidth, 10);
            }
        }
        if (this.pinning.columns === ColumnPinningPosition.Start) {
            sum += this.featureColumnsWidth();
        }

        return sum;
    }

    /**
     * @hidden
     * Gets calculated width of the unpinned area
     * @param takeHidden If we should take into account the hidden columns in the pinned area.
     */
    protected getUnpinnedWidth(takeHidden = false) {
        let width = this.isPercentWidth ?
            this.calcWidth :
            parseInt(this.width, 10) || parseInt(this.hostWidth, 10) || this.calcWidth;
        if (this.hasVerticalScroll() && !this.isPercentWidth) {
            width -= this.scrollSize;
        }
        if (this.pinning.columns === ColumnPinningPosition.End) {
            width -= this.featureColumnsWidth();
        }

        return width - this.getPinnedWidth(takeHidden);
    }

    /**
     * @hidden
     */
    protected _summaries(fieldName: string, hasSummary: boolean, summaryOperand?: any) {
        const column = this.gridAPI.get_column_by_name(fieldName);
        if (column) {
            column.hasSummary = hasSummary;
            if (summaryOperand) {
                if (this.rootSummariesEnabled) { this.summaryService.retriggerRootPipe++; }
                column.summaries = summaryOperand;
            }
        }
    }

    /**
     * @hidden
     */
    protected _multipleSummaries(expressions: ISummaryExpression[], hasSummary: boolean) {
        expressions.forEach((element) => {
            this._summaries(element.fieldName, hasSummary, element.customSummary);
        });
    }
    /**
     * @hidden
     */
    protected _disableMultipleSummaries(expressions) {
        expressions.forEach((column) => {
            const columnName = column && column.fieldName ? column.fieldName : column;
            this._summaries(columnName, false);
        });
    }

    /**
     * @hidden
     */
    protected resolveDataTypes(rec) {
        if (typeof rec === 'number') {
            return DataType.Number;
        } else if (typeof rec === 'boolean') {
            return DataType.Boolean;
        } else if (typeof rec === 'object' && rec instanceof Date) {
            return DataType.Date;
        }
        return DataType.String;
    }

    /**
     * @hidden
     */
    protected autogenerateColumns() {
        const data = this.gridAPI.get_data();
        const factory = this.resolver.resolveComponentFactory(IgxColumnComponent);
        const fields = this.generateDataFields(data);
        const columns = [];

        fields.forEach((field) => {
            const ref = factory.create(this.viewRef.injector);
            ref.instance.field = field;
            ref.instance.dataType = this.resolveDataTypes(data[0][field]);
            ref.changeDetectorRef.detectChanges();
            columns.push(ref.instance);
        });
        this._autoGeneratedCols = columns;

        this.columnList.reset(columns);
        if (data && data.length > 0) {
            this.shouldGenerate = false;
        }
    }

    protected generateDataFields(data: any[]): string[] {
        return Object.keys(data && data.length !== 0 ? data[0] : []);
    }

    /**
     * @hidden
     */
    onlyTopLevel(arr) {
        return arr.filter(c => c.level === 0);
    }

    /**
     * @hidden
     */
    protected initColumns(collection: QueryList<IgxColumnComponent>, cb: Function = null) {
        this._columnGroups = this.columnList.some(col => col.columnGroup);
        if (this.hasColumnLayouts) {
            // Set overall row layout size
            this.columnList.forEach((col) => {
                if (col.columnLayout) {
                    const layoutSize = col.children ?
                        col.children.reduce((acc, val) => Math.max(val.rowStart + val.gridRowSpan - 1, acc), 1) :
                        1;
                    this._multiRowLayoutRowSize = Math.max(layoutSize, this._multiRowLayoutRowSize);
                }
            });
        }
        if (this.hasColumnLayouts && this.hasColumnGroups) {
            // invalid configuration - multi-row and column groups
            // remove column groups
            const columnLayoutColumns = this.columnList.filter((col) => col.columnLayout || col.columnLayoutChild);
            this.columnList.reset(columnLayoutColumns);
        }
        this._maxLevelHeaderDepth = null;
        this._columns = this.columnList.toArray();
        collection.forEach((column: IgxColumnComponent) => {
            column.defaultWidth = this.columnWidthSetByUser ? this._columnWidth : column.defaultWidth ? column.defaultWidth : '';

            if (cb) {
                cb(column);
            }
        });

        this.reinitPinStates();

        if (this.hasColumnLayouts) {
            collection.forEach((column: IgxColumnComponent) => {
                column.populateVisibleIndexes();
            });
        }
    }

    /**
     * @hidden
     */
    protected reinitPinStates() {
        this._pinnedColumns = this.columnList
        .filter((c) => c.pinned).sort((a, b) => this._pinnedColumns.indexOf(a) - this._pinnedColumns.indexOf(b));
        this._unpinnedColumns = this.hasColumnGroups ? this.columnList.filter((c) => !c.pinned) :
            this.columnList.filter((c) => !c.pinned)
                .sort((a, b) => this._unpinnedColumns.indexOf(a) - this._unpinnedColumns.indexOf(b));
    }

    /**
     * @hidden @internal
     */
    public isColumnGrouped(fieldName: string): boolean {
        return false;
    }

    /**
     * @hidden @internal
     */
    public onHeaderSelectorClick(event) {
        if (!this.isMultiRowSelectionEnabled) { return; }
        this.selectionService.areAllRowSelected() ?
            this.selectionService.clearRowSelection(event) : this.selectionService.selectAllRows(event);
    }

    /**
     * @hidden @internal
     */
    get headSelectorBaseAriaLabel() {
        if (this._filteringExpressionsTree.filteringOperands.length > 0) {
            return this.selectionService.areAllRowSelected() ? 'Deselect all filtered' : 'Select all filtered';
        }

        return this.selectionService.areAllRowSelected() ? 'Deselect all' : 'Select all';
    }

    /**
     * @hidden
     * @internal
     */
    public get totalRowsCountAfterFilter() {
        if (this.data) {
            return this.selectionService.allData.length;
        }

        return 0;
    }

    /**
     * Returns the currently transformed paged/filtered/sorted/grouped pinned row data, displayed in the grid.
     * @example
     * ```typescript
     *      const pinnedDataView = this.grid.pinnedDataView;
     * ```
     */
    get pinnedDataView(): any[] {
        return this.pinnedRecords ? this.pinnedRecords : [];
    }

    /**
     * Returns currently transformed paged/filtered/sorted/grouped unpinned row data, displayed in the grid.
     * @example
     * ```typescript
     *      const pinnedDataView = this.grid.pinnedDataView;
     * ```
     */
    get unpinnedDataView(): any[] {
        return this.unpinnedRecords ? this.unpinnedRecords : this.verticalScrollContainer.igxForOf || [];
    }

    /**
     * Returns the currently transformed paged/filtered/sorted/grouped/pinned/unpinned row data, displayed in the grid.
     * @example
     * ```typescript
     *      const dataView = this.grid.dataView;
     * ```
     */
    get dataView(): any[] {
        return this.isRowPinningToTop ?
            [...this.pinnedDataView, ...this.unpinnedDataView] :
            [...this.unpinnedDataView, ...this.pinnedDataView];
    }

    /**
     * Get current selection state.
     * @example
     * Returns an array with selected rows' IDs (primaryKey or rowData)
     * ```typescript
     * const selectedRows = this.grid.selectedRows();
     * ```
     */
    public selectedRows(): any[] {
        return this.selectionService.getSelectedRows();
    }

    /**
     * Select specified rows by ID.
     * @example
     * ```typescript
     * this.grid.selectRows([1,2,5], true);
     * ```
     * @param rowIDs
     * @param clearCurrentSelection if true clears the current selection
     */
    public selectRows(rowIDs: any[], clearCurrentSelection?: boolean) {
        this.selectionService.selectRowsWithNoEvent(rowIDs, clearCurrentSelection);
        this.notifyChanges();
    }

    /**
     * Deselect specified rows by ID.
     * @example
     * ```typescript
     * this.grid.deselectRows([1,2,5]);
     * ```
     * @param rowIDs
     */
    public deselectRows(rowIDs: any[]) {
        this.selectionService.deselectRowsWithNoEvent(rowIDs);
        this.notifyChanges();
    }

    /**
     * Selects all rows
     * @remarks
     * By default if filtering is in place, selectAllRows() and deselectAllRows() select/deselect all filtered rows.
     * If you set the parameter onlyFilterData to false that will select all rows in the grid exept deleted rows.
     * @example
     * ```typescript
     * this.grid.selectAllRows();
     * this.grid.selectAllRows(false);
     * ```
     * @param onlyFilterData
     */
    public selectAllRows(onlyFilterData = true) {
        const data = onlyFilterData && this.filteredData ? this.filteredData : this.gridAPI.get_all_data(true);
        const rowIDs = this.selectionService.getRowIDs(data).filter(rID => !this.gridAPI.row_deleted_transaction(rID));
        this.selectRows(rowIDs);
    }

    /**
     * Deselects all rows
     * @remarks
     * By default if filtering is in place, selectAllRows() and deselectAllRows() select/deselect all filtered rows.
     * If you set the parameter onlyFilterData to false that will deselect all rows in the grid exept deleted rows.
     * @example
     * ```typescript
     * this.grid.deselectAllRows();
     * ```
     * @param onlyFilterData
     */
    public deselectAllRows(onlyFilterData = true) {
        if (onlyFilterData && this.filteredData && this.filteredData.length > 0) {
            this.deselectRows(this.selectionService.getRowIDs(this.filteredData));
        } else {
            this.selectionService.clearAllSelectedRows();
            this.notifyChanges();
        }
    }

    /**
     * @hidden @internal
     */
    public clearCellSelection(): void {
        this.selectionService.clear(true);
        this.notifyChanges();
    }

    /**
     * @hidden @internal
     */
    public dragScroll(dir: DragScrollDirection): void {
        const scrollDelta = 48;
        const horizontal = this.headerContainer.getScroll();
        const vertical = this.verticalScrollContainer.getScroll();
        switch (dir) {
            case DragScrollDirection.LEFT:
                horizontal.scrollLeft -= scrollDelta;
                break;
            case DragScrollDirection.RIGHT:
                horizontal.scrollLeft += scrollDelta;
                break;
            case DragScrollDirection.TOP:
                vertical.scrollTop -= scrollDelta;
                break;
            case DragScrollDirection.BOTTOM:
                vertical.scrollTop += scrollDelta;
                break;
            case DragScrollDirection.BOTTOMLEFT:
                horizontal.scrollLeft -= scrollDelta;
                vertical.scrollTop += scrollDelta;
                break;
            case DragScrollDirection.BOTTOMRIGHT:
                horizontal.scrollLeft += scrollDelta;
                vertical.scrollTop += scrollDelta;
                break;
            case DragScrollDirection.TOPLEFT:
                horizontal.scrollLeft -= scrollDelta;
                vertical.scrollTop -= scrollDelta;
                break;
            case DragScrollDirection.TOPRIGHT:
                horizontal.scrollLeft += scrollDelta;
                vertical.scrollTop -= scrollDelta;
                break;
            default:
                return;
        }
    }

    /**
     * @hidden @internal
     */
    public isDefined(arg: any): boolean {
        return arg !== undefined && arg !== null;
    }

    /**
     * @hidden @internal
     */
    public selectRange(arg: GridSelectionRange | GridSelectionRange[] | null | undefined): void {
        if (!this.isDefined(arg)) {
            this.clearCellSelection();
            return;
        }
        if (arg instanceof Array) {
            arg.forEach(range => this.setSelection(range));
        } else {
            this.setSelection(arg);
        }
        this.notifyChanges();
    }

    /**
     * @hidden @internal
     */
    public columnToVisibleIndex(field: string | number): number {
        const visibleColumns = this.visibleColumns;
        if (typeof field === 'number') {
            return field;
        }
        return visibleColumns.find(column => column.field === field).visibleIndex;
    }

    /**
     * @hidden @internal
     */
    public setSelection(range: GridSelectionRange): void {
        const startNode = { row: range.rowStart, column: this.columnToVisibleIndex(range.columnStart) };
        const endNode = { row: range.rowEnd, column: this.columnToVisibleIndex(range.columnEnd) };

        this.selectionService.pointerState.node = startNode;
        this.selectionService.selectRange(endNode, this.selectionService.pointerState);
        this.selectionService.addRangeMeta(endNode, this.selectionService.pointerState);
        this.selectionService.initPointerState();
    }

    /**
     * @hidden @internal
     */
    getSelectedRanges(): GridSelectionRange[] {
        return this.selectionService.ranges;
    }


    protected extractDataFromSelection(source: any[], formatters = false, headers = false): any[] {
        let columnsArray: IgxColumnComponent[];
        let record = {};
        const selectedData = [];
        const activeEl = this.selectionService.activeElement;
        const totalItems = (this as any).totalItemCount ?? 0;
        const isRemote = totalItems && totalItems > this.dataView.length;
        const selectionMap = isRemote ? Array.from(this.selectionService.selection) :
            Array.from(this.selectionService.selection).filter((tuple) => tuple[0] < source.length);

        if (this.cellSelection === GridSelectionMode.single && activeEl) {
            selectionMap.push([activeEl.row, new Set<number>().add(activeEl.column)]);
        }

        for (let [row, set] of selectionMap) {
            row = this.paging ? row + (this.perPage * this.page) : row;
            row = isRemote ? row - this.virtualizationState.startIndex : row;
            if (!source[row] || source[row].detailsData !== undefined) {
                continue;
            }
            const temp = Array.from(set);
            for (const each of temp) {
                columnsArray = this.getSelectableColumnsAt(each);
                columnsArray.forEach((col) => {
                    if (col) {
                        const key = headers ? col.header || col.field : col.field;
                        const value = source[row].ghostRecord ? source[row].recordRef[col.field] : source[row][col.field];
                        record[key] = formatters && col.formatter ? col.formatter(value) : value;
                    }
                });
            }
            if (Object.keys(record).length) {
                selectedData.push(record);
            }
            record = {};
        }
        return selectedData;
    }

    protected getSelectableColumnsAt(index) {
        if (this.hasColumnLayouts) {
            const visibleLayoutColumns = this.visibleColumns
                .filter(col => col.columnLayout)
                .sort((a, b) => a.visibleIndex - b.visibleIndex);
            const colLayout = visibleLayoutColumns[index];
            return colLayout ? colLayout.children.toArray() : [];
        } else {
            const visibleColumns = this.visibleColumns
                .filter(col => !col.columnGroup)
                .sort((a, b) => a.visibleIndex - b.visibleIndex);
            return [visibleColumns[index]];
        }
    }

    /**
     *
     * Returns an array of the current cell selection in the form of `[{ column.field: cell.value }, ...]`.
     * @remarks
     * If `formatters` is enabled, the cell value will be formatted by its respective column formatter (if any).
     * If `headers` is enabled, it will use the column header (if any) instead of the column field.
     */
    public getSelectedData(formatters = false, headers = false) {
        const source = this.filteredSortedData;
        return this.extractDataFromSelection(source, formatters, headers);
    }

   /**
    * Get current selected columns.
    * @example
    * Returns an array with selected columns
    * ```typescript
    * const selectedColumns = this.grid.selectedColumns();
    * ```
    */
    public selectedColumns(): IgxColumnComponent[] {
        const fields = this.selectionService.getSelectedColumns();
        return fields.map(field => this.getColumnByName(field)).filter(field => field);
    }

    /**
     * Select specified columns.
     * @example
     * ```typescript
     * this.grid.selectColumns(['ID','Name'], true);
     * ```
     * @param columns
     * @param clearCurrentSelection if true clears the current selection
     */
    public selectColumns(columns: string[] | IgxColumnComponent[], clearCurrentSelection?: boolean) {
        let fieldToSelect: string[] = [];
        if (columns.length === 0 || typeof columns[0] === 'string') {
            fieldToSelect = columns as string[];
        } else {
            (columns as IgxColumnComponent[]).forEach(col => {
                if (col.columnGroup) {
                   const children =  col.allChildren.filter(c => !c.columnGroup).map(c => c.field);
                   fieldToSelect = [...fieldToSelect, ...children];
                }  else {
                    fieldToSelect.push(col.field);
                }
            });
        }

        this.selectionService.selectColumnsWithNoEvent(fieldToSelect, clearCurrentSelection);
        this.notifyChanges();
    }

    /**
     * Deselect specified columns by filed.
     * @example
     * ```typescript
     * this.grid.deselectColumns(['ID','Name']);
     * ```
     * @param columns
     */
    public deselectColumns(columns: string[] | IgxColumnComponent[]) {
        let fieldToDeselect: string[] = [];
        if (columns.length === 0 || typeof columns[0] === 'string') {
            fieldToDeselect = columns as string[];
        } else {
            (columns as IgxColumnComponent[]).forEach(col => {
                if (col.columnGroup) {
                   const children =  col.allChildren.filter(c => !c.columnGroup).map(c => c.field);
                   fieldToDeselect = [...fieldToDeselect, ...children];
                }  else {
                    fieldToDeselect.push(col.field);
                }
            });
        }
        this.selectionService.deselectColumnsWithNoEvent(fieldToDeselect);
        this.notifyChanges();
    }

   /**
    * Deselects all columns
    * @example
    * ```typescript
    * this.grid.deselectAllColumns();
    * ```
    */
    public deselectAllColumns() {
        this.selectionService.clearAllSelectedColumns();
        this.notifyChanges();
    }

   /**
    * Selects all columns
    * @example
    * ```typescript
    * this.grid.deselectAllColumns();
    * ```
    */
    public selectAllColumns() {
        this.selectColumns(this.columnList.filter(c => !c.columnGroup));
    }

    protected extractDataFromColumnsSelection(source: any[], formatters = false, headers = false): any[] {
        let record = {};
        const selectedData = [];
        const selectedColumns = this.selectedColumns();
        if (selectedColumns.length === 0) {
            return [];
        }

        for (let rowIndex = 0; rowIndex < source.length; rowIndex++) {
            selectedColumns.forEach((col) => {
                const key = headers ? col.header || col.field : col.field;
                record[key] = formatters && col.formatter ? col.formatter(source[rowIndex][col.field])
                    : source[rowIndex][col.field];
            });

            if (Object.keys(record).length) {
                selectedData.push(record);
            }
            record = {};
        }
        return selectedData;
    }

    /**
     *
     * Returns an array of the current columns selection in the form of `[{ column.field: cell.value }, ...]`.
     * @remarks
     * If `formatters` is enabled, the cell value will be formatted by its respective column formatter (if any).
     * If `headers` is enabled, it will use the column header (if any) instead of the column field.
     */
    public getSelectedColumnsData(formatters = false, headers = false) {
        const source = this.filteredSortedData ?  this.filteredSortedData : this.data;
        return this.extractDataFromColumnsSelection(source, formatters, headers);
    }

    /**
     * @hidden @internal
     */
    public preventContainerScroll = (evt) => {
        if (evt.target.scrollTop !== 0) {
            this.verticalScrollContainer.addScrollTop(evt.target.scrollTop);
            evt.target.scrollTop = 0;
        }
        if (evt.target.scrollLeft !== 0) {
            this.headerContainer.scrollPosition += evt.target.scrollLeft;
            evt.target.scrollLeft = 0;
        }
    }

    /**
     * @hidden @internal
     */
    copyHandlerIE() {
        if (isIE()) {
            this.copyHandler(null, true);
        }
    }

    /**
     * @hidden
     * @internal
     */
    public copyHandler(event, ie11 = false) {
        if (!this.clipboardOptions.enabled || this.crudService.inEditMode) {
            return;
        }

        const data = this.getSelectedData(this.clipboardOptions.copyFormatters, this.clipboardOptions.copyHeaders);
        const ev = { data, cancel: false } as IGridClipboardEvent;
        this.onGridCopy.emit(ev);

        if (ev.cancel) {
            return;
        }

        const transformer = new CharSeparatedValueData(ev.data, this.clipboardOptions.separator);
        let result = transformer.prepareData();

        if (!this.clipboardOptions.copyHeaders) {
            result = result.substring(result.indexOf('\n') + 1);
        }

        if (ie11) {
            (window as any).clipboardData.setData('Text', result);
            return;
        }

        event.preventDefault();

        /* Necessary for the hiearachical case but will probably have to
           change how getSelectedData is propagated in the hiearachical grid
        */
        event.stopPropagation();
        event.clipboardData.setData('text/plain', result);
    }

    /**
     * Navigates to a position in the grid based on provided `rowindex` and `visibleColumnIndex`.
     * @remarks
     * Also can execute a custom logic over the target element,
     * through a callback function that accepts { targetType: GridKeydownTargetType, target: Object }
     * @example
     * ```typescript
     *  this.grid.navigateTo(10, 3, (args) => { args.target.nativeElement.focus(); });
     * ```
     */
    public navigateTo(rowIndex: number, visibleColIndex = -1, cb: Function = null) {
        const totalItems = (this as any).totalItemCount ?? this.dataView.length - 1;
        if (rowIndex < 0 || rowIndex > totalItems || (visibleColIndex !== -1
            && this.columnList.map(col => col.visibleIndex).indexOf(visibleColIndex) === -1)) {
            return;
        }
        if (this.dataView.slice(rowIndex, rowIndex + 1).find(rec => rec.expression || rec.childGridsData)) {
            visibleColIndex = -1;
        }
        // If the target row is pinned no need to scroll as well.
        const shouldScrollVertically = this.navigation.shouldPerformVerticalScroll(rowIndex, visibleColIndex);
        const shouldScrollHorizontally = this.navigation.shouldPerformHorizontalScroll(visibleColIndex, rowIndex);
        if (shouldScrollVertically) {
            this.navigation.performVerticalScrollToCell(rowIndex, visibleColIndex, () => {
                if (shouldScrollHorizontally) {
                    this.navigation.performHorizontalScrollToCell(visibleColIndex, () =>
                     this.executeCallback(rowIndex, visibleColIndex, cb));
                } else {
                    this.executeCallback(rowIndex, visibleColIndex, cb);
                }});
        } else if (shouldScrollHorizontally) {
            this.navigation.performHorizontalScrollToCell(visibleColIndex, () => {
                if (shouldScrollVertically) {
                    this.navigation.performVerticalScrollToCell(rowIndex, visibleColIndex, () =>
                        this.executeCallback(rowIndex, visibleColIndex, cb));
                } else {
                    this.executeCallback(rowIndex, visibleColIndex, cb);
                }});
        } else {
            this.executeCallback(rowIndex, visibleColIndex, cb);
        }
    }

   /**
    * Returns `ICellPosition` which defines the next cell,
    * according to the current position, that match specific criteria.
    * @remarks
    * You can pass callback function as a third parameter of `getPreviousCell` method.
    * The callback function accepts IgxColumnComponent as a param
    * @example
    * ```typescript
    *  const nextEditableCellPosition = this.grid.getNextCell(0, 3, (column) => column.editable);
    * ```
    */
    public getNextCell(currRowIndex: number, curVisibleColIndex: number,
        callback: (IgxColumnComponent) => boolean = null): ICellPosition {
        const columns = this.columnList.filter(col => !col.columnGroup && col.visibleIndex >= 0);

        if (!this.isValidPosition(currRowIndex, curVisibleColIndex)) {
            return { rowIndex: currRowIndex, visibleColumnIndex: curVisibleColIndex };
        }
        const colIndexes = callback ? columns.filter((col) => callback(col)).map(editCol => editCol.visibleIndex).sort((a, b) => a - b) :
            columns.map(editCol => editCol.visibleIndex).sort((a, b) => a - b);
        const nextCellIndex = colIndexes.find(index => index > curVisibleColIndex);
        if (this.dataView.slice(currRowIndex, currRowIndex + 1)
            .find(rec => !rec.expression && !rec.summaries && !rec.childGridsData && !rec.detailsData) && nextCellIndex !== undefined) {
            return { rowIndex: currRowIndex, visibleColumnIndex: nextCellIndex };
        } else {
            if (colIndexes.length === 0 || this.getNextDataRowIndex(currRowIndex) === currRowIndex) {
                return { rowIndex: currRowIndex, visibleColumnIndex: curVisibleColIndex };
            } else {
                return { rowIndex: this.getNextDataRowIndex(currRowIndex), visibleColumnIndex: colIndexes[0] };
            }
        }
    }

   /**
    * Returns `ICellPosition` which defines the previous cell,
    * according to the current position, that match specific criteria.
    * @remarks
    * You can pass callback function as a third parameter of `getPreviousCell` method.
    * The callback function accepts IgxColumnComponent as a param
    * @example
    * ```typescript
    *  const previousEditableCellPosition = this.grid.getPreviousCell(0, 3, (column) => column.editable);
    * ```
    */
    public getPreviousCell(currRowIndex: number, curVisibleColIndex: number,
        callback: (IgxColumnComponent) => boolean = null): ICellPosition {
        const columns = this.columnList.filter(col => !col.columnGroup && col.visibleIndex >= 0);

        if (!this.isValidPosition(currRowIndex, curVisibleColIndex)) {
            return { rowIndex: currRowIndex, visibleColumnIndex: curVisibleColIndex };
        }
        const colIndexes = callback ? columns.filter((col) => callback(col)).map(editCol => editCol.visibleIndex).sort((a, b) => b - a) :
            columns.map(editCol => editCol.visibleIndex).sort((a, b) => b - a);
        const prevCellIndex = colIndexes.find(index => index < curVisibleColIndex);
        if (this.dataView.slice(currRowIndex, currRowIndex + 1)
            .find(rec => !rec.expression && !rec.summaries && !rec.childGridsData && !rec.detailsData) && prevCellIndex !== undefined) {
            return { rowIndex: currRowIndex, visibleColumnIndex: prevCellIndex };
        } else {
            if (colIndexes.length === 0 || this.getNextDataRowIndex(currRowIndex, true) === currRowIndex) {
                return { rowIndex: currRowIndex, visibleColumnIndex: curVisibleColIndex };
            } else {
                return { rowIndex: this.getNextDataRowIndex(currRowIndex, true), visibleColumnIndex: colIndexes[0] };
            }
        }
    }

    private executeCallback(rowIndex, visibleColIndex = -1, cb: Function = null) {
        if (!cb) { return; }
        let row = this.summariesRowList.filter(s => s.index !== 0).concat(this.rowList.toArray()).find(r => r.index === rowIndex);
        if (!row) {
            if ((this as any).totalItemCount) {
                this.verticalScrollContainer.onDataChanged.pipe(first()).subscribe(() => {
                    this.cdr.detectChanges();
                    row = this.summariesRowList.filter(s => s.index !== 0).concat(this.rowList.toArray()).find(r => r.index === rowIndex);
                    const cbArgs = this.getNavigationArguments(row, visibleColIndex);
                    cb(cbArgs);
                });
            }
            return;
        }
        const args = this.getNavigationArguments(row, visibleColIndex);
        cb(args);
    }

    private getNavigationArguments(row, visibleColIndex) {
        let targetType, target;
        switch (row.nativeElement.tagName.toLowerCase()) {
            case 'igx-grid-groupby-row':
                targetType = GridKeydownTargetType.groupRow;
                target = row;
                break;
            case 'igx-grid-summary-row':
                targetType = GridKeydownTargetType.summaryCell;
                target = visibleColIndex !== -1 ?
                    row.summaryCells.find(c => c.visibleColumnIndex === visibleColIndex) : row.summaryCells.first;
                break;
            case 'igx-child-grid-row':
                targetType = GridKeydownTargetType.hierarchicalRow;
                target = row;
                break;
            default:
                targetType = GridKeydownTargetType.dataCell;
                target = visibleColIndex !== -1 ? row.cells.find(c => c.visibleColumnIndex === visibleColIndex) : row.cells.first;
                break;
        }
        return { targetType: targetType, target: target };
    }

    private getNextDataRowIndex(currentRowIndex, previous = false): number {
        if (currentRowIndex < 0 || (currentRowIndex === 0 && previous) || (currentRowIndex >= this.dataView.length - 1 && !previous)) {
            return currentRowIndex;
        }
        // find next/prev record that is editable.
        const nextRowIndex = previous ? this.findPrevEditableDataRowIndex(currentRowIndex) :
        this.dataView.findIndex((rec, index) =>
        index > currentRowIndex && this.isEditableDataRecordAtIndex(index));
        return nextRowIndex !== -1 ? nextRowIndex : currentRowIndex ;
    }

    /**
     * Returns the previous editable row index or -1 if no such row is found.
     * @param currentIndex The index of the current editable record.
     */
    private findPrevEditableDataRowIndex(currentIndex): number {
        let i = this.dataView.length;
        while (i--) {
            if (i < currentIndex && this.isEditableDataRecordAtIndex(i)) {
                return i;
            }
        }
        return -1;
    }


    /**
     * Returns if the record at the specified data view index is a an editable data record.
     * If record is group rec, summary rec, child rec, ghost rec. etc. it is not editable.
     * @param dataViewIndex The index of that record in the data view.
     */
    private isEditableDataRecordAtIndex(dataViewIndex) {
        const rec = this.dataView[dataViewIndex];
        return !rec.expression && !rec.summaries && !rec.childGridsData && !rec.detailsData &&
        !this.isGhostRecordAtIndex(dataViewIndex);
    }

    /**
     * Returns if the record at the specified data view index is a ghost.
     * If record is pinned but is not in pinned area then it is a ghost record.
     * @param dataViewIndex The index of that record in the data view.
     */
    private isGhostRecordAtIndex(dataViewIndex) {
        const isPinned = this.isRecordPinned(this.dataView[dataViewIndex]);
        const isInPinnedArea = this.isRecordPinnedByViewIndex(dataViewIndex);
        return isPinned && !isInPinnedArea;
    }

    private isValidPosition(rowIndex, colIndex): boolean {
        const rows = this.summariesRowList.filter(s => s.index !== 0).concat(this.rowList.toArray()).length;
        const cols = this.columnList.filter(col => !col.columnGroup && col.visibleIndex >= 0 && !col.hidden).length;
        if (rows < 1 || cols < 1) { return false; }
        if (rowIndex > -1 && rowIndex < this.dataView.length &&
            colIndex > - 1 && colIndex <= Math.max(...this.visibleColumns.map(c => c.visibleIndex))) {
            return true;
        }
        return false;
    }

    /**
     * @hidden @internal
     */
    public trackColumnChanges(index, col) {
        return col.field + col._calcWidth;
    }

    private find(text: string, increment: number, caseSensitive?: boolean, exactMatch?: boolean, scroll?: boolean, endEdit = true) {
        if (!this.rowList) {
            return 0;
        }

        if (endEdit) {
            this.endEdit(false);
        }

        if (!text) {
            this.clearSearch();
            return 0;
        }

        const caseSensitiveResolved = caseSensitive ? true : false;
        const exactMatchResolved = exactMatch ? true : false;
        let rebuildCache = false;

        if (this.lastSearchInfo.searchText !== text ||
            this.lastSearchInfo.caseSensitive !== caseSensitiveResolved ||
            this.lastSearchInfo.exactMatch !== exactMatchResolved) {
            this.lastSearchInfo = {
                searchText: text,
                activeMatchIndex: 0,
                caseSensitive: caseSensitiveResolved,
                exactMatch: exactMatchResolved,
                matchInfoCache: []
            };

            rebuildCache = true;
        } else {
            this.lastSearchInfo.activeMatchIndex += increment;
        }

        if (rebuildCache) {
            this.rowList.forEach((row) => {
                if (row.cells) {
                    row.cells.forEach((c) => {
                        c.highlightText(text, caseSensitiveResolved, exactMatchResolved);
                    });
                }
            });

            this.rebuildMatchCache();
        }

        if (this.lastSearchInfo.activeMatchIndex >= this.lastSearchInfo.matchInfoCache.length) {
            this.lastSearchInfo.activeMatchIndex = 0;
        } else if (this.lastSearchInfo.activeMatchIndex < 0) {
            this.lastSearchInfo.activeMatchIndex = this.lastSearchInfo.matchInfoCache.length - 1;
        }

        if (this.lastSearchInfo.matchInfoCache.length) {
            const matchInfo = this.lastSearchInfo.matchInfoCache[this.lastSearchInfo.activeMatchIndex];
            this.lastSearchInfo = { ...this.lastSearchInfo };

            if (scroll !== false) {
                this.scrollTo(matchInfo.row, matchInfo.column);
            }

            IgxTextHighlightDirective.setActiveHighlight(this.id, {
                column: matchInfo.column,
                row: matchInfo.row,
                index: matchInfo.index,
                metadata: matchInfo.metadata,
            });

        } else {
            IgxTextHighlightDirective.clearActiveHighlight(this.id);
        }

        return this.lastSearchInfo.matchInfoCache.length;
    }

    /**
     * Returns an array containing the filtered sorted data.
     * @example
     * ```typescript
     * const filteredSortedData = this.grid1.filteredSortedData;
     * ```
     */
    get filteredSortedData(): any[] {
        return this._filteredSortedData;
    }

    /**
     * @hidden
     */
    protected initPinning() {
        let currentPinnedWidth = 0;
        const pinnedColumns = [];
        const unpinnedColumns = [];

        this.calculateGridWidth();
        this.resetCaches();
        // When a column is a group or is inside a group, pin all related.
        this._pinnedColumns.forEach(col => {
            if (col.parent) {
                col.parent.pinned = true;
            }
            if (col.columnGroup) {
                col.children.forEach(child => child.pinned = true);
            }
        });

        // Make sure we don't exceed unpinned area min width and get pinned and unpinned col collections.
        // We take into account top level columns (top level groups and non groups).
        // If top level is unpinned the pinning handles all children to be unpinned as well.
        for (let i = 0; i < this._columns.length; i++) {
            if (this._columns[i].pinned && !this._columns[i].parent) {
                // Pinned column. Check if with it the unpinned min width is exceeded.
                const colWidth = parseInt(this._columns[i].width, 10);
                currentPinnedWidth += colWidth;
                pinnedColumns.push(this._columns[i]);
            } else if (this._columns[i].pinned && this._columns[i].parent) {
                if (this._columns[i].topLevelParent.pinned) {
                    pinnedColumns.push(this._columns[i]);
                } else {
                    this._columns[i].pinned = false;
                    unpinnedColumns.push(this._columns[i]);
                }
            } else {
                unpinnedColumns.push(this._columns[i]);
            }
        }

        // Assign the applicaple collections.
        this._pinnedColumns = pinnedColumns;
        this._unpinnedColumns = unpinnedColumns;
        this.notifyChanges();
    }

    /**
     * @hidden
     */
    protected scrollTo(row: any | number, column: any | number, inCollection = this._filteredSortedUnpinnedData): void {
        let delayScrolling = false;

        if (this.paging && typeof (row) !== 'number') {
            const rowIndex = inCollection.indexOf(row);
            const page = Math.floor(rowIndex / this.perPage);

            if (this.page !== page) {
                delayScrolling = true;
                this.page = page;
            }
        }

        if (delayScrolling) {
            this.verticalScrollContainer.onDataChanged.pipe(first()).subscribe(() => {
                this.scrollDirective(this.verticalScrollContainer,
                    typeof (row) === 'number' ? row : this.unpinnedDataView.indexOf(row));
            });
        } else {
            this.scrollDirective(this.verticalScrollContainer,
                typeof (row) === 'number' ? row : this.unpinnedDataView.indexOf(row));
        }

        this.scrollToHorizontally(column);
    }

    /**
     * @hidden
     */
    protected scrollToHorizontally(column: any | number) {
        let columnIndex = typeof column === 'number' ? column : this.getColumnByName(column).visibleIndex;
        const scrollRow = this.rowList.find(r => r.virtDirRow);
        const virtDir = scrollRow ? scrollRow.virtDirRow : null;
        if (this.isPinningToStart && this.pinnedColumns.length) {
            if (columnIndex >= this.pinnedColumns.length) {
                columnIndex -= this.pinnedColumns.length;
                this.scrollDirective(virtDir, columnIndex);
            }
        } else {
            this.scrollDirective(virtDir, columnIndex);
        }
    }

    /**
     * @hidden
     */
    protected scrollDirective(directive: IgxGridForOfDirective<any>, goal: number): void {
        if (!directive) {
            return;
        }
        directive.scrollTo(goal);
    }

    private rebuildMatchCache() {
        this.lastSearchInfo.matchInfoCache = [];

        const caseSensitive = this.lastSearchInfo.caseSensitive;
        const exactMatch = this.lastSearchInfo.exactMatch;
        const searchText = caseSensitive ? this.lastSearchInfo.searchText : this.lastSearchInfo.searchText.toLowerCase();
        const data = this.filteredSortedData;
        const columnItems = this.visibleColumns.filter((c) => !c.columnGroup).sort((c1, c2) => c1.visibleIndex - c2.visibleIndex);

        const numberPipe = new IgxDecimalPipeComponent(this.locale);
        const datePipe = new IgxDatePipeComponent(this.locale);
        data.forEach((dataRow, rowIndex) => {
            columnItems.forEach((c) => {
                const value = c.formatter ? c.formatter(dataRow[c.field]) :
                    c.dataType === 'number' ? numberPipe.transform(dataRow[c.field], this.locale) :
                        c.dataType === 'date' ? datePipe.transform(dataRow[c.field], this.locale)
                            : dataRow[c.field];
                if (value !== undefined && value !== null && c.searchable) {
                    let searchValue = caseSensitive ? String(value) : String(value).toLowerCase();

                    if (exactMatch) {
                        if (searchValue === searchText) {
                            const metadata = new Map<string, any>();
                            metadata.set('pinned', this.isRecordPinnedByIndex(rowIndex));
                            this.lastSearchInfo.matchInfoCache.push({
                                row: dataRow,
                                column: c.field,
                                index: 0,
                                metadata: metadata,
                            });
                        }
                    } else {
                        let occurenceIndex = 0;
                        let searchIndex = searchValue.indexOf(searchText);

                        while (searchIndex !== -1) {
                            const metadata = new Map<string, any>();
                            metadata.set('pinned', this.isRecordPinnedByIndex(rowIndex));
                            this.lastSearchInfo.matchInfoCache.push({
                                row: dataRow,
                                column: c.field,
                                index: occurenceIndex++,
                                metadata: metadata,
                            });

                            searchValue = searchValue.substring(searchIndex + searchText.length);
                            searchIndex = searchValue.indexOf(searchText);
                        }
                    }
                }
            });
        });
    }

    /**
     * @hidden
     */
    public isExpandedGroup(_group: IGroupByRecord): boolean {
        return undefined;
    }

    protected changeRowEditingOverlayStateOnScroll(row: IgxRowDirective<IgxGridBaseDirective & GridType>) {
        if (!this.rowEditable || !this.rowEditingOverlay || this.rowEditingOverlay.collapsed) {
            return;
        }
        if (!row) {
            this.toggleRowEditingOverlay(false);
        } else {
            this.repositionRowEditingOverlay(row);
        }
    }

    /**
     * Should be called when data and/or isLoading input changes so that the overlay can be
     * hidden/shown based on the current value of shouldOverlayLoading
     */
    protected evaluateLoadingState() {
        if (this.shouldOverlayLoading) {
            // a new overlay should be shown
            const overlaySettings: OverlaySettings = {
                outlet: this.loadingOutlet,
                closeOnOutsideClick: false,
                positionStrategy: new ContainerPositionStrategy()
            };
            if (!this._loadingId) {
                this._loadingId = this.overlayService.attach(this.loadingOverlay, overlaySettings);
                this.overlayService.show(this._loadingId, overlaySettings);
            }
        } else {
            if (this._loadingId) {
                this.overlayService.hide(this._loadingId);
                this._loadingId = null;
            }
        }
    }

    /**
     * @hidden @internal
     */
    openRowOverlay(id) {
        this.configureRowEditingOverlay(id, this.rowList.length <= MIN_ROW_EDITING_COUNT_THRESHOLD);

        this.rowEditingOverlay.open(this.rowEditSettings);
        this.rowEditPositioningStrategy.isTopInitialPosition = this.rowEditPositioningStrategy.isTop;
        this.rowEditingOverlay.element.addEventListener('wheel', this.rowEditingWheelHandler);
    }

    /**
     * @hidden @internal
     */
    public closeRowEditingOverlay() {
        this.rowEditingOverlay.element.removeEventListener('wheel', this.rowEditingWheelHandler);
        this.rowEditPositioningStrategy.isTopInitialPosition = null;
        this.rowEditingOverlay.close();
        this.rowEditingOverlay.element.parentElement.style.display = '';
    }

    /**
     * @hidden @internal
     */
    public toggleRowEditingOverlay(show) {
        const rowStyle = this.rowEditingOverlay.element.style;
        if (show) {
            rowStyle.display = 'block';
        } else {
            rowStyle.display = 'none';
        }
    }

    /**
     * @hidden @internal
     */
    public repositionRowEditingOverlay(row: IgxRowDirective<IgxGridBaseDirective & GridType>) {
        if (row && !this.rowEditingOverlay.collapsed) {
            const rowStyle = this.rowEditingOverlay.element.parentElement.style;
            if (row) {
                rowStyle.display = '';
                this.configureRowEditingOverlay(row.rowID);
                this.rowEditingOverlay.reposition();
            } else {
                rowStyle.display = 'none';
            }
        }
    }

    private configureRowEditingOverlay(rowID: any, useOuter = false) {
        this.rowEditSettings.outlet = useOuter ? this.parentRowOutletDirective : this.rowOutletDirective;
        this.rowEditPositioningStrategy.settings.container = this.tbody.nativeElement;
        const pinned =  this._pinnedRecordIDs.indexOf(rowID) !== -1;
        const targetRow = !pinned ? this.gridAPI.get_row_by_key(rowID) : this.pinnedRows.find(x => x.rowID === rowID);
        if (!targetRow) {
            return;
        }
        this.rowEditPositioningStrategy.settings.target = targetRow.element.nativeElement;
        this.toggleRowEditingOverlay(true);
    }

    /**
     * @hidden @internal
     */
    public get rowChangesCount() {
        if (!this.crudService.row) {
            return 0;
        }
        const rowChanges = this.transactions.getAggregatedValue(this.crudService.row.id, false);
        return rowChanges ? Object.keys(rowChanges).length : 0;
    }

    protected writeToData(rowIndex: number, value: any) {
        mergeObjects(this.gridAPI.get_all_data()[rowIndex], value);
    }

    /**
     * @hidden @internal
     */
    endRowTransaction(commit: boolean, row: IgxRow) {
        row.newData = this.transactions.getAggregatedValue(row.id, true);

        let args = row.createEditEventArgs();

        if (!commit) {
            this.onRowEditCancel.emit(args);
            this.transactions.endPending(false);
        } else {
            args = this.gridAPI.update_row(row, row.newData);
        }
        if (args.cancel) {
            this.transactions.startPending();
            return;
        }
        this.crudService.endRowEdit();
        this.closeRowEditingOverlay();
    }

    /**
     * @hidden @internal
     */
    public gridOutletKeyboardHandler(event) {
        // TODO: This should be removed after grid keyboard refactoring
        // call stopPropagation for keydown event for the outlet not to propagate event to the grid
        event.stopPropagation();
    }

    // TODO: Refactor
    /**
     * Finishes the row transactions on the current row.
     * @remarks
     * If `commit === true`, passes them from the pending state to the data (or transaction service)
     * @example
     * ```html
     * <button igxButton (click)="grid.endEdit(true)">Commit Row</button>
     * ```
     * @param commit
     */
    public endEdit(commit = true, event?: Event) {
        const row = this.crudService.row;
        const cell = this.crudService.cell;

        // TODO: Merge the crudService with wht BaseAPI service
        if (!row && !cell) { return; }

        commit ? this.gridAPI.submit_value() : this.gridAPI.escape_editMode();

        if (!this.rowEditable || this.rowEditingOverlay && this.rowEditingOverlay.collapsed || !row) {
            return;
        }

        this.endRowTransaction(commit, row);

        const activeCell = this.selectionService.activeElement;
        if (event && activeCell) {
            const rowIndex = activeCell.row;
            const visibleColIndex = activeCell.layout ? activeCell.layout.columnVisibleIndex : activeCell.column;
            this.navigateTo(rowIndex, visibleColIndex, (c) => {
                if (c.targetType === GridKeydownTargetType.dataCell && c.target) {
                    c.target.activate();
                }
            });
        }
    }

    /**
     * @hidden
     * @internal
     */
    public endRowEdit(commit = true, event?: Event) {
        this.endEdit(commit, event);
        const activeCell = this.navigation.activeNode;
        if (activeCell && activeCell.row !== -1) {
            this.tbody.nativeElement.focus();
        }
    }
    /**
     * @hidden
     */
    private rowEditingWheelHandler = (event: WheelEvent) => {
        if (event.deltaY > 0) {
            this.verticalScrollContainer.scrollNext();
        } else {
            this.verticalScrollContainer.scrollPrev();
        }
    }

    /**
     * @hidden @internal
     */
    public get dataWithAddedInTransactionRows() {
        const result = <any>cloneArray(this.gridAPI.get_all_data());
        if (this.transactions.enabled) {
            result.push(...this.transactions.getAggregatedChanges(true)
                .filter(t => t.type === TransactionType.ADD)
                .map(t => t.newValue));
        }

        return result;
    }

    /**
     * @hidden @internal
     */
    public get dataLength() {
        return this.transactions.enabled ? this.dataWithAddedInTransactionRows.length : this.gridAPI.get_all_data().length;
    }

    /**
     * @hidden @internal
     */
    public hasHorizontalScroll() {
        return this.totalWidth - this.unpinnedWidth > 0;
    }

    protected _restoreVirtState(row) {
        // check virtualization state of data record added from cache
        // in case state is no longer valid - update it.
        const rowForOf = row.virtDirRow;
        const gridScrLeft = rowForOf.getScroll().scrollLeft;
        const left = -parseInt(rowForOf.dc.instance._viewContainer.element.nativeElement.style.left, 10);
        const actualScrollLeft = left + rowForOf.getColumnScrollLeft(rowForOf.state.startIndex);
        if (gridScrLeft !== actualScrollLeft) {
            rowForOf.onHScroll(gridScrLeft);
            rowForOf.cdr.detectChanges();
        }
    }

    /**
     * @hidden
     */
    protected getExportExcel(): boolean {
        return this._exportExcel;
    }

    /**
     * @hidden
     */
    protected getExportCsv(): boolean {
        return this._exportCsv;
    }

    /**
     * @hidden @internal
     */
    get shouldOverlayLoading(): boolean {
        return this.isLoading && this.data && this.data.length > 0;
    }

    /**
     * @hidden @internal
     */
    public isSummaryRow(rowData): boolean {
        return rowData.summaries && (rowData.summaries instanceof Map);
    }

    /**
     * @hidden @internal
     */
    public get isMultiRowSelectionEnabled(): boolean {
        return this.rowSelection === GridSelectionMode.multiple;
    }

    /**
     * @hidden @internal
     */
    public get isRowSelectable(): boolean {
        return this.rowSelection !== GridSelectionMode.none;
    }

    /**
     * @hidden @internal
     */
    public get isCellSelectable() {
        return this.cellSelection !== GridSelectionMode.none;
    }

    /**
     * @hidden @internal
     */
    public cachedViewLoaded(args: ICachedViewLoadedEventArgs) {
        if (this.hasHorizontalScroll()) {
            const tmplId = args.context.templateID;
            const index = args.context.index;
            args.view.detectChanges();
            this.zone.onStable.pipe(first()).subscribe(() => {
                const row = tmplId === 'dataRow' ? this.getRowByIndex(index) : null;
                const summaryRow = tmplId === 'summaryRow' ? this.summariesRowList.find((sr) => sr.dataRowIndex === index) : null;
                if (row && row instanceof IgxRowDirective) {
                    this._restoreVirtState(row);
                } else if (summaryRow) {
                    this._restoreVirtState(summaryRow);
                }
            });
        }
    }

    /**
     * Opens the advanced filtering dialog.
     */
    public openAdvancedFilteringDialog() {
        if (!this._advancedFilteringOverlayId) {
            this._advancedFilteringOverlaySettings.positionStrategy.settings.target =
                (this as any).rootGrid ? (this as any).rootGrid.nativeElement : this.nativeElement;
            this._advancedFilteringOverlaySettings.outlet = this.outlet;

            this._advancedFilteringOverlayId = this.overlayService.attach(
                IgxAdvancedFilteringDialogComponent,
                this._advancedFilteringOverlaySettings,
                {
                    injector: this.viewRef.injector,
                    componentFactoryResolver: this.resolver
                });
            this.overlayService.show(this._advancedFilteringOverlayId, this._advancedFilteringOverlaySettings);
        }
    }

    /**
     * Closes the advanced filtering dialog.
     * @param applyChanges indicates whether the changes should be applied
     */
    public closeAdvancedFilteringDialog(applyChanges: boolean) {
        if (this._advancedFilteringOverlayId) {
            const advancedFilteringOverlay = this.overlayService.getOverlayById(this._advancedFilteringOverlayId);
            const advancedFilteringDialog = advancedFilteringOverlay.componentRef.instance as IgxAdvancedFilteringDialogComponent;

            if (applyChanges) {
                advancedFilteringDialog.applyChanges();
            }
            advancedFilteringDialog.closeDialog();
        }
    }
}
