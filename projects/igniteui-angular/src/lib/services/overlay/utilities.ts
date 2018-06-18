import { GlobalPositionStrategy } from './position/global-position-strategy';
import { IPositionStrategy } from './position/IPositionStrategy';

import { IScrollStrategy, NoOpScrollStrategy } from './scroll';
import { AnimationMetadata } from '@angular/animations';

export enum HorizontalAlignment {
    Left = -1,
    Center = -0.5,
    Right = 0
}

export enum VerticalAlignment {
    Top = -1,
    Middle = -0.5,
    Bottom = 0
}

export class Rectangle {
    constructor(public x: number, public y: number, public w: number, public h: number) { }
}

export class Point {
    constructor(public x: number, public y: number) { }
}

export interface PositionSettings {
    target?: Point | HTMLElement;
    horizontalDirection?: HorizontalAlignment;
    verticalDirection?: VerticalAlignment;
    horizontalStartPoint?: HorizontalAlignment;
    verticalStartPoint?: VerticalAlignment;
    openAnimation?: AnimationMetadata | AnimationMetadata[];
    closeAnimation?: AnimationMetadata | AnimationMetadata[];
}

export interface OverlaySettings {
    positionStrategy?: IPositionStrategy;
    scrollStrategy?: IScrollStrategy;
    modal?: boolean;
    closeOnOutsideClick?: boolean;
}

export function getPointFromPositionsSettings(settings: PositionSettings): Point {
    let result: Point = new Point(0, 0);

    if (settings.target instanceof HTMLElement) {
        const rect = (<HTMLElement>settings.target).getBoundingClientRect();
        result.x = rect.right + rect.width * settings.horizontalStartPoint;
        result.y = rect.bottom + rect.height * settings.verticalStartPoint;
    } else if (settings.target instanceof Point) {
        result = settings.target;
    }

    return result;
}
