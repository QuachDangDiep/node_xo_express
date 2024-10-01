const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let players = {}; // Object to store connected players
let board = Array(9).fill(null); // Initialize a 3x3 board
let currentPlayer = 'X'; // 'X' starts the game

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Check winning combinations
function checkWinner(board) {
    const winConditions = [
        // Rows (5 in a row)
        [0, 1, 2, 3, 4],
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
        [7, 8, 9, 10, 11],
        [12, 13, 14, 15, 16],
        [13, 14, 15, 16, 17],
        [18, 19, 20, 21, 22],
        [19, 20, 21, 22, 23],
        [24, 25, 26, 27, 28],
        [25, 26, 27, 28, 29],
        [30, 31, 32, 33, 34],
        [31, 32, 33, 34, 35],

        // Columns (5 in a column)
        [0, 6, 12, 18, 24],
        [6, 12, 18, 24, 30],
        [1, 7, 13, 19, 25],
        [7, 13, 19, 25, 31],
        [2, 8, 14, 20, 26],
        [8, 14, 20, 26, 32],
        [3, 9, 15, 21, 27],
        [9, 15, 21, 27, 33],
        [4, 10, 16, 22, 28],
        [10, 16, 22, 28, 34],
        [5, 11, 17, 23, 29],
        [11, 17, 23, 29, 35],

        // Diagonals
        [0, 7, 14, 21, 28],
        [1, 8, 15, 22, 29],
        [6, 13, 20, 27, 34],
        [7, 14, 21, 28, 35],
        [5, 10, 15, 20, 25],
        [4, 9, 14, 19, 24],
        [11, 16, 21, 26, 31],
        [10, 15, 20, 25, 30],
    ];

    for (const condition of winConditions) {
        const [a, b, c, d, e] = condition;
        if (board[a] && board[a] === board[b] && board[a] === board[c] && board[a] === board[d] && board[a] === board[e]) {
            return board[a];
        }
    }

    return null;
}


io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Assign player X or O
    if (Object.keys(players).length < 2) {
        players[socket.id] = Object.keys(players).length === 0 ? 'X' : 'O';
        socket.emit('player-assign', players[socket.id]);
    } else {
        socket.emit('game-full'); // Notify when two players are already in the game
    }

    // Send the current board state to the new player
    socket.emit('board-update', board);

    // Handle a player making a move
    socket.on('make-move', (index) => {
        if (board[index] === null && players[socket.id] === currentPlayer) {
            board[index] = currentPlayer;
            const winner = checkWinner(board); // Check for a winner
            io.emit('board-update', board); // Update the board for all players
            
            if (winner) {
                io.emit('game-over', { winner }); // Notify game over
                // Reset the game after a short delay (optional)
                setTimeout(() => {
                    board = Array(9).fill(null); // Reset the board
                    currentPlayer = 'X'; // Reset the starting player
                    io.emit('board-update', board); // Broadcast the updated empty board
                }, 3000);
            } else {
                currentPlayer = currentPlayer === 'X' ? 'O' : 'X'; // Switch player turn
            }
        }
    });

    // Handle clearing the board
    socket.on('clear-board', () => {
        board = Array(9).fill(null); // Reset the board
        io.emit('board-update', board); // Broadcast the updated empty board
    });

    // Handle player disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        delete players[socket.id]; // Remove player from the game
        io.emit('player-disconnect'); // Notify others
        board = Array(9).fill(null); // Reset the board
        currentPlayer = 'X'; // Reset the starting player
    });

});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
