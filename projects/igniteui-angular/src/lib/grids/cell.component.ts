﻿import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostBinding,
    HostListener,
    Input,
    TemplateRef,
    ViewChild,
    NgZone,
    OnInit,
    OnDestroy,
    OnChanges,
    SimpleChanges
} from '@angular/core';
import { IgxTextHighlightDirective } from '../directives/text-highlight/text-highlight.directive';
import { GridBaseAPIService } from './api.service';
import {
    getNodeSizeViaRange, isIE, isLeftClick, PlatformUtil
} from '../core/utils';
import { State } from '../services/public_api';
import { IgxGridBaseDirective } from './grid-base.directive';
import { IgxGridSelectionService, ISelectionNode, IgxGridCRUDService } from './selection/selection.service';
import { DeprecateMethod } from '../core/deprecateDecorators';
import { HammerGesturesManager } from '../core/touch';
import { ColumnType } from './common/column.interface';
import { RowType } from './common/row.interface';
import { GridSelectionMode } from './common/enums';
import { GridType } from './common/grid.interface';
import { ISearchInfo } from './grid/public_api';

/**
 * Providing reference to `IgxGridCellComponent`:
 * ```typescript
 * @ViewChild('grid', { read: IgxGridComponent })
 *  public grid: IgxGridComponent;
 * ```
 * ```typescript
 *  let column = this.grid.columnList.first;
 * ```
 * ```typescript
 *  let cell = column.cells[0];
 * ```
 */
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'igx-grid-cell',
    templateUrl: './cell.component.html',
    providers: [HammerGesturesManager]
})
export class IgxGridCellComponent implements OnInit, OnChanges, OnDestroy {
    private _vIndex = -1;
    protected _lastSearchInfo: ISearchInfo;

    /**
     * Gets the column of the cell.
     * ```typescript
     *  let cellColumn = this.cell.column;
     * ```
     * @memberof IgxGridCellComponent
     */
    @Input()
    public column: ColumnType;

    /**
     * Gets the row of the cell.
     * ```typescript
     * let cellRow = this.cell.row;
     * ```
     * @memberof IgxGridCellComponent
     */
    @Input()
    public row: RowType;

    /**
     * Gets the data of the row of the cell.
     * ```typescript
     * let rowData = this.cell.rowData;
     * ```
     * @memberof IgxGridCellComponent
     */
    @Input()
    public rowData: any;

    /**
     * Sets/gets the template of the cell.
     * ```html
     * <ng-template #cellTemplate igxCell let-value>
     *   <div style="font-style: oblique; color:blueviolet; background:red">
     *       <span>{{value}}</span>
     *   </div>
     * </ng-template>
     * ```
     * ```typescript
     * @ViewChild('cellTemplate',{read: TemplateRef})
     * cellTemplate: TemplateRef<any>;
     * ```
     * ```typescript
     * this.cell.cellTemplate = this.cellTemplate;
     * ```
     * ```typescript
     * let template =  this.cell.cellTemplate;
     * ```
     * @memberof IgxGridCellComponent
     */
    @Input()
    public cellTemplate: TemplateRef<any>;

    @Input()
    public pinnedIndicator: TemplateRef<any>;

    /**
     * Sets/gets the cell value.
     * ```typescript
     * this.cell.value = "Cell Value";
     * ```
     * ```typescript
     * let cellValue = this.cell.value;
     * ```
     * @memberof IgxGridCellComponent
     */
    @Input()
    public value: any;

    /**
     * Sets/gets the highlight class of the cell.
     * Default value is `"igx-highlight"`.
     * ```typescript
     * let highlightClass = this.cell.highlightClass;
     * ```
     * ```typescript
     * this.cell.highlightClass = 'igx-cell-highlight';
     * ```
     * @memberof IgxGridCellComponent
     */
    public highlightClass = 'igx-highlight';

    /**
     * Sets/gets the active highlight class class of the cell.
     * Default value is `"igx-highlight__active"`.
     * ```typescript
     * let activeHighlightClass = this.cell.activeHighlightClass;
     * ```
     * ```typescript
     * this.cell.activeHighlightClass = 'igx-cell-highlight_active';
     * ```
     * @memberof IgxGridCellComponent
     */
    public activeHighlightClass = 'igx-highlight__active';

    /**
     * Gets the cell formatter.
     * ```typescript
     * let cellForamatter = this.cell.formatter;
     * ```
     * @memberof IgxGridCellComponent
     */
    @Input()
    formatter: (value: any) => any;

    /**
     * Gets the cell template context object.
     * ```typescript
     *  let context = this.cell.context();
     * ```
     * @memberof IgxGridCellComponent
     */
    get context(): any {
        return {
            $implicit: this.value,
            cell: this
        };
    }

    /**
     * Gets the cell template.
     * ```typescript
     * let template = this.cell.template;
     * ```
     * @memberof IgxGridCellComponent
     */
    get template(): TemplateRef<any> {
        if (this.editMode) {
            const inlineEditorTemplate = this.column.inlineEditorTemplate;
            return inlineEditorTemplate ? inlineEditorTemplate : this.inlineEditorTemplate;
        }
        if (this.cellTemplate) {
            return this.cellTemplate;
        }
        return this.defaultCellTemplate;
    }

    /**
     * Gets the cell template.
     * ```typescript
     * let template = this.cell.template;
     * ```
     * @memberof IgxGridCellComponent
     */
    get pinnedIndicatorTemplate() {
        if (this.pinnedIndicator) {
            return this.pinnedIndicator;
        }
        return this.defaultPinnedIndicator;
    }

    /**
     * Gets the `id` of the grid in which the cell is stored.
     * ```typescript
     * let gridId = this.cell.gridID;
     * ```
     * @memberof IgxGridCellComponent
     */
    get gridID(): any {
        return this.row.gridID;
    }

    /**
     * Gets the grid of the cell.
     * ```typescript
     * let grid = this.cell.grid;
     * ```
     * @memberof IgxGridCellComponent
     */
    get grid(): any {
        return this.gridAPI.grid;
    }

    /**
     * Gets the `index` of the row where the cell is stored.
     * ```typescript
     * let rowIndex = this.cell.rowIndex;
     * ```
     * @memberof IgxGridCellComponent
     */
    @HostBinding('attr.data-rowIndex')
    get rowIndex(): number {
        return this.row.index;
    }

    /**
     * Gets the `index` of the cell column.
     * ```typescript
     * let columnIndex = this.cell.columnIndex;
     * ```
     * @memberof IgxGridCellComponent
     */
    get columnIndex(): number {
        return this.column.index;
    }

    /**
     * Gets the visible `index` of the in which the cell is stored.
     * ```typescript
     * let visibleColumnIndex = this.cell.visibleColumnIndex;
     * ```
     * @memberof IgxGridCellComponent
     */
    @HostBinding('attr.data-visibleIndex')
    @Input()
    get visibleColumnIndex() {
        return this.column.columnLayoutChild ? this.column.visibleIndex : this._vIndex;
    }

    set visibleColumnIndex(val) {
        this._vIndex = val;
    }

    /**
     * Gets the ID of the cell.
     * ```typescript
     * let cellID = this.cell.cellID;
     * ```
     * @memberof IgxGridCellComponent
     */
    public get cellID() {
        const primaryKey = this.grid.primaryKey;
        const rowID = primaryKey ? this.rowData[primaryKey] : this.rowData;
        return { rowID, columnID: this.columnIndex, rowIndex: this.rowIndex };
    }

    @HostBinding('attr.id')
    public get attrCellID() {
        return `${this.row.gridID}_${this.rowIndex}_${ this.visibleColumnIndex}`;
    }

    /**
     * Returns a reference to the nativeElement of the cell.
     * ```typescript
     * let cellNativeElement = this.cell.nativeElement;
     * ```
     * @memberof IgxGridCellComponent
     */
    get nativeElement(): HTMLElement {
        return this.element.nativeElement;
    }

    /**
     * @hidden
     * @internal
     */
    @Input()
    get cellSelectionMode() {
        return this._cellSelection;
    }

    /**
     * @hidden
     * @internal
     */
    @Input()
    set lastSearchInfo(value: ISearchInfo) {
        this._lastSearchInfo = value;
        this.highlightText(this._lastSearchInfo.searchText, this._lastSearchInfo.caseSensitive, this._lastSearchInfo.exactMatch);
    }

    set cellSelectionMode(value) {
        if (this._cellSelection === value) { return; }
         this.zone.runOutsideAngular(() => {
            value === GridSelectionMode.multiple ?
            this.addPointerListeners(value) : this.removePointerListeners(this._cellSelection);
        });
        this._cellSelection = value;
    }

    /**
     * @hidden
     * @internal
     */
    @Input()
    @HostBinding('class.igx-grid__td--pinned-last')
    lastPinned = false;

    /**
     * @hidden
     * @internal
     */
    @Input()
    @HostBinding('class.igx-grid__td--pinned-first')
    firstPinned = false;

    /**
     * Returns whether the cell is in edit mode.
     */
    @Input()
    @HostBinding('class.igx-grid__td--editing')
    editMode = false;


    /**
     * Sets/get the `role` property of the cell.
     * Default value is `"gridcell"`.
     * ```typescript
     * this.cell.role = 'grid-cell';
     * ```
     * ```typescript
     * let cellRole = this.cell.role;
     * ```
     * @memberof IgxGridCellComponent
     */
    @HostBinding('attr.role')
    public role = 'gridcell';

    /**
     * Gets whether the cell is editable.
     * ```typescript
     * let isCellReadonly = this.cell.readonly;
     * ```
     * @memberof IgxGridCellComponent
     */
    @HostBinding('attr.aria-readonly')
    get readonly(): boolean {
        return !this.editable;
    }

    get gridRowSpan(): number {
        return this.column.gridRowSpan;
    }

    get gridColumnSpan(): number {
        return this.column.gridColumnSpan;
    }


    get rowEnd(): number {
        return this.column.rowEnd;
    }

    get colEnd(): number {
        return this.column.colEnd;
    }

    get rowStart(): number {
        return this.column.rowStart;
    }

    get colStart(): number {
        return this.column.colStart;
    }

    /**
     * Returns a string containing the grid `id` and the column `field` concatenated by "_".
     * ```typescript
     * let describedBy = this.cell.describedBy;
     * ```
     * @memberof IgxGridCellComponent
     */
    @HostBinding('attr.aria-describedby')
    get describedby(): string {
        return `${this.row.gridID}_${this.column.field}`;
    }

    /**
     * Gets the width of the cell.
     * ```typescript
     * let cellWidth = this.cell.width;
     * ```
     * @memberof IgxGridCellComponent
     */
    @Input()
    width = '';

    /**
     * @hidden
     */
    @Input()
    @HostBinding('class.igx-grid__td--active')
    public active: boolean;

    @HostBinding('attr.aria-selected')
    get ariaSelected() {
        return this.selected || this.column.selected  || this.row.selected;
    }

    /**
     * Gets whether the cell is selected.
     * ```typescript
     * let isSelected = this.cell.selected;
     * ```
     * @memberof IgxGridCellComponent
     */
    @HostBinding('class.igx-grid__td--selected')
    get selected() {
        return this.selectionService.selected(this.selectionNode);
    }

    /**
     * Selects/deselects the cell.
     * ```typescript
     * this.cell.selected = true.
     * ```
     * @memberof IgxGridCellComponent
     */
    set selected(val: boolean) {
        const node = this.selectionNode;
        val ? this.selectionService.add(node) : this.selectionService.remove(node);
        this.grid.notifyChanges();
    }

    /**
     * Gets whether the cell column is selected.
     * ```typescript
     * let isCellColumnSelected = this.cell.columnSelected;
     * ```
     * @memberof IgxGridCellComponent
     */
    @HostBinding('class.igx-grid__td--column-selected')
    get columnSelected() {
        return this.selectionService.isColumnSelected(this.column.field);
    }

    @HostBinding('class.igx-grid__td--edited')
    get dirty() {
        if (this.grid.rowEditable) {
            const rowCurrentState = this.grid.transactions.getAggregatedValue(this.row.rowID, false);
            if (rowCurrentState) {
                return rowCurrentState[this.column.field] !== undefined && rowCurrentState[this.column.field] !== null;
            }
        } else {
            const rowTransaction: State = this.grid.transactions.getState(this.row.rowID);
                return rowTransaction && rowTransaction.value &&
                (rowTransaction.value[this.column.field] ||
                 rowTransaction.value[this.column.field] === 0 ||
                 rowTransaction.value[this.column.field] === false);
        }

        return false;
    }

    /**
     * Sets the current edit value while a cell is in edit mode.
     * Only for cell editing mode.
     * ```typescript
     * this.cell.editValue = value;
     * ```
     * @memberof IgxGridCellComponent
     */
    public set editValue(value) {
        if (this.crudService.inEditMode) {
            this.crudService.cell.editValue = value;
        }
    }

    /**
     * Gets the current edit value while a cell is in edit mode.
     * Only for cell editing mode.
     * ```typescript
     * let editValue = this.cell.editValue;
     * ```
     * @memberof IgxGridCellComponent
     */
    public get editValue() {
        if (this.crudService.inEditMode) {
            return this.crudService.cell.editValue;
        }
    }

    /**
     * Returns whether the cell is editable.
     */
    get editable(): boolean {
        return this.column.editable && !this.row.disabled;
    }

    /**
     * @hidden
     */
    @Input()
    @HostBinding('class.igx-grid__td--row-pinned-first')
    public displayPinnedChip = false;


    @ViewChild('defaultCell', { read: TemplateRef, static: true })
    protected defaultCellTemplate: TemplateRef<any>;

    @ViewChild('defaultPinnedIndicator', { read: TemplateRef, static: true })
    protected defaultPinnedIndicator: TemplateRef<any>;

    @ViewChild('inlineEditor', { read: TemplateRef, static: true })
    protected inlineEditorTemplate: TemplateRef<any>;

    @ViewChild(IgxTextHighlightDirective, { read: IgxTextHighlightDirective })
    protected set highlight(value: IgxTextHighlightDirective) {
        this._highlight = value;

        if (this._highlight && this.grid.lastSearchInfo.searchText) {
            this._highlight.highlight(this.grid.lastSearchInfo.searchText,
                this.grid.lastSearchInfo.caseSensitive,
                this.grid.lastSearchInfo.exactMatch);
            this._highlight.activateIfNecessary();
        }
    }

    protected get highlight() {
        return this._highlight;
    }

    protected get selectionNode(): ISelectionNode {
        return {
            row: this.rowIndex,
            column: this.column.columnLayoutChild ? this.column.parent.visibleIndex : this.visibleColumnIndex,
            layout: this.column.columnLayoutChild ? {
                rowStart: this.column.rowStart,
                colStart: this.column.colStart,
                rowEnd: this.column.rowEnd,
                colEnd: this.column.colEnd,
                columnVisibleIndex: this.visibleColumnIndex
            } : null
            };
    }

    public focused = this.active;
    protected compositionStartHandler;
    protected compositionEndHandler;
    private _highlight: IgxTextHighlightDirective;
    private _cellSelection = GridSelectionMode.multiple;

    constructor(
        protected selectionService: IgxGridSelectionService,
        protected crudService: IgxGridCRUDService,
        public gridAPI: GridBaseAPIService<IgxGridBaseDirective & GridType>,
        public cdr: ChangeDetectorRef,
        private element: ElementRef,
        protected zone: NgZone,
        private touchManager: HammerGesturesManager,
        protected platformUtil: PlatformUtil) { }

    private addPointerListeners(selection) {
        if (selection !== GridSelectionMode.multiple) { return; }
        this.nativeElement.addEventListener('pointerenter', this.pointerenter);
        this.nativeElement.addEventListener('pointerup', this.pointerup);
    }

    private  removePointerListeners(selection) {
        if (selection !== GridSelectionMode.multiple) { return; }
        this.nativeElement.removeEventListener('pointerenter', this.pointerenter);
        this.nativeElement.removeEventListener('pointerup', this.pointerup);
    }

    /**
     * @hidden
     * @internal
     */
    ngOnInit() {
        this.zone.runOutsideAngular(() => {
            this.nativeElement.addEventListener('pointerdown', this.pointerdown);
            this.addPointerListeners(this.cellSelectionMode);
            // IE 11 workarounds
            if (isIE()) {
                this.compositionStartHandler = () => this.crudService.isInCompositionMode = true;
                this.compositionEndHandler = () => this.crudService.isInCompositionMode = false;
                // Hitting Enter with IME submits and exits from edit mode instead of first closing the IME dialog
                this.nativeElement.addEventListener('compositionstart', this.compositionStartHandler);
                this.nativeElement.addEventListener('compositionend', this.compositionEndHandler);
            }
        });
        if (this.platformUtil.isIOS) {
            this.touchManager.addEventListener(this.nativeElement, 'doubletap', this.onDoubleClick, {
                cssProps: { } /* don't disable user-select, etc */
            } as HammerOptions);
        }
    }

    /**
     * @hidden
     * @internal
     */
    ngOnDestroy() {
        this.zone.runOutsideAngular(() => {
            this.nativeElement.removeEventListener('pointerdown', this.pointerdown);
            this.removePointerListeners(this.cellSelectionMode);
            if (isIE()) {
                this.nativeElement.removeEventListener('compositionstart', this.compositionStartHandler);
                this.nativeElement.removeEventListener('compositionend', this.compositionEndHandler);
            }
        });
        this.touchManager.destroy();
    }

    /**
     * @hidden
     * @internal
     */
    _updateCRUDStatus() {
        if (this.editMode) {
            return;
        }

        const crud = this.crudService;
        const editableCell = this.crudService.cell;
        const editMode = !!(crud.row || crud.cell);

        if (this.editable && editMode && !this.row.deleted) {
            if (editableCell) {
                this.gridAPI.update_cell(editableCell, editableCell.editValue);
                /* This check is related with the following issue #6517:
                 * when edit cell that belongs to a column which is sorted and press tab,
                 * the next cell in edit mode is with wrong value /its context is not updated/;
                 * So we reapply sorting before the next cell enters edit mode.
                 * Also we need to keep the notifyChanges below, because of the current
                 * change detection cycle when we have editing with enabled transactions
                 */
                if (this.grid.sortingExpressions.length && this.grid.sortingExpressions.indexOf(editableCell.column.field)) {
                    this.grid.cdr.detectChanges();
                }
            }
            crud.end();
            this.grid.tbody.nativeElement.focus({ preventScroll: true });
            this.grid.notifyChanges();
            crud.begin(this);
            return;
        }

        if (editableCell && crud.sameRow(this.cellID.rowID)) {
            this.gridAPI.submit_value();
        } else if (editMode && !crud.sameRow(this.cellID.rowID)) {
            this.grid.endEdit(true);
        }
    }

    /**
     * @deprecated
     * Gets whether the cell is selected.
     * ```typescript
     * let isCellSelected = thid.cell.isCellSelected();
     * ```
     * @memberof IgxGridCellComponent
     */
    @DeprecateMethod(`'isCellSelected' is deprecated. Use 'selected' property instead.`)
    public isCellSelected() {
        return this.selectionService.selected(this.selectionNode);
    }

    /**
     * @hidden
     * @internal
     */
    public ngOnChanges(changes: SimpleChanges): void {
        if (changes.value && !changes.value.firstChange) {
            if (this.highlight) {
                this.highlight.lastSearchInfo.searchedText = this.grid.lastSearchInfo.searchText;
                this.highlight.lastSearchInfo.caseSensitive = this.grid.lastSearchInfo.caseSensitive;
                this.highlight.lastSearchInfo.exactMatch = this.grid.lastSearchInfo.exactMatch;
            }
        }
    }

    /**
     * Starts/ends edit mode for the cell.
     *
     * ```typescript
     * cell.setEditMode(true);
     * ```
     */
    setEditMode(value: boolean): void {
        if (this.row.deleted) {
            return;
        }
        if (this.editable && value) {
            this.gridAPI.submit_value();
            this.crudService.begin(this);
        } else {
            this.gridAPI.escape_editMode();
        }
        this.grid.notifyChanges();
    }

    /**
     * Sets new value to the cell.
     * ```typescript
     * this.cell.update('New Value');
     * ```
     * @memberof IgxGridCellComponent
     */
    // TODO: Refactor
    public update(val: any) {
        if (this.row.deleted) {
            return;
        }
        const cell = this.crudService.createCell(this);
        const args = this.gridAPI.update_cell(cell, val);
        if (this.crudService.cell && this.crudService.sameCell(cell)) {
            if (args.cancel) {
                return;
            }
            this.gridAPI.escape_editMode();
        }
        this.cdr.markForCheck();
    }

    /**
     *
     * @hidden
     * @internal
     */
    pointerdown = (event: PointerEvent) => {
        if (this.cellSelectionMode !== GridSelectionMode.multiple) {
            this.activate(event);
            return;
        }
        if (!isLeftClick(event)) {
            event.preventDefault();
            this.setActiveNode();
            this.selectionService.addKeyboardRange();
            this.selectionService.initKeyboardState();
            this.selectionService.primaryButton = false;
            this.gridAPI.submit_value();
            return;
        }
        this.selectionService.pointerDown(this.selectionNode, event.shiftKey, event.ctrlKey);
        this.activate(event);
    }

    /**
     *
     * @hidden
     * @internal
     */
    pointerenter = (event: PointerEvent) => {
        const dragMode = this.selectionService.pointerEnter(this.selectionNode, event);
        if (dragMode) {
            this.grid.cdr.detectChanges();
        }
    }

    /**
     * @hidden
     * @internal
     */
    pointerup = (event: PointerEvent) => {
        if (!isLeftClick(event)) { return; }
        if (this.selectionService.pointerUp(this.selectionNode, this.grid.onRangeSelection)) {
            this.grid.cdr.detectChanges();
        }
        this._updateCRUDStatus();
    }

    /**
     * @hidden
     * @internal
     */
    @HostListener('dblclick', ['$event'])
    public onDoubleClick = (event: MouseEvent | HammerInput) => {
        if (event.type === 'doubletap') {
            // prevent double-tap to zoom on iOS
            (event as HammerInput).preventDefault();
        }
        if (this.editable && !this.editMode && !this.row.deleted) {
            this.crudService.begin(this);
        }

        this.grid.onDoubleClick.emit({
            cell: this,
            event
        });
    }

    /**
     * @hidden
     * @internal
     */
    @HostListener('click', ['$event'])
    public onClick(event: MouseEvent) {
        this.grid.onCellClick.emit({
            cell: this,
            event
        });
    }

    /**
     * @hidden
     * @internal
     */
    @HostListener('contextmenu', ['$event'])
    public onContextMenu(event: MouseEvent) {
        this.grid.onContextMenu.emit({
            cell: this,
            event
        });
    }

    /**
     * @hidden
     * @internal
     */
    public activate(event: FocusEvent | KeyboardEvent) {
        const node = this.selectionNode;
        this.setActiveNode();
        const shouldEmitSelection = !this.selectionService.isActiveNode(node);

        if (this.selectionService.primaryButton) {
            this._updateCRUDStatus();
            this.selectionService.activeElement = node;
        } else {
            this.selectionService.activeElement = null;
            if (this.crudService.inEditMode && !this.editMode) {
                this.gridAPI.submit_value();
            }
        }
        this.selectionService.primaryButton = true;
        if (this.cellSelectionMode === GridSelectionMode.multiple && this.selectionService.activeElement) {
            this.selectionService.add(this.selectionService.activeElement, false); // pointer events handle range generation
            this.selectionService.keyboardStateOnFocus(node, this.grid.onRangeSelection, this.nativeElement);
        }
        if (this.grid.isCellSelectable && shouldEmitSelection) {
            this.grid.onSelection.emit({ cell: this, event });
        }
        this.grid.cdr.detectChanges();
    }

    /**
     * If the provided string matches the text in the cell, the text gets highlighted.
     * ```typescript
     * this.cell.highlightText('Cell Value', true);
     * ```
     * @memberof IgxGridCellComponent
     */
    public highlightText(text: string, caseSensitive?: boolean, exactMatch?: boolean): number {
        return this.highlight && this.column.searchable ? this.highlight.highlight(text, caseSensitive, exactMatch) : 0;
    }

    /**
     * Clears the highlight of the text in the cell.
     * ```typescript
     * this.cell.clearHighLight();
     * ```
     * @memberof IgxGridCellComponent
     */
    public clearHighlight() {
        if (this.highlight && this.column.searchable) {
            this.highlight.clearHighlight();
        }
    }

    /**
     * @hidden
     * @internal
     */
    public calculateSizeToFit(range: any): number {
        return Math.max(...Array.from(this.nativeElement.children)
            .map((child) => getNodeSizeViaRange(range, child)));
    }

    /**
     * @hidden
     * @internal
     */
    public get searchMetadata() {
        const meta = new Map<string, any>();
        meta.set('pinned', this.grid.isRecordPinnedByViewIndex(this.row.index));
        return meta;
    }

    private setActiveNode() {
        if (this.grid.navigation.activeNode) {
            Object.assign(this.grid.navigation.activeNode, {row: this.rowIndex, column: this.visibleColumnIndex});
        } else {
            const layout = this.column.columnLayoutChild ? this.grid.navigation.layout(this.visibleColumnIndex) : null;
            this.grid.navigation.activeNode = { row: this.rowIndex, column: this.visibleColumnIndex, layout: layout };
        }
    }
}
