import { IStickConfig, IInputConfig } from './../game.config.type';
import { Keyboard } from '../input/keyboard';
import { Mouse } from '../input/mouse';
import { GameConfig } from '../game.config';
import { Assets } from '../assets';
import { Canvas2D } from '../canvas';
import { Vector2 } from '../geom/vector2';
import { mapRange } from '../common/helper';
import { IAssetsConfig } from '../game.config.type';

//------Configurations------//

const inputConfig: IInputConfig = GameConfig.input;
const stickConfig: IStickConfig = GameConfig.stick;
const sprites: IAssetsConfig = GameConfig.sprites;
const sounds: IAssetsConfig = GameConfig.sounds;

export class Stick {

    //------Members------//

    private _sprite: HTMLImageElement = Assets.getSprite(sprites.paths.stick);
    private _rotation: number = 0;
    private _origin: Vector2 = Vector2.copy(stickConfig.origin);
    private _power: number = 0;
    private _movable: boolean = true;
    private _visible: boolean = true;

    private _hitPosition: Vector2 = Vector2.zero;       //cue ball hit position
    private _hitOrigin: number                          //cue hit origin position

    private _shot: boolean = false;                     // flag that indicates, the player touched the cue ball while aiming
    private _wasDrawn: boolean = false;                 // flag that indicates, the cue was drawn back while aiming

    private _showHitLine: boolean = true;               // flag that indicates whether to show hitline while aiming

    // utility variables to calculate mouse speed
    private _prevOffset: Vector2 = Vector2.zero;
    private _prevTime: number = 0;
    private _prevMousePosition: Vector2 = Vector2.zero;

    //------Properties------//

    public get position(): Vector2 {
        return Vector2.copy(this._position);
    }

    public get rotation(): number {
        return this._rotation;
    }

    public get power(): number {
        return this._power;
    }

    public get shot(): boolean {
        return this._shot
    }

    public get visible(): boolean {
        return this._visible;
    }

    public get hitPosition(): Vector2 {
        return this._hitPosition
    }

    public set shot(value: boolean) {
        this._shot = value
    }

    public set movable(value: boolean) {
        this._movable = value;
    }

    public set visible(value: boolean) {
        this._visible = value;
    }

    public set rotation(value: number) {
        this._rotation = value;
    }

    //------Constructor------//

    constructor(private _position: Vector2) { }

    //------Private Methods------//

    private updateOffset(): void {
        const offset = Mouse.position.subtract(Mouse.pressedPosition)
        let originOffset = -(offset.x * Math.cos(this._rotation) + offset.y * Math.sin(this._rotation))
        if (originOffset > 3) this._wasDrawn = true
        if (originOffset > stickConfig.maxPower) originOffset = stickConfig.maxPower
        if (originOffset < 0) {
            if (this._wasDrawn) {
                if (originOffset < -5) {
                    originOffset = -5
                    if (this._wasDrawn) {
                        this._shot = true
                        this._wasDrawn = false
                    }
                }
            } else originOffset = 0
        }
        this._origin = Vector2.copy(stickConfig.origin).addX(originOffset * 4)
        /// new Vector2(stickConfig.origin.x + originOffset * 4, stickConfig.origin.y)
    }

    private updateSpeed(): void {
        const offset = Mouse.position.subtract(Mouse.pressedPosition)
        if (this._prevTime != 0 && this._prevOffset.length > 0) {
            const curentTime = Date.now()
            const movement = offset.subtract(this._prevOffset)
            const movementX = (movement.x * Math.cos(this._rotation) + movement.y * Math.sin(this._rotation))
            if (movementX <= 0) this._power = 0
            else {
                this._power = movementX / (curentTime - this._prevTime) * 200
                if (this._power > stickConfig.maxPower) this._power = stickConfig.maxPower
            }
        }
        this._prevOffset = offset
    }

    private resetSpeed(): void {
        this._prevOffset = Vector2.zero
        this._prevTime = 0
        this._origin = Vector2.copy(stickConfig.origin)
        this._wasDrawn = false
    }

    private initSpeed(): void {
        this._prevOffset = Mouse.position.subtract(Mouse.pressedPosition)
        this._prevTime = Date.now()
        this._power = 0
    }

    private updatePower(): void {
        if (Mouse.isDown(inputConfig.mouseShootButton)) {
            this.updateOffset()
            this.updateSpeed()
        }

        if (Mouse.isPressed(inputConfig.mouseShootButton)) {
            this.initSpeed()
        }

        if (Mouse.isReleased(inputConfig.mouseShootButton)) {
            this.resetSpeed()
        }
    }

    private updateHitPosition(): void {
        if (!Mouse.isDown(inputConfig.mouseShootButton)) {
            const { x, y } = this._hitPosition
            let newX = x
            let newY = y
            if (Keyboard.isPressed(inputConfig.upHitKey)) {
                newY = Math.abs(y + 0.1) > Math.sqrt(1 - x * x) ? Math.sqrt(1 - x * x) : y + 0.1
            }
            if (Keyboard.isPressed(inputConfig.downHitKey)) {
                newY = Math.abs(y - 0.1) > Math.sqrt(1 - x * x) ? - Math.sqrt(1 - x * x) : y - 0.1
            }
            if (Keyboard.isPressed(inputConfig.rightHitKey)) {
                newX = Math.abs(x + 0.1) > Math.sqrt(1 - y * y) ? Math.sqrt(1 - y * y) : x + 0.1
            }
            if (Keyboard.isPressed(inputConfig.leftHitKey)) {
                newX = Math.abs(x - 0.1) > Math.sqrt(1 - y * y) ? - Math.sqrt(1 - y * y) : x - 0.1
            }
            this._hitPosition = new Vector2(newX, newY)
            this._hitOrigin = - x * GameConfig.ball.diameter / 2 * .9
        }
    }

    private setHitMarker(): void {
        const radius = GameConfig.hitMarketDiameter / 2
        const _x = (Mouse.position.x - GameConfig.hitMarketPosition.x - radius) / radius
        const _y = (Mouse.position.y - GameConfig.hitMarketPosition.y - radius) / radius
        if (Math.sqrt(_x * _x + _y * _y) <= 1) {
            this._hitPosition = new Vector2(_x, -_y)
        }
    }

    private updateRotation(): void {
        if (!Mouse.isDown(inputConfig.mouseShootButton)) {
            if (this._prevMousePosition.subtract(Mouse.position).length > 0.01) {
                const opposite: number = Mouse.position.y - this._position.y;
                const adjacent: number = Mouse.position.x - this._position.x;
                this._rotation = Math.atan2(opposite, adjacent);
                this._prevMousePosition = Mouse.position

                if (this._visible && Mouse.isPressed(inputConfig.mouseToggleHitlineButton)) {
                    this._showHitLine = !this._showHitLine
                }
                this._prevMousePosition = Vector2.zero
            }
        } else {
            this.setHitMarker()
            this._prevMousePosition = Vector2.copy(Mouse.position)
        }
    }

    private resetCue(): void {
        this.resetSpeed()
        this._hitPosition = Vector2.zero
        this._hitOrigin = 0
    }

    //------Public Methods------//

    public hide(): void {
        this._visible = false;
        this._movable = false;
        this.resetCue()
    }

    public show(position: Vector2): void {
        this._power = 0
        this._position = position;
        this._origin = Vector2.copy(stickConfig.origin);
        this._movable = true;
        this._visible = true;
    }

    public shoot(): void {
        this._origin = Vector2.copy(stickConfig.shotOrigin);
        const volume: number = mapRange(this._power, 0, stickConfig.maxPower, 0, 1);
        Assets.playSound(sounds.paths.strike, volume);
    }

    public update(): void {
        if (this._movable) {
            this.updateRotation();
            this.updateHitPosition();
            this.updatePower();
        }
    }

    public draw(): void {
        if (this._visible) {
            Canvas2D.drawImage(this._sprite, this._position, this._rotation, this._origin.addY(this._hitOrigin));
            if (this._movable) {
                Canvas2D.drawHitPosition(this._hitPosition)
                if (this._showHitLine) {
                    Canvas2D.drawHitLine(this._position, this._rotation)
                }
            }
        }

        if (!this._movable) {
            Canvas2D.drawHitPower(this._power)
        }

    }

}