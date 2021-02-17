import { IBallConfig, IPhysicsConfig, IAssetsConfig, IOrient, IRotation } from './../game.config.type';
import { GameConfig } from '../game.config';
import { Canvas2D } from '../canvas';
import { BallTypeEnum, Color } from '../common/color';
import { Vector2 } from '../geom/vector2';
import { Assets } from '../assets';
import { Orient } from '../geom/orientation';

const physicsConfig: IPhysicsConfig = GameConfig.physics;
const sprites: IAssetsConfig = GameConfig.sprites;
const ballConfig: IBallConfig = GameConfig.ball;

export class Ball {

    //------Members------//

    private _sprite: HTMLImageElement;
    private _color: Color;
    private _velocity: Vector2 = Vector2.zero;
    private _moving: boolean = false;
    private _visible: boolean = true;

    private _type: BallTypeEnum                         //added ball type for typed game
    private _number: number                             //added ball number
    private _orientation: Orient                        //added ball orientation in 3D
    private _labelOrient: Orient                        //added ball label position in 3D

    private _rotation: IRotation = { x: 0, y: 0, z: 0 }    // added ball rotation for cue ball non-default hit position

    //------Properties------//

    public get position(): Vector2 {
        return Vector2.copy(this._position);
    }

    public set position(value: Vector2) {
        this._position = value;
    }

    public get nextPosition(): Vector2 {
        return this.position.add(this._velocity.mult(1 - physicsConfig.friction));
    }

    public get velocity(): Vector2 {
        return Vector2.copy(this._velocity);
    }

    public set velocity(value: Vector2) {
        this._moving = value.length > 0 ? true : false;
        this._velocity = value;
    }

    public set rotation(value: IRotation) {
        this._rotation = value;
    }

    public get rotation(): IRotation {
        return this._rotation
    }

    public get moving(): boolean {
        return this._moving;
    }

    public get color(): Color {
        return this._color;
    }

    public get type(): BallTypeEnum {
        return this._type;
    }

    public get number(): number {
        return this._number;
    }

    // public get orientaion(): IOrient {
    //     return { phi: this._orientation.phi, theta: this._orientation.theta }
    // }
    public get orientaion(): Orient {
        return this._orientation
    }

    public get visible(): boolean {
        return this._visible;
    }


    //------Constructor------//

    constructor(private _position: Vector2, color: Color, type: BallTypeEnum, number: number) {
        this._color = color;
        this._type = type
        this._number = number
        this._orientation = new Orient()
        this._labelOrient = new Orient(0, Math.PI / 2)

        //rotate ball randomly on creation
        const rotX = Math.random() * 2 * Math.PI - Math.PI
        const rotY = Math.random() * 2 * Math.PI - Math.PI
        this._orientation.rotateX(rotX)
        this._orientation.rotateY(rotY)
        this._labelOrient.rotateX(rotX)
        this._labelOrient.rotateY(rotY)
        this.resolveSprite(color);
    }

    //------Private Methods------//

    private resolveSprite(color: Color): void {
        if (this._number > 8) {
            this._sprite = Assets.getSprite(sprites.paths['ball' + this._number])
        } else {
            this._sprite = Assets.getSprite(sprites.paths.solidBalls)
        }
    }

    //------Public Methods------//

    public shoot(power: number, angle: number, hitPosition: Vector2): void {
        // set velocity based on hit power and angle
        this._velocity = new Vector2(power * Math.cos(angle), power * Math.sin(angle));

        // set rotation based on power and hit position
        const rotationPowerY = power * hitPosition.y * GameConfig.physics.powerToRotationRatio
        this._rotation = {
            x: rotationPowerY * Math.sin(angle),
            y: rotationPowerY * Math.cos(angle),
            z: power * hitPosition.x * GameConfig.physics.powerToRotationRatio
        }
        this._moving = true;
    }

    public show(position: Vector2): void {
        this._position = position;
        this._velocity = Vector2.zero;
        this._rotation = { x: 0, y: 0, z: 0 }
        this._visible = true;
    }

    public hide(): void {
        this._velocity = Vector2.zero;
        this._rotation = { x: 0, y: 0, z: 0 }
        this._moving = false;
        this._visible = false;
    }

    public update(): void {
        if (this._moving) {

            // update ball velocity and position
            this._velocity.multBy(1 - physicsConfig.friction);
            this._position.addTo(this._velocity);

            // rotation friction to rolling(velocity) friction ratio & counter rotating frinction ratio
            const rotFriction = GameConfig.physics.rotationFriction
            const counterRotFriction = GameConfig.physics.counterRotationFriction

            // update ball rotation (if it is counter rotating - add additional friction)
            this._rotation.x *= Math.sign(this._velocity.y) === Math.sign(this._rotation.x) ? (1 - rotFriction) : (1 - counterRotFriction)
            this._rotation.y *= Math.sign(this._velocity.x) === Math.sign(this._rotation.y) ? (1 - rotFriction) : (1 - counterRotFriction)
            this._rotation.z *= (1 - rotFriction)

            // summing rotation from rolling(velocity) and self rotation
            const angleX = this._velocity.y * 2 / GameConfig.ball.diameter + this._rotation.x
            const angleY = this._velocity.x * 2 / GameConfig.ball.diameter + this._rotation.y
            const angleZ = this._rotation.z

            // rotate ball in accordance with rotations
            this._orientation.rotate({ x: angleX, y: angleY, z: angleZ })
            this._labelOrient.rotate({ x: angleX, y: angleY, z: angleZ })

            // stop rotation if it is too slow
            if (Math.abs(this._rotation.x) < 0.001) this._rotation.x = 0
            if (Math.abs(this._rotation.y) < 0.001) this._rotation.y = 0
            if (Math.abs(this._rotation.z) < 0.001) this._rotation.z = 0

            // stop the ball if velocity is too low (or add velocity due to rotation)
            if (this._velocity.length < ballConfig.minVelocityLength) {
                if (this._rotation.x || this._rotation.y) {
                    // if ball has rotation - convert it into speed
                    const xVelocity = this._rotation.y * GameConfig.ball.diameter / 2 * 1.2
                    const yVelocity = this._rotation.x * GameConfig.ball.diameter / 2 * 1.2
                    this._velocity = new Vector2(xVelocity, yVelocity)
                    this._rotation.x = 0
                    this._rotation.y = 0
                } else {
                    // if the ball doesn't have rotation
                    this.velocity = Vector2.zero;
                    this._moving = false;
                }
            }
        }
    }

    public draw(): void {
        if (this._visible) {
            Canvas2D.drawBall(this._sprite, this._position, this._orientation, this._labelOrient, this._number)
        }
    }
}