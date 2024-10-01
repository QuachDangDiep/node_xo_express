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
const checkWinner = (board) => {
    const winningCombinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]            // Diagonals
    ];

    for (let combo of winningCombinations) {
        const [a, b, c] = combo;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a]; // Return 'X' or 'O'
        }
    }
    return board.includes(null) ? null : 'Draw'; // Return 'Draw' if no spaces left
};

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
