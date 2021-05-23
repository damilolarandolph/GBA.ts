export default class Queue<T>{
    private data: Array<T>;
    private startNeedle: number = 0;
    private endNeedle: number = 0;

    private items: number = 0;

    constructor(size: number) {
        this.data = Array(size);
    }

    public enqueue(data: T) {

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
        let res = this.data[this.endNeedle];
        this.startNeedle = (this.startNeedle + 1) % this.data.length;
        return res;
    }

    public isEmpty(): boolean {
        return this.items == 0;
    }

    public flush() {
        this.items = 0;
        this.startNeedle = this.endNeedle = 0;
    }

}