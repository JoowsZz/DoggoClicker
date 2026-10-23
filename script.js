const dogPark = document.querySelector("#dog-park");
const populationDisplay = document.querySelector("#population");
const goalProgressDisplay = document.querySelector("#goal-progress");
const gameMessage = document.querySelector("#game-message");
const soundButton = document.querySelector("#sound-button");
const backgroundMusic = document.querySelector("#background-music");
const musicVolume = document.querySelector("#music-volume");
const musicVolumeValue = document.querySelector("#music-volume-value");
const resetButton = document.querySelector("#reset-button");
const goalBanner = document.querySelector("#goal-banner");
const victoryDialog = document.querySelector("#victory-dialog");
const victoryGoalDisplay = document.querySelector("#victory-goal");
const victoryEyebrow = document.querySelector("#victory-eyebrow");
const victoryCheer = document.querySelector("#victory-cheer");
const playAgainButton = document.querySelector("#play-again-button");
const playAgainLabel = document.querySelector("#play-again-label");
const firstDog = dogPark.querySelector(".dog").cloneNode(true);
const happyDogImage = "img/cachorro_pixel_feliz.png";
const maximumPopulation = 100;
const normalGoalPopulation = 20;
const turboGoalPopulation = 40;
const turboDogChance = 0.03;
const turboDogImage = "img/cachorro_turbo_leve_1x.png";
const turboFireDogImage = "img/cachorro_fogo_1x.png";
const turboDurationMs = 15_000;
const turboFireFrames = [
    "img/fogo_frame_1.jpg",
    "img/fogo_frame_2.jpg",
    "img/fogo_frame_3.jpg",
    "img/fogo_frame_4.jpg"
];
const backgroundMusicTracks = ["assets/game-music.mp3", "assets/dogsong.mp3"];
const turboMusicTrack = "assets/turbo-music.mp3";
const turboAnnouncement = document.querySelector("#turbo-announcement");
const turboParticles = document.querySelector("#turbo-particles");

let population = 1;
let goalProgress = 1;
let turboGoalCycle = false;
let soundEnabled = true;
let musicUnlocked = false;
let audioContext;
let goalReached = false;
let turboTimeout;
let announcementTimeout;
let turboFireInterval;

function startBackgroundMusic(track) {
    musicUnlocked = true;
    if (!track) {
        if (document.body.classList.contains("turbo-mode")) {
            track = turboMusicTrack;
        } else {
            const currentTrack = backgroundMusic.getAttribute("src");
            if (!backgroundMusic.paused && backgroundMusicTracks.includes(currentTrack)) {
                return;
            }
            track = backgroundMusicTracks[Math.floor(Math.random() * backgroundMusicTracks.length)];
        }
    }
    if (!soundEnabled || (backgroundMusic.getAttribute("src") === track && !backgroundMusic.paused)) {
        return;
    }

    if (backgroundMusic.getAttribute("src") !== track) {
        backgroundMusic.pause();
        backgroundMusic.src = track;
    }
    backgroundMusic.volume = Number(musicVolume.value) / 100;
    backgroundMusic.play().catch((error) => {
        if (error.name === "AbortError") {
            return;
        }
        console.error("Não foi possível iniciar a música de fundo:", error);
    });
}

function updateMusicVolume() {
    const volume = Number(musicVolume.value);
    backgroundMusic.volume = volume / 100;
    musicVolumeValue.value = `${volume}%`;
    musicVolume.setAttribute("aria-valuetext", `${volume}%`);
    musicVolume.parentElement.style.setProperty("--volume-angle", `${-135 + volume * 2.7}deg`);
    musicVolume.parentElement.style.setProperty("--volume-sweep", `${volume * 2.7}deg`);
}

function syncBackgroundMusic() {
    if (!soundEnabled || (population <= 1 && !document.body.classList.contains("turbo-mode"))) {
        backgroundMusic.pause();
        return;
    }

    startBackgroundMusic();
}

updateMusicVolume();
musicVolume.addEventListener("input", updateMusicVolume);

function playBark() {
    if (!soundEnabled || !window.AudioContext) {
        return;
    }

    audioContext ??= new AudioContext();
    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    const now = audioContext.currentTime;

    for (const [index, startOffset] of [0, 0.12].entries()) {
        const start = now + startOffset;
        const oscillator = audioContext.createOscillator();
        const volume = audioContext.createGain();

        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(index === 0 ? 1050 : 880, start);
        oscillator.frequency.exponentialRampToValueAtTime(480, start + 0.085);
        volume.gain.setValueAtTime(0.0001, start);
        volume.gain.linearRampToValueAtTime(0.1, start + 0.012);
        volume.gain.exponentialRampToValueAtTime(0.0001, start + 0.09);
        oscillator.connect(volume);
        volume.connect(audioContext.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.095);
    }
}

function playCelebration() {
    if (!soundEnabled || !window.AudioContext) {
        return;
    }

    audioContext ??= new AudioContext();
    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    const now = audioContext.currentTime;
    const melody = [523.25, 659.25, 783.99, 1046.5];

    melody.forEach((frequency, index) => {
        const start = now + index * 0.16;
        const oscillator = audioContext.createOscillator();
        const volume = audioContext.createGain();

        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(frequency, start);
        volume.gain.setValueAtTime(0.0001, start);
        volume.gain.linearRampToValueAtTime(0.12, start + 0.02);
        volume.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
        oscillator.connect(volume);
        volume.connect(audioContext.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.31);
    });

    const blower = audioContext.createOscillator();
    const blowerVolume = audioContext.createGain();
    const vibrato = audioContext.createOscillator();
    const vibratoDepth = audioContext.createGain();
    const blowerStart = now + 0.65;

    blower.type = "sawtooth";
    blower.frequency.setValueAtTime(320, blowerStart);
    blower.frequency.exponentialRampToValueAtTime(1250, blowerStart + 0.18);
    blower.frequency.exponentialRampToValueAtTime(520, blowerStart + 0.85);
    vibrato.type = "square";
    vibrato.frequency.value = 24;
    vibratoDepth.gain.value = 35;
    vibrato.connect(vibratoDepth);
    vibratoDepth.connect(blower.frequency);
    blowerVolume.gain.setValueAtTime(0.0001, blowerStart);
    blowerVolume.gain.linearRampToValueAtTime(0.055, blowerStart + 0.04);
    blowerVolume.gain.setValueAtTime(0.055, blowerStart + 0.72);
    blowerVolume.gain.exponentialRampToValueAtTime(0.0001, blowerStart + 0.9);
    blower.connect(blowerVolume);
    blowerVolume.connect(audioContext.destination);
    vibrato.start(blowerStart);
    blower.start(blowerStart);
    vibrato.stop(blowerStart + 0.91);
    blower.stop(blowerStart + 0.91);
}

function celebrateGoal() {
    if (goalReached) {
        return;
    }

    goalReached = true;
    goalBanner.classList.add("completed");
    const goalTarget = turboGoalCycle
        ? turboGoalPopulation
        : normalGoalPopulation;
    const turboVictory = turboGoalCycle;
    victoryDialog.classList.toggle("turbo-victory", turboVictory);
    victoryEyebrow.textContent = turboVictory ? "MODO TURBO CONCLUÍDO" : "MISSÃO CUMPRIDA";
    document.querySelector("#victory-title").textContent = turboVictory ? "Turbo concluído!" : "Você conseguiu!";
    victoryGoalDisplay.textContent = `${goalTarget} doguinhos`;
    victoryCheer.textContent = turboVictory ? "Au au! Você reuniu 40 doguinhos turbo! 🐾" : "Au au! Você é demais! 🐾";
    playAgainLabel.textContent = turboVictory ? "Jogar novamente" : "Jogar de novo";
    gameMessage.textContent = "🎉 OBJETIVO ALCANÇADO! VOCÊ CONSEGUIU! 🎉";
    playCelebration();
    victoryDialog.showModal();
}

function updateGoalProgressDisplay() {
    const goalTarget = turboGoalCycle
        ? turboGoalPopulation
        : normalGoalPopulation;
    goalProgressDisplay.textContent = `${goalProgress}/${goalTarget}`;
}

function resetGame() {
    endTurboMode(false);
    victoryDialog.classList.remove("turbo-victory");
    const dog = firstDog.cloneNode(true);
    dogPark.replaceChildren(dog);
    placeDogRandomly(dog);
    population = 1;
    goalProgress = 1;
    turboGoalCycle = false;
    goalReached = false;
    goalBanner.classList.remove("completed");
    populationDisplay.textContent = population;
    updateGoalProgressDisplay();
    gameMessage.textContent = "Clique no doguinho para multiplicar!";
    syncBackgroundMusic();
}

function updatePopulationDisplay(previousPopulation) {
    populationDisplay.textContent = population;

    if (population <= previousPopulation) {
        return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    populationDisplay.getAnimations().forEach((animation) => animation.cancel());
    populationDisplay.animate(
        prefersReducedMotion
            ? [
                { transform: "scale(1)", color: "#fff28a" },
                { transform: "scale(1.35)", color: "#fff" },
                { transform: "scale(1)", color: "#fff28a" }
            ]
            : [
                { transform: "scale(1) rotate(0)", color: "#fff28a", textShadow: "0 0 0 transparent", offset: 0 },
                { transform: "scale(2.5) rotate(-14deg)", color: "#fff", textShadow: "0 0 28px #fff28a, 0 0 48px #ff8bd1", offset: 0.35 },
                { transform: "scale(.72) rotate(10deg)", color: "#ffdf70", textShadow: "0 0 22px #ff8bd1", offset: 0.62 },
                { transform: "scale(1.45) rotate(-5deg)", color: "#fff", textShadow: "0 0 20px #fff28a", offset: 0.82 },
                { transform: "scale(1) rotate(0)", color: "#fff28a", textShadow: "0 0 0 transparent", offset: 1 }
            ],
        {
            duration: prefersReducedMotion ? 220 : 760,
            easing: "cubic-bezier(.2, 1.5, .5, 1)",
        }
    );
}

function placeDogRandomly(dog) {
    const maxX = Math.max(0, dogPark.clientWidth - dog.offsetWidth);
    const maxY = Math.max(0, dogPark.clientHeight - dog.offsetHeight);
    const otherDogs = [...dogPark.querySelectorAll(".dog:not(.is-processing)")].filter(
        (otherDog) => otherDog !== dog
    );
    let position = { x: Math.random() * maxX, y: Math.random() * maxY };

    for (let attempt = 0; attempt < 30; attempt += 1) {
        const candidate = { x: Math.random() * maxX, y: Math.random() * maxY };
        const overlaps = otherDogs.some((otherDog) => {
            const otherX = Number.parseFloat(otherDog.style.left) || 0;
            const otherY = Number.parseFloat(otherDog.style.top) || 0;

            return Math.abs(candidate.x - otherX) < dog.offsetWidth * 0.8
                && Math.abs(candidate.y - otherY) < dog.offsetHeight * 0.8;
        });

        position = candidate;
        if (!overlaps) {
            break;
        }
    }

    dog.style.left = `${position.x}px`;
    dog.style.top = `${position.y}px`;
}

function createDog() {
    const dog = firstDog.cloneNode(true);
    const turboModeActive = document.body.classList.contains("turbo-mode");
    const hasTurboDog = dogPark.querySelector(".dog.is-turbo-dog");
    const isTurboSpawn = !turboModeActive && Math.random() < turboDogChance;

    if (!hasTurboDog && isTurboSpawn) {
        dog.classList.add("is-turbo-dog");
        dog.setAttribute("aria-label", "Doguinho Turbo, clique para ativar o Modo Turbo Au-Au");
        dog.querySelector("img").src = turboDogImage;
    } else if (turboModeActive) {
        applyTurboDogAppearance(dog);
    }

    return dog;
}

function applyTurboDogAppearance(dog) {
    if (dog.classList.contains("is-turbo-dog")) {
        return;
    }

    const image = dog.querySelector("img");
    image.dataset.normalSource ??= image.getAttribute("src");
    image.src = turboFireDogImage;
    dog.classList.add("is-fire-dog");
}

function restoreNormalDogAppearance(dog) {
    if (!dog.classList.contains("is-fire-dog")) {
        return;
    }

    const image = dog.querySelector("img");
    image.src = image.dataset.normalSource;
    delete image.dataset.normalSource;
    dog.classList.remove("is-fire-dog");
}

function updateDogsForTurboMode(isActive) {
    dogPark.querySelectorAll(".dog").forEach((dog) => {
        if (isActive) {
            applyTurboDogAppearance(dog);
        } else {
            restoreNormalDogAppearance(dog);
        }
    });
}

function createTurboParticles() {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    turboParticles.replaceChildren();

    if (prefersReducedMotion) {
        return;
    }

    for (let index = 0; index < 18; index += 1) {
        const particle = document.createElement("span");
        particle.className = "turbo-particle";
        particle.style.setProperty("--x", `${Math.random() * 100}vw`);
        particle.style.setProperty("--y", `${Math.random() * 100}vh`);
        particle.style.setProperty("--drift", `${Math.random() * 100 - 50}px`);
        turboParticles.append(particle);
    }
}

function activateTurboMode() {
    window.clearTimeout(turboTimeout);
    window.clearTimeout(announcementTimeout);
    window.clearInterval(turboFireInterval);
    document.body.classList.add("turbo-mode");
    dogPark.querySelectorAll(".dog.is-turbo-dog").forEach((dog) => dog.remove());
    updateDogsForTurboMode(true);
    goalProgress = 0;
    turboGoalCycle = true;
    goalReached = false;
    goalBanner.classList.remove("completed");
    updateGoalProgressDisplay();
    let fireFrame = 0;
    document.body.style.setProperty("--turbo-fire-frame", `url("${turboFireFrames[fireFrame]}")`);
    turboFireInterval = window.setInterval(() => {
        fireFrame = (fireFrame + 1) % turboFireFrames.length;
        document.body.style.setProperty("--turbo-fire-frame", `url("${turboFireFrames[fireFrame]}")`);
    }, 120);
    turboAnnouncement.hidden = true;
    turboAnnouncement.getBoundingClientRect();
    turboAnnouncement.hidden = false;
    createTurboParticles();

    announcementTimeout = window.setTimeout(() => {
        turboAnnouncement.hidden = true;
    }, 2600);
    turboTimeout = window.setTimeout(endTurboMode, turboDurationMs);
}

function endTurboMode(checkNormalGoal = true) {
    window.clearTimeout(turboTimeout);
    window.clearTimeout(announcementTimeout);
    window.clearInterval(turboFireInterval);
    turboTimeout = undefined;
    announcementTimeout = undefined;
    turboFireInterval = undefined;
    document.body.classList.remove("turbo-mode");
    document.body.style.removeProperty("--turbo-fire-frame");
    updateDogsForTurboMode(false);
    turboAnnouncement.hidden = true;
    turboParticles.replaceChildren();
    updateGoalProgressDisplay();
    const goalTarget = turboGoalCycle ? turboGoalPopulation : normalGoalPopulation;
    if (checkNormalGoal && goalProgress >= goalTarget) {
        celebrateGoal();
    }
    syncBackgroundMusic();
}

function keepDogsInBounds() {
    dogPark.querySelectorAll(".dog").forEach((dog) => {
        const maxX = Math.max(0, dogPark.clientWidth - dog.offsetWidth);
        const maxY = Math.max(0, dogPark.clientHeight - dog.offsetHeight);
        const x = Math.min(Number.parseFloat(dog.style.left) || 0, maxX);
        const y = Math.min(Number.parseFloat(dog.style.top) || 0, maxY);

        dog.style.left = `${x}px`;
        dog.style.top = `${y}px`;
    });
}

placeDogRandomly(dogPark.querySelector(".dog"));
window.addEventListener("resize", keepDogsInBounds);

dogPark.addEventListener("click", (event) => {
    const clickedDog = event.target.closest(".dog");
    if (
        goalReached
        || !clickedDog
        || clickedDog.classList.contains("is-processing")
        || clickedDog.classList.contains("is-popping")
    ) {
        return;
    }
    clickedDog.classList.add("is-processing");
    const isTurboDog = clickedDog.classList.contains("is-turbo-dog");
    if (isTurboDog) {
        activateTurboMode();
    }
    playBark();
    if (!isTurboDog && !document.body.classList.contains("turbo-mode")) {
        clickedDog.querySelector("img").src = happyDogImage;
    }
    clickedDog.classList.add("is-happy");
    window.setTimeout(() => {
        if (!clickedDog.isConnected) {
            return;
        }

        clickedDog.classList.remove("is-happy");
        clickedDog.classList.add("is-popping");
        clickedDog.addEventListener("animationend", () => clickedDog.remove(), { once: true });
    }, 120);

    const duplicates = Math.min(
        Math.floor(Math.random() * 3) + 1,
        maximumPopulation - (population - 1)
    );

    for (let index = 0; index < duplicates; index += 1) {
        const dog = createDog();
        dogPark.append(dog);
        placeDogRandomly(dog);
    }

    const previousPopulation = population;
    population = population - 1 + duplicates;
    if (!isTurboDog) {
        goalProgress = turboGoalCycle
            ? Math.min(goalProgress + duplicates, turboGoalPopulation)
            : population;
    }
    updateGoalProgressDisplay();
    syncBackgroundMusic();
    updatePopulationDisplay(previousPopulation);
    if (population >= maximumPopulation) {
        gameMessage.textContent = "A matilha está completa!";
    } else {
        gameMessage.textContent = duplicates === 1
            ? "Nasceu mais um doguinho!"
            : `Nasceram mais ${duplicates} doguinhos!`;
    }

    const goalTarget = turboGoalCycle
        ? turboGoalPopulation
        : normalGoalPopulation;
    if (goalProgress >= goalTarget) {
        celebrateGoal();
    }
});

soundButton.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    if (soundEnabled && musicUnlocked && (population > 1 || document.body.classList.contains("turbo-mode"))) {
        startBackgroundMusic();
    } else {
        backgroundMusic.pause();
    }
    soundButton.setAttribute("aria-pressed", soundEnabled);
    soundButton.textContent = soundEnabled ? "🔊 Som: ligado" : "🔇 Som: desligado";
});

resetButton.addEventListener("click", () => {
    resetGame();
});

playAgainButton.addEventListener("click", () => {
    victoryDialog.close();
    resetGame();
});

victoryDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    victoryDialog.close();
    resetGame();
});