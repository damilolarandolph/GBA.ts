export default class Queue<T>{
    private data: Array<T>;
    private startNeedle: u32 = 0;
    private endNeedle: u32 = 0;

    private items: number = 0;

    constructor(size: i32) {
        this.data = new Array(size);
    }

    public enqueue(data: T): void {

        if (this.items == this.data.length) {
            throw new Error("Can't enqueue, queue is full");
        }
        ++this.items;
        this.data[this.endNeedle] = data;
        this.endNeedle = (this.endNeedle + 1) % this.data.length;
    }

    public dequeue(): T {
        if (this.items == 0) {
            throw new Error("Can't dequeue, queue is empty");
        }
        --this.items;
        let res = this.data[this.startNeedle];
        this.startNeedle = (this.startNeedle + 1) % this.data.length;
        return res;
    }

    get isEmpty(): boolean {
        return this.items == 0;
    }

    public peek(): T {
        if (this.items == 0) {

            throw new Error("Can't peek, queue is empty");
        }
        return this.data[this.startNeedle];
    }

    get length(): number {
        return this.items;
    }

    public peekEnd(): T {
        return this.data[(this.endNeedle - 1) % this.data.length];
    }

    public flush(): void {
        this.items = 0;
        this.startNeedle = 0;
        this.endNeedle = 0;
    }

}