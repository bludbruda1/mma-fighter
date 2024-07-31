"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FightSim_1 = require("./FightSim");
const fighters = [
    {
        id: 1,
        name: "Conor McGregor",
        age: 30,
        stikePace: 100,
        compositeRating: {
            output: 0.6,
            kicking: 0.5,
            striking: 0.7,
        },
        stat: {},
        skills: ["punching", "kicking"],
        health: 100,
    },
    {
        id: 2,
        name: "Dustin Porier",
        age: 28,
        stikePace: 1,
        compositeRating: {
            output: 0.4,
            kicking: 0.3,
            striking: 0.6,
        },
        stat: {},
        skills: ["punching", "kicking"],
        health: 100,
    },
];
let fightOver = false;
while (!fightOver) {
    const selectedFighter = (0, FightSim_1.pickFighter)(fighters);
    fightOver = (0, FightSim_1.simulateAction)(fighters, selectedFighter);
}
console.log(fighters); // Display the final health of both fighters
