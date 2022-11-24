function clone<T>(instance: T): T {
    const copy = new (instance.constructor as { new(): T })();
    Object.assign(copy, instance);
    return copy;
}

class Vector {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    distance(p: Vector): number {
        return Math.sqrt(Math.pow(this.x - p.x, 2) + Math.pow(this.y - p.y, 2));
    }

    equals(p: Vector): boolean {
        return this.x === p.x && this.y === p.y;
    }

    add(p: Vector): Vector {
        return new Vector(this.x + p.x, this.y + p.y);
    }

    subtract(p: Vector): Vector {
        return new Vector(this.x - p.x, this.y - p.y);
    }

    multiply(n: number): Vector {
        return new Vector(this.x * n, this.y * n);
    }

    divide(n: number): Vector {
        return new Vector(this.x / n, this.y / n);
    }

    round(): Vector {
        return new Vector(Math.round(this.x), Math.round(this.y));
    }

    truncate(): Vector {
        return new Vector(Math.floor(this.x), Math.floor(this.y));
    }

    length(): number {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }

    projectedLengthOn(v: Vector): number {
        if (this.length() === 0) {
            return 0
        }

        return (this.x * v.x + this.y * v.y) / this.length()
    }

    angle(): number {
        return this.radToAbsDeg(Math.atan2(this.y, this.x));
    }

    angleTo(v: Vector): number {
        return this.radToAbsDeg(Math.atan2(v.y - this.y, v.x - this.x));
    }

    radToAbsDeg(n: number): number {
        const deg = n * 180 / Math.PI;

        if (deg < 0) {
            return 360 + deg;
        }

        return deg;
    }

    toString(): string {
        return `(${this.x},${this.y})`;
    }
}

class Game {
    // Generic game information
    iterationCount = 0;
    laps: number;
    gamestate: GameState = new GameState();

    static DRAG_COEFF = 0.85;
    static CHECKPOINT_RADIUS = 550;
    static INITIAL_TIMEOUT = 980;
    static TIMEOUT = 70;


    // Map details
    checkpoints: Vector[] = [];

    constructor(laps: number, checkpoints: Vector[]) {
        this.laps = laps;
        this.checkpoints = checkpoints;
    }

    startTurn(podsData: number[][]) {
        this.gamestate.startTurn(podsData, this);
    }

    closeTurn() {
        this.iterationCount++;
        this.gamestate.closeTurn();
    }
}

class GameState {
    pods: Pod[] = [];
    opponentPods: Pod[] = [];

    constructor() {
        for (let i = 0; i < 2; i++) {
            this.pods.push(new Pod());
            this.opponentPods.push(new Pod());
        }
    }

    startTurn(podsData: number[][], game: Game) {
        for (let i = 0; i < 2; i++) {
            this.pods[i].update(podsData[i], game);
            this.opponentPods[i].update(podsData[i + 2], game);
        }
    }

    closeTurn() {
        // Do Nothing
    }
}

class Pod {
    boostCount: number;
    pos: Vector;
    speed: Vector;
    angle: number;
    nextCheckPointId: number;

    constructor(
        boostCount?: number,
        pos?: Vector,
        speed?: Vector,
        angle?: number,
        nextCheckPointId?: number
    ) {
        this.boostCount = boostCount ?? 1;
        this.pos = pos ?? new Vector(0, 0);
        this.speed = speed ?? new Vector(0, 0);
        this.angle = angle ?? 0;
        this.nextCheckPointId = nextCheckPointId ?? 0;
    }

    update(data: number[], game: Game) {
        this.pos = new Vector(data[0], data[1]);
        this.speed = new Vector(data[2], data[3]);
        this.nextCheckPointId = data[5];
        this.angle = data[4] === -1 ? Math.round(this.pos.angleTo(game.checkpoints[this.nextCheckPointId])) : data[4];
    }

    getOutputString(instruction: InstructionSet): string {
        if (instruction.boost) {
            this.boostCount--;
        }

        const nextAngle =
            (Math.PI * ((instruction.angle + this.angle) % 360)) / 180;
        const targetX = this.pos.x + Math.round(Math.cos(nextAngle) * 4000);
        const targetY = this.pos.y + Math.round(Math.sin(nextAngle) * 4000);

        return `${targetX} ${targetY} ${instruction.shield
            ? "SHIELD"
            : instruction.boost
                ? "BOOST"
                : Math.round(instruction.thrust)
        }`;
    }

    simulate(instruction: InstructionSet, game: Game): Pod {
        const nextAngle = Math.round(this.angle + instruction.angle);
        const nextThrust =
            instruction.boost && this.boostCount > 0 ? 650 : instruction.thrust;
        const speed = this.speed.add(
            new Vector(
                nextThrust * Math.cos(nextAngle) - nextThrust * Math.sin(nextAngle),
                nextThrust * Math.sin(nextAngle) + nextThrust * Math.cos(nextAngle)
            )
        );
        const nextPos = this.pos.add(speed).round();
        const nextSpeed = speed.multiply(Game.DRAG_COEFF).truncate();
        const nextBoost = instruction.boost ? this.boostCount - 1 : this.boostCount;
        const nextCheckPointId =
            nextPos.distance(game.checkpoints[this.nextCheckPointId]) <
            Game.CHECKPOINT_RADIUS
                ? this.nextCheckPointId + 1
                : this.nextCheckPointId;

        return new Pod(nextBoost, nextPos, nextSpeed, nextAngle, nextCheckPointId);
    }
}

interface InstructionSet {
    angle: number;
    shield: boolean;
    boost: boolean;
    thrust: number;
}

type Genome = Gene[];

class Gene {
    angleCoeff: number;
    boostCoeff: number;
    shieldCoeff: number;
    thrustCoeff: number;

    constructor(
        angleCoeff?: number,
        boostCoeff?: number,
        shieldCoeff?: number,
        thrustCoeff?: number
    ) {
        this.angleCoeff = angleCoeff || Math.random();
        this.boostCoeff = boostCoeff || Math.random();
        this.shieldCoeff = shieldCoeff || Math.random();
        this.thrustCoeff = thrustCoeff || 1;
    }

    getOutput(): InstructionSet {
        let shield = false;
        let boost = false;
        let thrust = 0;
        let angle = 0;

        if (this.shieldCoeff > 0.95) {
            // shield = true
        }

        if (this.boostCoeff > 0.95) {
            boost = true;
        }

        if (this.angleCoeff < 0.25) {
            angle = -18;
        } else if (this.angleCoeff > 0.75) {
            angle = 18;
        } else if (this.angleCoeff < 0.6 && this.angleCoeff > 0.4) {
            angle = 18;
        } else {
            angle = -18 + 36 * ((this.angleCoeff - 0.25) * 2.0);
        }

        if (this.thrustCoeff < 0.25) {
            thrust = 0;
        } else if (this.thrustCoeff > 0.75) {
            thrust = 100;
        } else {
            thrust = 100 * ((this.thrustCoeff - 0.25) * 2.0);
        }

        return {boost, shield, thrust, angle};
    }

    mutate(): Gene {
        const modifyProb = Math.random()

        return new Gene(
            modifyProb < 0.4 ? Math.random() : this.angleCoeff,
            modifyProb >= 0.4 && modifyProb < 0.8 ? Math.random() : this.boostCoeff,
            modifyProb >= 0.8 && modifyProb < 0.9 ? Math.random() : this.shieldCoeff,
            Math.random() >= 0.9 ? Math.random() : this.thrustCoeff,
        );
    }
}

class GeneticAlgorithm {
    static GENERATION_SIZE = 8;
    static PROJECTION_DEPTH = 6;

    genomes: Genome[] = [];

    constructor() {
        this.genomes = [...Array(GeneticAlgorithm.GENERATION_SIZE).keys()].map(() =>
            [...Array(GeneticAlgorithm.PROJECTION_DEPTH).keys()].map(() => new Gene())
        );
    }

    private scoreGenome(genome: Genome, game: Game): number {
        const finalPod = genome.reduce(
            (acc, gene) => acc.simulate(gene.getOutput(), game),
            game.gamestate.pods[0]
        );
        const distanceScore =
            finalPod.nextCheckPointId > game.gamestate.pods[0].nextCheckPointId
                ? 10000
                : 5000 - finalPod.pos.distance(
                game.checkpoints[finalPod.nextCheckPointId]
            )
        const speedScore = 10 * finalPod.speed.projectedLengthOn(game.checkpoints[finalPod.nextCheckPointId].subtract(finalPod.pos));

        return distanceScore + speedScore;
    }

    private getTopGenome(game: Game): Genome {
        const scores = this.genomes.map((genome) => this.scoreGenome(genome, game));

        const index = scores.indexOf(
            scores.reduce((acc, score) => Math.max(acc, score))
        );

        return this.genomes[index];
    }

    evaluateNextInstruction(game: Game, timeout: number): Genome {
        let generationCount = 0;
        while (Date.now() < timeout) {
            const topGenome = this.getTopGenome(game);

            this.genomes = [topGenome];

            for (let i = 1; i < GeneticAlgorithm.GENERATION_SIZE; i++) {
                this.genomes.push(topGenome.map((gene) => gene.mutate()));
            }
            generationCount++;
        }

        console.error(generationCount);
        console.error(game.gamestate.pods[0]);
        console.error(
            game.gamestate.pods[0].simulate(this.genomes[0][0].getOutput(), game)
        );
        console.error(this.genomes[0][0].getOutput());

        return this.genomes[0];
    }

    closeTurn() {
        this.genomes = this.genomes.map(genome => genome.slice(1).concat(new Gene()))
    }
}

// Data init
const laps = parseInt(readline().split(" ")[0], 10);
const checkpointCount = parseInt(readline().split(" ")[0], 10);
const checkpointsData: Vector[] = [];
for (let i = 0; i < checkpointCount; i++) {
    const data = readline().split(" ");
    checkpointsData.push(
        new Vector(parseInt(data[0], 10), parseInt(data[1], 10))
    );
}
const game = new Game(laps, checkpointsData);
let ai = new GeneticAlgorithm();

// Game loop
while (true) {
    // Turn init
    const podsData: number[][] = [];
    for (let i = 0; i < 4; i++) {
        podsData.push(
            readline()
                .split(" ")
                .map((x) => parseInt(x, 10))
        );
    }
    game.startTurn(podsData);

    const timeout = game.iterationCount > 0 ? Date.now() + Game.TIMEOUT : Date.now() + Game.INITIAL_TIMEOUT;
    const nextGenome = ai.evaluateNextInstruction(game, timeout);

    // Output
    if (game.iterationCount === 0) {
        console.log(`${game.checkpoints[1].x} ${game.checkpoints[1].y} 100`);
    } else {
        console.log(
            game.gamestate.pods[0].getOutputString(nextGenome[0].getOutput())
        );
    }
    console.log(
        game.gamestate.pods[1].getOutputString({
            shield: false,
            boost: false,
            thrust: 0,
            angle: 0,
        })
    );

    // Post output cleanup
    game.closeTurn();
    ai.closeTurn();
}
