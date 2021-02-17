export const mapRange = (num: number, in_min: number, in_max: number, out_min: number, out_max: number) => {
    let value: number = (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    value = value < out_min ? out_min : value;
    value = value > out_max ? out_max : value;
    return value;
}


// correct calculation of angle based on arctangent
export const getAtan = (x: number, y: number) => {
    let alpha = Math.atan(y / x)
    if (x < 0) {
        if (y < 0) {
            alpha -= Math.PI
        } else {
            alpha += Math.PI
        }
    }
    return alpha
}