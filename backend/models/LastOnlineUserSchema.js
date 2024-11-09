

const { Schema, model, default: mongoose, mongo } = require('mongoose')

const userSchema = require('./UserSchema')
const User = model('User', userSchema)

const lastOnlineUserSchema = Schema({
    userID: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User'
    },
    lastOnline: Date
})



lastOnlineUserSchema.statics.getLastOnlineStatus = async function (userIDs) {
    let lastOnlineStatuses = {}
    for (const userID of userIDs) {
        const data = await this.find({userID})
        lastOnlineStatuses[userID] = data[0].lastOnline
    }
    return lastOnlineStatuses
}

module.exports = lastOnlineUserSchema