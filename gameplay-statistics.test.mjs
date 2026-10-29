import assert from "node:assert/strict";
import test from "node:test";
import { GameplayStatistics } from "./gameplay-statistics.mjs";

test("registra uma coleta válida no total e no combo uma única vez", () => {
    const statistics = new GameplayStatistics();

    statistics.registerCollection(100);

    assert.deepEqual(statistics.getSnapshot(100), {
        totalCollected: 1,
        runCollections: 1,
        currentCombo: 1,
        bestCombo: 1,
        runBestCombo: 1,
        dogsPerSecond: 0.2,
        bestDogsPerSecond: 0.2
    });
});

test("coletas consecutivas mantêm e aumentam o combo", () => {
    const statistics = new GameplayStatistics();
    statistics.registerCollection(100);
    statistics.registerCollection(1_500);

    assert.equal(statistics.getSnapshot(1_500).currentCombo, 2);
});

test("encerra o combo após dois segundos sem coleta", () => {
    const statistics = new GameplayStatistics();
    statistics.registerCollection(100);
    statistics.registerCollection(1_000);

    assert.equal(statistics.getSnapshot(2_999).currentCombo, 2);
    assert.equal(statistics.getSnapshot(3_000).currentCombo, 0);
});

test("preserva o total e o maior combo após o combo expirar", () => {
    const statistics = new GameplayStatistics();
    statistics.registerCollection(100);
    statistics.registerCollection(200);
    statistics.getSnapshot(2_200);

    assert.deepEqual(statistics.getSnapshot(2_200), {
        totalCollected: 2,
        runCollections: 2,
        currentCombo: 0,
        bestCombo: 2,
        runBestCombo: 2,
        dogsPerSecond: 0.4,
        bestDogsPerSecond: 0.4
    });
});

test("calcula a velocidade somente com coletas dos últimos cinco segundos", () => {
    const statistics = new GameplayStatistics();
    [0, 1_000, 2_000, 4_000, 5_000].forEach((timestamp) => {
        statistics.registerCollection(timestamp);
    });

    assert.equal(statistics.getSnapshot(5_000).dogsPerSecond, 0.8);
    assert.equal(statistics.getSnapshot(6_000).dogsPerSecond, 0.6);
    assert.equal(statistics.getSnapshot(6_000).bestDogsPerSecond, 0.8);
});

test("zera o DPS ao encerrar uma run e não mistura coletas da próxima", () => {
    const statistics = new GameplayStatistics();
    [100, 200, 300].forEach((timestamp) => {
        statistics.registerCollection(timestamp);
    });

    statistics.resetDogsPerSecond();

    assert.equal(statistics.getSnapshot(300).dogsPerSecond, 0);
    assert.equal(statistics.getSnapshot(300).bestDogsPerSecond, 0);

    statistics.registerCollection(400);

    assert.equal(statistics.getSnapshot(400).dogsPerSecond, 0.2);
});

test("zera o combo atual e preserva o recorde ao iniciar uma nova run", () => {
    const statistics = new GameplayStatistics();
    [1_000, 1_200, 1_400].forEach((timestamp) => {
        statistics.registerCollection(timestamp);
    });

    statistics.resetCombo();

    assert.equal(statistics.getSnapshot(1_400).currentCombo, 0);
    assert.equal(statistics.getSnapshot(1_400).bestCombo, 3);
    assert.equal(statistics.getSnapshot(1_400).runCollections, 0);
    assert.equal(statistics.getSnapshot(1_400).runBestCombo, 0);

    statistics.registerCollection(100);

    assert.equal(statistics.getSnapshot(100).currentCombo, 1);
    assert.equal(statistics.getSnapshot(100).bestCombo, 3);
    assert.equal(statistics.getSnapshot(100).runCollections, 1);
    assert.equal(statistics.getSnapshot(100).runBestCombo, 1);
});
