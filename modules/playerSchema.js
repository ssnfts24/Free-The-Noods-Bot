const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
        username: { type: String, required: true },
            points: { type: Number, default: 0 },
                rescuedNoods: { type: Number, default: 0 },
                    inventory: [{ itemName: String, quantity: Number }]
                    });

                    module.exports = mongoose.model('Player', playerSchema);