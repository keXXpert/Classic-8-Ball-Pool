import { getAtan } from '../common/helper';
import { IOrient, IRotation } from '../game.config.type';

export class Orient implements IOrient {

    //------Members------//

    // in sphere coordinates    
    private _phi: number;
    private _theta: number;

    // in Decart coordinates
    private _x: number;
    private _y: number;
    private _z: number;

    //------Constructor------//

    constructor(phi: number = 0, theta: number = 0) {
        this._phi = phi;
        this._theta = theta;
        this.toDecart()
    }

    //------Properties------//

    get phi() {
        return this._phi;
    }

    get theta() {
        return this._theta;
    }

    static get zero() {
        return new Orient(0, 0);
    }

    get x() {
        return this._x;
    }

    get y() {
        return this._y;
    }
    get z() {
        return this._z;
    }

    set x(x: number) {
        this._x = x;
    }

    set y(y: number) {
        this._y = y;
    }
    set z(z: number) {
        this._z = z;
    }

    private toDecart() {
        this._x = Math.sin(this._theta) * Math.cos(this._phi)
        this._y = Math.sin(this._theta) * Math.sin(this._phi)
        this._z = Math.cos(this._theta)
    }

    private toSphere() {
        this._phi = getAtan(this._x, this._y)
        this._theta = Math.acos(this._z)
    }

    //------Public Methods------//

    public static copy(orient: Orient) {
        return new Orient(orient.phi, orient.theta);
    }

    public rotate(rotation: IRotation) {
        this.rotateX(rotation.x)
        this.rotateY(rotation.y)
        this.rotateZ(rotation.z)
    }

    public rotateX(ang: number): void {
        const oldY = this._y
        this._y = (oldY * Math.cos(ang)) - (this._z * Math.sin(ang));
        this._z = (oldY * Math.sin(ang)) + (this._z * Math.cos(ang));
        this.toSphere()
    }
    public rotateY(ang: number): void {
        const oldX = this._x
        this._x = (oldX * Math.cos(ang)) + (this._z * Math.sin(ang));
        this._z = -(oldX * Math.sin(ang)) + (this._z * Math.cos(ang));
        this.toSphere()
    }

    public rotateZ(ang: number): void {
        const oldX = this._x
        this._x = (oldX * Math.cos(ang)) - (this._y * Math.sin(ang));
        this._y = (oldX * Math.sin(ang)) + (this._y * Math.cos(ang));
        this.toSphere()
    }
}