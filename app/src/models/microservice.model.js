const mongoose = require('mongoose');

const { Schema } = mongoose;

const Microservice = new Schema({
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    updatedAt: { type: Date, default: Date.now, required: true },
    createdAt: { type: Date, default: Date.now, required: true },
    endpoints: [
        new Schema(
            {
                path: { type: String, required: true, trim: true },
                method: { type: String, required: true, trim: true },
                redirect: {
                    path: { type: String, required: true, trim: true },
                    method: { type: String, required: true, trim: true },
                },
            }, {
                _id: false
            }
        )
    ],
    version: { type: Number, required: true },
});

module.exports = mongoose.model('Microservice', Microservice);
