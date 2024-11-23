
const { Schema, mongoose, model } = require('mongoose')

const userSchema = require('./UserSchema')
const User = model('User', userSchema)

const groupSchema = require('./GroupChatSchema')
const GroupChat = model('GroupChat', groupSchema)


const userGroupSchema = Schema({
    userID: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User'
    },
    groupID: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'GroupChat'
    },
    joinedAt: {
        type: Date
    }
})



userGroupSchema.statics.getAllUserGroups = async function (userID) {
    const groups = await this.find({userID})
        .select('groupID')
        .populate({
            path: 'groupID',
            populate: {
                path: 'members.userID',
                model: 'User',
                select: ['firstName', 'lastName', 'email', 'profile']
            }
        })
    
    const transformedGroups = groups.map(group => ({
        ...group.groupID.toObject()
    }))

    return transformedGroups
}



module.exports = userGroupSchema