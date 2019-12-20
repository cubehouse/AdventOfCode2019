const util = require('util');

class Vector2D {
    constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }

    get Size() {
        return this.x + this.y;
    }

    Clone() {
        return new Vector2D(this.x, this.y);
    }

    Add(other) {
        this.x += (other.x || 0);
        this.y += (other.y || 0);
        return this;
    }

    Subtract(other) {
        this.x -= (other.x || 0);
        this.y -= (other.y || 0);
        return this;
    }

    Multiply(num) {
        this.x *= num;
        this.y *= num;
        return this;
    }

    Divide(num) {
        this.x /= num;
        this.y /= num;
        return this;
    }

    NormaliseInline() {
        return this.Divide(this.Size);
    }

    Normalise() {
        return this.Clone().NormaliseInline();
    }

    valueOf() {
        return this.Size;
    }

    [util.inspect.custom]() {
        return `Vec2(${this.x}, ${this.y})`;
    }

    static Add(a, b) {
        return a.Clone().Add(b);
    }

    static Subtract(a, b) {
        return a.Clone().Subtract(b);
    }

    static Multiply(a, num) {
        return a.Clone().Multiply(num);
    }

    static Divide(a, num) {
        return a.Clone().Divide(num);
    }

    static Dot(a, b) {
        return (a.x * b.x) + (a.y * b.y);
    }
}

module.exports = Vector2D;

if (!module.parent) {
    const Assert = (cond, err) => {
        if (!cond) {
            console.error(`ASSERT: ${err}`);
            throw new Error();
        }
    };

    const A = new Vector2D(0, 0);
    Assert(A.x === 0); Assert(A.y === 0);
    const B = new Vector2D(1, 2);
    Assert(B.x === 1); Assert(B.y === 2);
    A.Add(B);
    Assert(A.x === 1); Assert(A.y === 2);
    const C = Vector2D.Add(A, B);
    Assert(A.x === 1); Assert(A.y === 2);
    Assert(B.x === 1); Assert(B.y === 2);
    Assert(C.x === 2); Assert(C.y === 4);

    console.log(A, B, C);
}