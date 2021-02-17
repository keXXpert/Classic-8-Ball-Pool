import { GameConfig } from './game.config';
import { Assets } from './assets';
import { IVector2 } from './game.config.type';
import { Vector2 } from './geom/vector2';
import { Orient } from './geom/orientation';
import { getAtan } from './common/helper';

class Canvas2D_Singleton {

    //------Members------//

    private _canvasContainer: HTMLElement;
    private _canvas: HTMLCanvasElement;
    private _context: CanvasRenderingContext2D;
    private _scale: Vector2;
    private _offset: Vector2;

    //------Properties------//

    public get scaleX() {
        return this._scale.x;
    }

    public get scaleY() {
        return this._scale.y;
    }

    public get offsetX() {
        return this._offset.x;
    }

    public get offsetY() {
        return this._offset.y;
    }

    //------Constructor------//

    constructor(canvas: HTMLCanvasElement, canvasContainer: HTMLElement) {
        this._canvasContainer = canvasContainer;
        this._canvas = canvas;
        this._context = this._canvas.getContext('2d');
        this.resizeCanvas();
    }

    //------Public Methods------//

    public resizeCanvas(): void {

        const spaceToRight = 100

        const originalCanvasWidth = GameConfig.gameSize.x;
        const originalCanvasHeight = GameConfig.gameSize.y;
        const widthToHeight: number = originalCanvasWidth / originalCanvasHeight;

        let newHeight: number = window.innerHeight;
        let newWidth: number = window.innerWidth - spaceToRight;

        const newWidthToHeight: number = newWidth / newHeight;

        if (newWidthToHeight > widthToHeight) {
            newWidth = newHeight * widthToHeight;
        } else {
            newHeight = newWidth / widthToHeight;
        }

        this._canvasContainer.style.width = newWidth + spaceToRight + 'px';
        this._canvasContainer.style.height = newHeight + 'px';
        this._canvasContainer.style.marginTop = (window.innerHeight - newHeight) / 2 + 'px';
        this._canvasContainer.style.marginLeft = (window.innerWidth - newWidth - spaceToRight) / 2 + 'px';
        this._canvasContainer.style.marginBottom = (window.innerHeight - newHeight) / 2 + 'px';
        this._canvasContainer.style.marginRight = (window.innerWidth - newWidth - spaceToRight) / 2 + 'px';
        this._scale = new Vector2(newWidth / originalCanvasWidth, newHeight / originalCanvasHeight);

        this._canvas.width = newWidth + spaceToRight;
        this._canvas.height = newHeight;

        if (this._canvas.offsetParent) {
            this._offset = new Vector2(this._canvas.offsetLeft, this._canvas.offsetTop);
        }
    }


    public clear(): void {
        this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }

    public drawPowerGraph() {
        const origin = GameConfig.hitPowerIndicatorPosition

        this._context.save();
        this._context.scale(this._scale.x, this._scale.y);
        this._context.translate(origin.x, origin.y)
        this._context.beginPath()
        this._context.lineWidth = 3;
        this._context.strokeStyle = 'white';
        this._context.arc(0, 0, 10, -Math.PI, 0, false)
        this._context.lineTo(10, 400)
        this._context.arc(0, 400, 10, 0, -Math.PI, false)
        this._context.lineTo(-10, 0)
        this._context.stroke();
        this._context.restore();
    }

    public drawHitPower(power: number = 0) {
        const origin = GameConfig.hitPowerIndicatorPosition
        const radius = 9

        const height = 400 * (1 - power / 50)

        this._context.save();
        this._context.scale(this._scale.x, this._scale.y);
        this._context.translate(origin.x, origin.y)
        this._context.beginPath()
        this._context.lineWidth = 3;
        this._context.strokeStyle = 'yellow';
        this._context.arc(0, 400, radius, 0, -Math.PI, false)
        // this._context.lineTo(radius, 400)
        this._context.arc(0, height, radius, -Math.PI, 0, false)
        // this._context.lineTo(-radius, height)
        this._context.fillStyle = 'yellow'
        this._context.fill()
        // this._context.stroke();
        this._context.restore();
    }

    public drawHitPosition(position: IVector2 = { x: 0, y: 0 }) {
        const origin = GameConfig.hitMarketPosition
        const radius = GameConfig.hitMarketDiameter / 2
        const size = 6

        this._context.save();
        this._context.scale(this._scale.x, this._scale.y);
        this._context.translate(origin.x + radius, origin.y + radius)
        this._context.beginPath()
        this._context.lineWidth = 3;
        this._context.strokeStyle = 'red';
        this._context.moveTo(position.x * radius - size, -position.y * radius);
        this._context.lineTo(position.x * radius + size, -position.y * radius);
        this._context.moveTo(position.x * radius, -position.y * radius - size);
        this._context.lineTo(position.x * radius, -position.y * radius + size);
        this._context.stroke();
        this._context.restore();
    }

    public drawHitLine(position: IVector2 = { x: 0, y: 0 }, rotation: number = 0): void {
        this._context.save();
        this._context.scale(this._scale.x, this._scale.y);
        this._context.translate(position.x, position.y);
        this._context.beginPath()
        this._context.moveTo(0, 0);
        this._context.rotate(rotation);
        this._context.setLineDash([10, 15]);
        this._context.lineWidth = 4;
        this._context.strokeStyle = 'red';
        this._context.lineTo(1500, 0);
        this._context.stroke();
        this._context.restore();

    }

    public drawImage(
        sprite: HTMLImageElement,
        position: IVector2 = { x: 0, y: 0 },
        rotation: number = 0,
        origin: IVector2 = { x: 0, y: 0 }
    ) {
        this._context.save();
        this._context.scale(this._scale.x, this._scale.y);
        this._context.translate(position.x, position.y);
        this._context.rotate(rotation);
        this._context.drawImage(sprite, 0, 0, sprite.width, sprite.height, -origin.x, -origin.y, sprite.width, sprite.height);
        this._context.restore();
    }

    public drawBall(
        sprite: HTMLImageElement,
        position: IVector2 = { x: 0, y: 0 },
        rotation: Orient,
        labelOrient: Orient,
        ballNumber: number
    ) {
        let spriteWidth = 48
        let spriteHeight = 48
        let spriteX
        let spriteY
        let phi

        if (ballNumber > 8) {
            spriteWidth = 50
            spriteHeight = 50
            phi = - rotation.phi - Math.PI / 2
            const theta = rotation.theta < 0 ? Math.PI * 2 + rotation.theta : rotation.theta
            const spriteStep = Math.PI / 41
            let spriteSection = Math.round(theta / spriteStep) + 1
            if (spriteSection === 42) spriteSection = 1
            spriteX = spriteWidth * ((spriteSection - 1) % 5)
            spriteY = spriteHeight * (Math.ceil(spriteSection / 5) - 1)
        } else {
            spriteX = spriteWidth * (ballNumber % 3)
            spriteY = spriteHeight * Math.floor(ballNumber / 3)
        }

        this._context.save();
        this._context.scale(this._scale.x, this._scale.y);
        this._context.translate(position.x, position.y);
        if (ballNumber > 8) this._context.rotate(phi);

        // drawing shadow
        this._context.beginPath()
        this._context.shadowColor = 'black';
        this._context.shadowOffsetX = (position.x - GameConfig.gameSize.x / 2) / GameConfig.gameSize.x * 25
        this._context.shadowOffsetY = (position.y - GameConfig.gameSize.y / 2) / GameConfig.gameSize.y * 25
        this._context.shadowBlur = 8;
        this._context.arc(0, 0, GameConfig.ball.diameter / 2, 0, Math.PI * 2, true); // Outer circle
        this._context.fill()

        // drawing ball
        this._context.drawImage(sprite, spriteX, spriteY, spriteWidth, spriteHeight, -GameConfig.ball.diameter / 2, -GameConfig.ball.diameter / 2, GameConfig.ball.diameter, GameConfig.ball.diameter);
        this._context.restore();

        // drawing spot on the ball
        this.drawSpot(position, rotation, labelOrient, ballNumber)

        // addind light and shadow gradient on the ball
        this._context.save();
        this._context.scale(this._scale.x, this._scale.y);
        this._context.translate(position.x, position.y);
        this._context.beginPath()
        this._context.translate(-10, -10);

        // defining gradient for light and shadow
        const gradient = this._context.createRadialGradient(2, 2, 3, 10, 10, GameConfig.ball.diameter / 2)
        gradient.addColorStop(0, "rgba(255,255,255,0.5)");
        gradient.addColorStop(.7, "rgba(0,0,0,0.3)");
        gradient.addColorStop(1, "rgba(0,0,0,0.8)");

        this._context.fillStyle = gradient
        this._context.arc(10, 10, GameConfig.ball.diameter / 2 + 1, 0, Math.PI * 2, true)
        this._context.fill()
        this._context.restore();
    }


    public drawSpot(
        position: IVector2 = { x: 0, y: 0 },
        rotation: Orient,
        labelPosition: Orient,
        ballNumber: number) {
        const baseSpotRadius = 10
        const spriteWidth = 38
        const spriteHeight = 38

        if (labelPosition.z > 0.08) {
            // get spots sprite
            const sprite = Assets.getSprite(GameConfig.sprites.paths.labelsSprite)

            // chose correct sprite from the file according to ballnum
            const spriteX = spriteWidth * (ballNumber % 4)
            const spriteY = spriteHeight * Math.floor(ballNumber / 4)

            // position, coordinates of spot center
            const { x, y, z } = labelPosition

            // angle of spot center from ball center
            const baseAlpha = getAtan(x, y)

            //angle of spot rotation based on ball orientation in 3d space
            const newOrient = Orient.copy(rotation)
            newOrient.rotateZ(-labelPosition.phi)
            newOrient.rotateY(-labelPosition.theta)
            const addAlpha = newOrient.phi + Math.PI

            // rotating the sprite of ball spot before drawing
            const canvas = document.createElement('canvas')
            canvas.setAttribute('width', spriteWidth.toString())
            canvas.setAttribute('height', spriteHeight.toString())
            const ctx = canvas.getContext('2d')
            ctx.translate(spriteWidth / 2, spriteHeight / 2)
            ctx.rotate(-addAlpha)
            ctx.drawImage(sprite, spriteX, spriteY, spriteWidth, spriteHeight, -spriteWidth / 2, - spriteHeight / 2, spriteWidth, spriteHeight)

            // Spot shrinking scale for beeing close to the edge of ball
            const scaleY = z * .80 + 0.2

            // drawing the spot
            this._context.save();
            this._context.scale(this._scale.x, this._scale.y)
            this._context.translate(position.x + x * GameConfig.ball.diameter / 2 * .8, position.y - y * GameConfig.ball.diameter / 2 * .8);
            this._context.rotate(-baseAlpha + Math.PI / 2)
            // this._context.beginPath();
            this._context.drawImage(
                canvas, -baseSpotRadius, -baseSpotRadius * scaleY, baseSpotRadius * 2, baseSpotRadius * 2 * scaleY
            );

            this._context.restore();
        }
    }

    public drawText(text: string, font: string, color: string, position: IVector2, textAlign: string = 'left'): void {
        this._context.save();
        this._context.scale(this._scale.x, this._scale.y);
        this._context.fillStyle = color;
        this._context.font = font;
        this._context.textAlign = textAlign as CanvasTextAlign;
        this._context.fillText(text, position.x, position.y);
        this._context.restore();
    }

    public changeCursor(cursor: string): void {
        this._canvas.style.cursor = cursor;
    }
}

const canvas: HTMLCanvasElement = document.getElementById('screen') as HTMLCanvasElement;
const container: HTMLElement = document.getElementById('gameArea') as HTMLElement;
export const Canvas2D = new Canvas2D_Singleton(canvas, container);

window.addEventListener('resize', Canvas2D.resizeCanvas.bind(Canvas2D));
