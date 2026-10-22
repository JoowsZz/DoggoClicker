const dogPark = document.querySelector("#dog-park");
const populationDisplay = document.querySelector("#population");
const gameMessage = document.querySelector("#game-message");
const soundButton = document.querySelector("#sound-button");
const resetButton = document.querySelector("#reset-button");
const goalBanner = document.querySelector("#goal-banner");
const victoryDialog = document.querySelector("#victory-dialog");
const playAgainButton = document.querySelector("#play-again-button");
const firstDog = dogPark.querySelector(".dog").cloneNode(true);
const happyDogImage = "img/cachorro_pixel_feliz.png";
const maximumPopulation = 100;
const goalPopulation = 20;

let population = 1;
let soundEnabled = true;
let audioContext;
let goalReached = false;

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
    gameMessage.textContent = "🎉 OBJETIVO ALCANÇADO! VOCÊ CONSEGUIU! 🎉";
    playCelebration();
    victoryDialog.showModal();
}

function resetGame() {
    const dog = firstDog.cloneNode(true);
    dogPark.replaceChildren(dog);
    placeDogRandomly(dog);
    population = 1;
    goalReached = false;
    goalBanner.classList.remove("completed");
    populationDisplay.textContent = population;
    gameMessage.textContent = "Clique no doguinho para multiplicar!";
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
    playBark();
    clickedDog.querySelector("img").src = happyDogImage;
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
        const dog = firstDog.cloneNode(true);
        dogPark.append(dog);
        placeDogRandomly(dog);
    }

    const previousPopulation = population;
    population = population - 1 + duplicates;
    updatePopulationDisplay(previousPopulation);
    if (population >= maximumPopulation) {
        gameMessage.textContent = "A matilha está completa!";
    } else {
        gameMessage.textContent = duplicates === 1
            ? "Nasceu mais um doguinho!"
            : `Nasceram mais ${duplicates} doguinhos!`;
    }

    if (population >= goalPopulation) {
        celebrateGoal();
    }
});

soundButton.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
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