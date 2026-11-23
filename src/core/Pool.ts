/**
 * Object pool: reuse objects instead of creating and garbage-collecting them every few frames.
 *
 * `get()` hands out a free object (or makes a new one if none are free).
 * `release()` gives it back. The pool never resets objects itself, so the caller
 * must fully re-initialise whatever it gets (e.g. `item.reset(...)`).
 */
export class Pool<T> {
	private readonly free: T[] = [];
	private readonly create: () => T;

	/** @param create Factory used whenever the pool is empty. */
	constructor(create: () => T) {
		this.create = create;
	}

	/** Number of objects waiting to be reused. */
	get freeCount(): number {
		return this.free.length;
	}

	/** Make `count` objects up front, so the first busy seconds of play don't allocate. */
	prewarm(count: number): void {
		for (let i = 0; i < count; i++) this.free.push(this.create());
	}

	/** Take an object out of the pool. */
	get(): T {
		return this.free.pop() ?? this.create();
	}

	/** Put an object back for later reuse. */
	release(item: T): void {
		this.free.push(item);
	}
}
