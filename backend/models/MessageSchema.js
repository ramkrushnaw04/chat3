
const { Schema, mongoose, model } = require('mongoose')

const { userSchema } = require('./UserSchema')
const User = model('User', userSchema)

const { groupSchema } = require('./GroupChatSchema')
const GroupChat = model('GroupChat', groupSchema)




const fileSchema = Schema({
    name: {
        type: String,
        required: false,
    },
    type: {
        type: String,
        required: false,
    },
    size: {
        type: Number,
        required: false,
    },
    content: {
        type: String, 
        required: false,
    },
}, { _id: false })



const messageSchema = Schema({
    text: String,
    image: String,
    senderID: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User'
    },
    readBy: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User'
    }],
    chatID: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'GroupChat'
    },
    sentAt: Date,
    status: String,
    file: fileSchema,
    deleated: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        default: 'text'
    },
    repliedTo: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Message',
        default: null
    }
})






messageSchema.statics.getMessagesOfChat = async function (chatID, joinedAt, userID) {
    if (chatID == '') return
    const messages = await this
        .where('chatID').equals(chatID)
        .where('sentAt').gte(joinedAt)
        // .where('senderID').ne(userID)
        .populate('repliedTo')
        .sort({sentAt: 1})
    return messages
}



// old function works only for chats and not group chats
messageSchema.statics.markMessagesAsRead = async function (messages) {
    // messages format: [{senderID, messageID, readerID}....]
    if (!messages.length) return
    for (const { messageID, readerID } of messages) {
        // update message
        await this.findByIdAndUpdate(
            messageID,
            { $addToSet: { readBy: readerID } }
        )
    }
}


const Message = model('Message', messageSchema)

module.exports = messageSchema