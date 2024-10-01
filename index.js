const express = require('express');
const oxRouter = express.Router(); // Use express.Router() instead of express.router()

oxRouter.get('/', (req, res) => {
    res.send('List of players'); // Modify message to fit the game context
});

oxRouter.post('/', (req, res) => {
    const newPlayer = req.body; // Capture the new player's information
    res.send(`Add player: ${JSON.stringify(newPlayer)}`); // Use template literal correctly
});

module.exports = oxRouter;
