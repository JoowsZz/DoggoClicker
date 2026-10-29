const COMBO_TIMEOUT_MS = 2_000;
const SPEED_WINDOW_MS = 5_000;
const SPEED_WINDOW_SECONDS = SPEED_WINDOW_MS / 1_000;

export class GameplayStatistics {
    #collectionTimestamps = [];
    #totalCollected = 0;
    #runCollections = 0;
    #currentCombo = 0;
    #bestCombo = 0;
    #runBestCombo = 0;
    #bestDogsPerSecond = 0;
    #lastCollectionTimestamp;

    registerCollection(timestamp = performance.now()) {
        this.#validateTimestamp(timestamp);
        if (
            this.#lastCollectionTimestamp !== undefined
            && timestamp < this.#lastCollectionTimestamp
        ) {
            throw new RangeError("O timestamp da coleta não pode retroceder.");
        }

        this.#expireCombo(timestamp);
        this.#totalCollected += 1;
        this.#runCollections += 1;
        this.#currentCombo += 1;
        this.#bestCombo = Math.max(this.#bestCombo, this.#currentCombo);
        this.#runBestCombo = Math.max(this.#runBestCombo, this.#currentCombo);
        this.#lastCollectionTimestamp = timestamp;

        this.#pruneCollectionTimestamps(timestamp);
        this.#collectionTimestamps.push(timestamp);
        this.#bestDogsPerSecond = Math.max(
            this.#bestDogsPerSecond,
            this.#calculateDogsPerSecond()
        );
    }

    getSnapshot(timestamp = performance.now()) {
        this.#validateTimestamp(timestamp);
        this.#expireCombo(timestamp);
        this.#pruneCollectionTimestamps(timestamp);

        return {
            totalCollected: this.#totalCollected,
            runCollections: this.#runCollections,
            currentCombo: this.#currentCombo,
            bestCombo: this.#bestCombo,
            runBestCombo: this.#runBestCombo,
            dogsPerSecond: this.#calculateDogsPerSecond(),
            bestDogsPerSecond: this.#bestDogsPerSecond
        };
    }

    resetDogsPerSecond() {
        this.#collectionTimestamps = [];
        this.#bestDogsPerSecond = 0;
    }

    resetCombo() {
        this.#currentCombo = 0;
        this.#runCollections = 0;
        this.#runBestCombo = 0;
        this.#lastCollectionTimestamp = undefined;
    }

    setBestCombo(bestCombo) {
        if (!Number.isSafeInteger(bestCombo) || bestCombo < 0) {
            throw new RangeError("O recorde do combo deve ser um inteiro não negativo.");
        }
        this.#bestCombo = Math.max(this.#bestCombo, bestCombo);
    }

    #expireCombo(timestamp) {
        if (
            this.#lastCollectionTimestamp !== undefined
            && timestamp - this.#lastCollectionTimestamp >= COMBO_TIMEOUT_MS
        ) {
            this.#currentCombo = 0;
        }
    }

    #pruneCollectionTimestamps(timestamp) {
        const oldestIncludedTimestamp = timestamp - SPEED_WINDOW_MS;
        this.#collectionTimestamps = this.#collectionTimestamps.filter(
            (collectionTimestamp) => collectionTimestamp > oldestIncludedTimestamp
        );
    }

    #calculateDogsPerSecond() {
        return this.#collectionTimestamps.length / SPEED_WINDOW_SECONDS;
    }

    #validateTimestamp(timestamp) {
        if (!Number.isFinite(timestamp)) {
            throw new TypeError("O timestamp deve ser um número finito.");
        }
    }
}

export const gameplayStatistics = new GameplayStatistics();
