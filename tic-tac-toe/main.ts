enum Owner {
    None = 0,
    Enemy = -1,
    Ai = 1,
}

type BoardState = Owner[]

type Move = {
    owner: Owner,
    point: Point,
}

class Game {
    board: BoardState
    lastMove: Move | null

    static BOARD_WIDTH = 9

    constructor(board?: BoardState, lastMove?: Move) {
        this.board = board || new Array(9).fill(Owner.None)
        this.lastMove = lastMove || null
    }

    getRow(n: number): Owner[] {
        const start = Game.BOARD_WIDTH * n
        return this.board.slice(start, start + 3)
    }

    getColumn(n: number): Owner[] {
        return [this.board[n], this.board[n + Game.BOARD_WIDTH], this.board[n + Game.BOARD_WIDTH * 2]]
    }

    getDiagonal(n: number) {
        return [this.board[n], this.board[n + Game.BOARD_WIDTH], this.board[n + Game.BOARD_WIDTH * 2]]
    }

    getOwner(cells: Owner[]): Owner | null {
        let owner = cells[0]

        for (let i = 1; i < cells.length; i++) {
            if (owner !== cells[i]) {
                return null
            }
        }

        return owner
    }

    get winner(): Owner | null {
        let winner = null

        // Horizontal
        for (let i = 0; i < 3; i++) {
            const winner = this.getOwner(this.getRow(i))

            if (winner) {
                return winner
            }
        }

        // Vertical
        for (let i = 0; i < 3; i++) {
            const winner = this.getOwner(this.getColumn(i))

            if (winner) {
                return winner
            }
        }

        // Diagonals
        for (let i = 0; i < 2; i++) {
            const winner = this.getOwner(this.getDiagonal(i))

            if (winner) {
                return winner
            }
        }

        return winner
    }

    get isFinished(): boolean {
        for (const cell of this.board) {
            if (cell === Owner.None) {
                return false
            }
        }

        return true
    }

    get availableMoves(): Point[] {
        return this.board
            .reduce((acc, owner, id) => {
                if (owner !== Owner.None) {
                    return acc.concat(Point.fromId(id))
                }

                return acc
            }, [])
    }

    simulate(move: Point, player: Owner) {
        if (this.board[move.id] === Owner.None) {
            const nextBoard = [...this.board]
            nextBoard[move.id] = player
            return new Game(
                nextBoard
            )
        }

        return this
    }

    toString(): string {
        let output = ''
        for (let i = 0; i < 9; i++) {
            output += `${this.board[i]} | `

            if (i % 3 === 2) {
                output += '\n -   -   - \n'
            }
        }

        return output
    }
}

class Point {
    row: number
    col: number

    constructor(row: number, col: number) {
        this.row = row
        this.col = col
    }

    static fromId(id: number): Point {
        return new Point(
            Math.floor(id / Game.BOARD_WIDTH),
            id % Game.BOARD_WIDTH
        )
    }

    get id(): number {
        return this.row * 3 + this.col
    }
}

interface Node extends Record<number, Node> {
}

class Solution {
    nodes: Node

    constructor(nodes: Node) {
        this.nodes = nodes;
    }

    getMove(enemyPlay: Point): Point {
        const id = parseInt(Object.keys(this.nodes[enemyPlay.id])[0])
        this.nodes = this.nodes[enemyPlay.id][id]

        return Point.fromId(id)
    }
}

class AI {
    static MAX_DEPTH = -1

    getSolutionSpace(firstMove: Point): Solution {
        let game = new Game()
        if (firstMove.row !== -1 || firstMove.col !== -1) {
            game = game.simulate(firstMove, Owner.Enemy)
        }

        return this.evaluateNextDepth(game) || new Solution({})
    }

    evaluateNextDepth(game: Game, player: Owner = Owner.Ai): Solution | null {
        if (game.winner === Owner.Ai) {
            return
        }

        const availableMoves = game.availableMoves;
        const nextGames: Record<number, Game> = {}

        for (let i = 0; i < availableMoves.length; i++) {
            const simulation = game.simulate(availableMoves[i], player)

            if (simulation.winner === Owner.Ai) {
                return new Solution({
                    [availableMoves[i].id]: {}
                })
            }

            if (!simulation.isFinished) {
                nextGames[availableMoves[i].id] = simulation
            }
        }

        if (Object.keys(nextGames).length === 0) {
            return null
        }

        const nodes = Object.entries(nextGames).reduce((acc, [id, nextGame]) => {
            const nextTree = this.evaluateNextDepth(nextGame, this.getOtherPlayer(player))
            if (nextTree) {
                return ({
                    ...acc,
                    [id]: nextTree
                })
            }

            return acc
        }, {})

        if (Object.keys(nodes).length === 0) {
            return null
        }

        return new Solution(nodes)
    }

    private getOtherPlayer(player: Owner) {
        if (player === Owner.Enemy) {
            return Owner.Ai
        }

        if (player === Owner.Ai) {
            return Owner.Enemy
        }

        return Owner.None
    }
}

// game loop
const ai = new AI()
let solution: Solution | null = null
while (true) {
    var inputs: string[] = readline().split(' ');
    const move = new Point(parseInt(inputs[0]), parseInt(inputs[1]))
    const validActionCount: number = parseInt(readline());
    for (let i = 0; i < validActionCount; i++) {
        var inputs: string[] = readline().split(' ');
        // const row: number = parseInt(inputs[0]);
        // const col: number = parseInt(inputs[1]);
    }

    if (!solution) {
        solution = ai.getSolutionSpace(move)
    }

    const nextPoint = solution.getMove(move)

    console.log(`${nextPoint.row} ${nextPoint.col}`);
}
