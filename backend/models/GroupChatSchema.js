
const { Schema, mongoose, model } = require('mongoose')

const UserSchema = require('./UserSchema')
const User = model('User', UserSchema)


const groupSchema = Schema({
    name: String,
    profile: String,
    members: [{
        
        userID: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "User"
        },
        _id: false

    }]
})



module.exports = groupSchema