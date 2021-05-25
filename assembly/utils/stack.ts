class Stack<T>{

    private data: Array<T>;
    private top: u32 = -1;
    private _size: number;

    constructor(size: number) {
        this.data = new Array<T>(size);
        this._size = size;
    }

    pop(): T {
        if (this.top == -1) {
            throw new Error("Stack Empty");
        }
        let data: T = this.data[this.top];
        --this.top;
        return data;
    }

    push(item: T): void {
        if (this.top == this.data.length) {
            throw new Error("Stack full");
        }
        this.data[++this.top] = item;
    }

    // get size(): number {
    //     return this.data.length;
    // }

}