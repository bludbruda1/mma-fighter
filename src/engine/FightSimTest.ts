import { pickFighter, FighterSim, simulateAction } from './FightSim';

const fighters: [FighterSim, FighterSim] = [
    {
        id: 1,
        name: "Fighter 1",
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
        name: "Fighter 2",
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
    const selectedFighter = pickFighter(fighters);
    fightOver = simulateAction(fighters, selectedFighter);
}

console.log(fighters); // Display the final health of both fighters
