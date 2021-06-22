const mongoose = require('mongoose');
require('mongoose-regexp')(mongoose);

const { Schema } = mongoose;

const Endpoint = new Schema({
    path: {
        type: String,
        required: true,
        trim: true
    },
    method: {
        type: String,
        required: true,
        trim: true
    },
    pathRegex: {
        type: RegExp,
        required: true
    },
    pathKeys: [{
        type: String,
        trim: true
    }],
    binary: {
        type: Boolean,
        default: false
    },
    redirect: {
        path: {
            type: String,
            required: true,
            trim: true
        },
        url: {
            type: String,
            required: true,
            trim: true
        },
        method: {
            type: String,
            required: true,
            trim: true
        },
        microservice: {
            type: String,
            required: false,
            trim: true
        }
    },
    updatedAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true
    }
});

module.exports = mongoose.model('Endpoint', Endpoint);
