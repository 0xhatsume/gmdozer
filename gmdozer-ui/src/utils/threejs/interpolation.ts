export function lerp(start: number, end: number, t: number): number {
    return start * (1 - t) + end * t;
}

export function lerpVector3(
    start: [number, number, number], 
    end: [number, number, number], 
    t: number
): [number, number, number] {
    
    return [
        lerp(start[0], end[0], t),
        lerp(start[1], end[1], t),
        lerp(start[2], end[2], t),
    ];
}