
const { Schema, mongoose, model } = require('mongoose')

const UserSchema = require('./UserSchema')
const User = model('User', UserSchema)


const groupSchema = Schema({
    name: {
        type: String,
        default: ''
    },
    profile: {
        type: String,
        default: '',
        require: false
    },
    type: {
        type: String,
        default: 'private'
    },
    members: [{
        
        userID: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "User"
        },
        _id: false

    }],
    description: {
        type: String,
        require: false,
        default: ''
    }
})



module.exports = groupSchema