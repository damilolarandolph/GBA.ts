

class Node {
    public nodeIndex: i32;
}

export abstract class Event extends Node {

    at: u64;
    abstract run(scheduler: Scheduler, tardiness: u64): void;


    @operator("<") lt(other: Event): boolean {
        return this.at < other.at;
    }

    @operator(">") gt(other: Event): boolean {
        return this.at > other.at;
    }

    @operator("==") eq(other: Event): boolean {
        return this.at == other.at;
    }
}

export class Scheduler {
    private heap: MinHeap<Event> = new MinHeap();
    private masterCycles: u64 = 0;

    addCycles(cycles: u64): void {
        this.masterCycles += cycles;
    }

    get timeStamp(): u64 {
        return this.masterCycles;
    }

    schedule(event: Event, at: u64): void {
        event.at = this.timeStamp + at;
        this.heap.insert(event);
    }

    unschedule(event: Event): void {
        this.heap.delete(event);
    }

    reschedule(event: Event, at: u64): void {
        this.heap.delete(event);
        this.schedule(event, at);
    }

    processEvents(): void {
        if (this.size == 0) {
            trace("Scheduler empty !");
            return;
        }

        let min = this.heap.extractMin();

        while (true) {
            min.run(this, this.timeStamp - min.at);
            if (this.size != 0 && this.heap.peekMin().at <= this.timeStamp) {
                min = this.heap.extractMin();
            } else {
                break;
            }

        }
    }

    get canProcess(): boolean {

        if (this.size == 0)
            return false;

        let min = this.heap.peekMin();

        return min.at <= this.timeStamp;
    }

    get size(): u32 {
        return this.heap.size;
    }

}


export class MinHeap<T extends Node> {
    private root: i32 = 0;
    private MAX_SIZE: i32 = 40;
    private backingArray: StaticArray<T | null> = new StaticArray(this.MAX_SIZE);
    private _size: i32 = 0;

    insert(item: T): void {

        if (this._size == this.MAX_SIZE) {
            trace("Heap is full !");
            return;
        }


        if (this._size == 0) {
            this.setIndex(this.root, item);
            ++this._size;
            return;
        }


        this.setIndex(this._size, item);
        ++this._size;
        this.bubbleUp(item);
    }


    get size(): i32 {
        return this._size;
    }


    delete(item: T): void {
        if (this._size == 0) {
            trace("Heap is empty !");
            return;
        }

        if (this.size == 1) {
            this.backingArray[item.nodeIndex] = null;
            --this._size;
            return;
        }
        let lastItem = this.getIndex(this._size - 1);
        this.swap(item, lastItem as T);
        this.backingArray[item.nodeIndex] = null;
        this.sinkDown(lastItem as T);
        --this._size;
    }

    peekMin(): T {
        if (this._size == 0) {
            trace("Heap is empty !");
            unreachable();
        }

        let min = this.getIndex(this.root) as T;
        return min;
    }

    extractMin(): T {
        if (this._size == 0) {
            trace("Heap is empty !");
            unreachable();
        }

        let min = this.getIndex(this.root) as T;
        this.delete(min);
        return min;
    }


    private getIndex(index: i32): T | null {
        if (index >= this.MAX_SIZE)
            return null;

        return unchecked(this.backingArray[index]);
    }

    private bubbleUp(reference: T): void {
        let parent = this.getParent(reference);

        while (reference.nodeIndex > 0 && reference < parent) {
            this.swap(parent, reference);
            parent = this.getParent(reference);
        }
    }
    private sinkDown(reference: T): void {

        let left = this.getLeft(reference);
        let right = this.getRight(reference);

        if (!left && !right) {
            return;
        }

        let smallest: T;

        if ((left && !right) || (left as T) < (right as T)) {
            smallest = left as T;
        } else {
            smallest = right as T;
        }

        if (smallest < reference) {
            this.swap(smallest, reference);
            this.sinkDown(reference);
        }

    }

    private getParent(child: T): T {
        return unchecked(this.backingArray[child.nodeIndex % 2]) as T;
    }

    private swap(initial: T, replacement: T): void {
        let tempIdx = initial.nodeIndex;
        this.setIndex(replacement.nodeIndex, initial);
        this.setIndex(tempIdx, replacement);
    }

    private setIndex(index: i32, item: T): boolean {
        if (index >= this.MAX_SIZE)
            return false;

        item.nodeIndex = index;
        unchecked(this.backingArray[index] = item);
        return true;
    }


    private getLeft(item: T): T | null {
        let index = 2 * item.nodeIndex + 1;
        return this.getIndex(index);
    }

    private getRight(item: T): T | null {
        let index = 2 * item.nodeIndex + 2;
        return this.getIndex(index);
    }

    private setLeft(item: T, child: T): boolean {
        let index = 2 * item.nodeIndex + 1;
        return this.setIndex(index, child);
    }

    private setRight(item: T, child: T): boolean {
        let index = 2 * item.nodeIndex + 2;
        return this.setIndex(index, child);
    }


}




