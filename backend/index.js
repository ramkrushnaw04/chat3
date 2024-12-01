const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

const userSchema = require('./models/UserSchema');
const User = mongoose.model('User', userSchema);

const groupChatSchema = require('./models/GroupChatSchema');
const GroupChat = mongoose.model('GroupChat', groupChatSchema);

const userGroupSchema = require('./models/UserGroupSchema');
const UserGroup = mongoose.model('UserGroup', userGroupSchema);

const lastOnlineUserSchema = require('./models/LastOnlineUserSchema');
const LastOnlineUser = mongoose.model('LastOnlineUser', lastOnlineUserSchema);

const messageSchema = require('./models/MessageSchema');
const Message = mongoose.model('Message', messageSchema)

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    },
    maxHttpBufferSize: 1e8,
});

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;
const dbURL = process.env.DB_URL

let onlineUsers = {} // format: userID: socketID

mongoose.connect(dbURL)
    .then(() => console.log('Connected to MongoDB'))
    .catch(error => console.error('Connection error:', error));



io.on('connection', socket => {
    console.log(`${socket.id} connected`);

    socket.on('get-user-info-form-authID', async (data, callback) => {
        if(!data?.authID) return

        try {
            const user = await User.find({ authID: data.authID });
            const userID = String(user[0]._id)
            onlineUsers[userID] = socket.id
            callback(user[0]);
        } catch (e) {
            console.log("error 'get-user-info-form-authID': ", e.message)
            callback(null)
        }
    });

    socket.on('sign-up', async (data, callback) => {
        try {
            // check if user exists already
            const u = await User.find({authID: data.user.uid})
            if(u[0]) {
                callback({status: 'duplicate'})
                return
            }

            const user = new User({
                authID: data.user.uid,
                firstName: data.firstName,
                lastName: data.lastName,
                profile: data.user.photoURL,
                email: data.user.email,
            });
            const lastOnline = new LastOnlineUser({
                userID: user._id,
                lastOnline: Date.now()
            });
            await user.save();
            await lastOnline.save();
            callback(user);

        } catch (e) {
            console.log("error 'sing-up': ", e.message)
            callback(null)
        }
    });

    socket.on('get-users-from-query', async (data, callback) => {
        try {
            const { query } = data;
            const searchedUsers = await User.findByQuery(query);
            callback(searchedUsers);
        } catch (e) {
            console.log("error 'het-users-from-qurey': , ", e.message)
            callback(null)
        }
    });

    socket.on('create-chat', async (data, callback) => {
        try {
            const members = data.userIDs.map(item => ({ userID: item }));
            const groupChat = new GroupChat({
                name: data.name,
                members,
                profile: data.profile,
                type: data.type,
                description: data.description
            });

            // if chat is private then check if another chat exists with same 
            if(data.type == 'private') {
                const group = await GroupChat.findOne({
                    type: 'private',
                    members: { $all: members }
                })
                if(group) {
                    callback({success: false, message: 'Chat already exists!'})
                    return
                }
            }


            const groupPromises = members.map(user => {
                const userGroup = new UserGroup({
                    userID: user.userID,
                    groupID: groupChat._id,
                    joinedAt: Date.now()
                });
                return userGroup.save();
            });
            await Promise.all(groupPromises);
            await groupChat.save();

            // create a room of all these users
            const roomName = String(groupChat._id)
            for (const item of members) {
                const socketID = onlineUsers[item.userID]
                const targetSocket = io.sockets.sockets.get(socketID) // find socket of this user
                if (targetSocket) targetSocket.join(roomName)
            }

            // now send message to this room that this user has joined
            const populatedGroup = await GroupChat.findById(groupChat._id).populate('members.userID');
            io.to(roomName).emit('group-created', populatedGroup)

            const alertMessage = new Message({
                text: data.creationMessgae,
                chatID: groupChat._id,
                type: 'alert',
                sentAt: Date.now()
            })
            alertMessage.save()
            io.to(data.chatID).emit('message', alertMessage)

            callback({ success: true, groupID: groupChat._id });
        } catch (e) {
            console.log("error 'create-chat': ", e.message)
            callback({ success: false })
        }
    });

    socket.on('message', async ({ room, messageData }) => {
        try {
            // save message to db
            const message = new Message({
                ...messageData,
                status: 'sent',
            });
            await message.save();
            const messageToSend = message.toObject()
            messageToSend.repliedTo = messageData.repliedTo

            socket.to(room).emit('message', messageToSend);
            socket.emit('update-message', {
                messageID: messageData.ID,
                status: 'sent',
                chatID: messageData.chatID,
                type: 'sent',
                _id: message._id,
            })
        } catch (e) {
            console.log("error 'message': ", e.message)
        }

    });


    socket.on('file-message', async (data, callback) => {
        try {
            callback({ res: true })
        } catch (e) {
            console.log("error 'file-message': ", e.message)
            callback({ res: false })
        }
    })


    socket.on('messages-read', async ({ chatID, pendingMessagesIDs }) => {
        // we are sending message sent only to the clients (if online) who sent the message
        // because for the other clients this info is useless
        try {
            for (const { messageID, readerID, senderID } of pendingMessagesIDs) {
                if (onlineUsers[senderID]) {
                    const socketID = String(onlineUsers[senderID]) // send message to senderID socket
                    io.to(socketID).emit('update-message', {
                        chatID,
                        messageID,
                        type: 'read',
                        readerID
                    })
                }
            }
            // upadte db
            await Message.markMessagesAsRead(pendingMessagesIDs)
        } catch (e) {
            console.log("error 'messages-read': , ", e.message)
        }

    })

    socket.on('message-delete', async (data) => {
        try {
            await Message.findByIdAndUpdate(
                data.messageID,
                { deleated: true },
            )
            const roomName = String(data.chatID)
            io.to(roomName).emit('update-message', { ...data, type: 'delete' })
        } catch (e) {
            console.log("error 'message-read': ", e.message)
        }
    })

    socket.on('get-all-groupChats', async (data, callback) => {
        try {
            const searchedGroups = await UserGroup.getAllUserGroups(data.userID);
            searchedGroups.forEach(async group => {
                // join the user to each chat (room) they are a part of
                const roomName = String(group._id)
                socket.join(roomName);

                // get last online time of the user
                const time = await LastOnlineUser.find({ userID: data.userID })
                socket.to(roomName).emit('user-online', { userID: data.userID, lastOnline: time[0]?.lastOnline })
            });
            callback(searchedGroups);
        } catch (e) {
            console.log("error 'get-all-groupChats': ", e.message)
            callback([])
        }
    });


    socket.on('get-online-users', async (data, callback) => {
        try {
            const searchedGroups = await UserGroup.getAllUserGroups(data.userID);
            let users = new Set()

            searchedGroups.forEach(group => {
                // check for each member if its online
                for (const item of group.members) {
                    const memberID = String(item.userID?._id)
                    if (onlineUsers[memberID]) {
                        users.add(memberID)
                    }
                }
            });
            const usersArray = Array.from(users)
            callback(usersArray)
        } catch (e) {
            console.log("error 'get-online-users': ", e.message)
            callback([])
        }
    });

    socket.on('user-typing', async (data) => {
        try {
            socket.to(data.groupID).emit('user-typing', data)
        } catch (e) {
            console.log("error 'user-typing': ", e.message)
        }
    })


    socket.on('get-last-online-statuses', async (data, callback) => {
        try {
            if (!data.userIDs.length) {
                callback({})
                return
            }
            const lastOnlineStatuses = await LastOnlineUser.getLastOnlineStatus(data.userIDs)
            callback(lastOnlineStatuses)
        } catch (e) {
            console.log("error 'get-last-online-statuses': ", e.message)
        }
    })

    socket.on('get-all-messages-of-chat', async ({ chatID, userID }, callback) => {
        try {
            const userGroup = await UserGroup.find({
                userID,
                groupID: chatID
            })
            const joinedAt = userGroup[0]?.joinedAt
            const messages = await Message.getMessagesOfChat(chatID, joinedAt, userID)
            callback(messages)
        } catch (e) {
            console.log("error 'get-all-messages-of-chat': ", e.message)
            callback([])
        }
    })

    
    socket.on('update-user-info', async (data, callback) => {
        try {
            const newUser = await User.findByIdAndUpdate(data._id, data.update, { new: true })
            callback({success: true, newUser, message: 'User profile updated successfully!'})
        } catch (e) {
            console.log("error 'update-user-info': ", e.message)
            callback({success: false, message: 'Error updating user profile'})
        }
    })

    socket.on('leave-user-group', async ({ userID, chatID }, callback) => {
        try {
            // data: {userID, chatID}
            // update UserGroup
            await UserGroup.deleteOne({ userID, groupID: chatID })

            // remove the user from groupChat members
            await GroupChat.findByIdAndUpdate(
                chatID,
                { $pull: { members: { userID } } },
            )

            const userInfo = await User.findById(userID)
            const alertMessage = new Message({
                type: 'alert',
                text: `${userInfo.firstName} ${userInfo.lastName} has left the chat.`,
                chatID,
                sentAt: Date.now()
            })
            await alertMessage.save()

            // send message to all the users in that chat
            const roomName = String(chatID)
            io.to(roomName).emit('group-update', {
                type: 'userLeave',
                userID,
                chatID,
                time: Date.now(),
                alertMessage
            })


            // leave room
            socket.leave(roomName)
        } catch (e) {
            console.log("error 'leave-user-group': ", e.message)
        }
    })


    socket.on('join-user-group', async ({ userID, chatID, adderName }, callback) => {
        try {
            // create userGroup only when there is none already
            const userGroupAlready = await UserGroup.find({ userID, groupID: chatID })
            if (!userGroupAlready.length) {
                const userGroup = await UserGroup(
                    {
                        userID,
                        groupID: chatID,
                        joinedAt: Date.now()
                    })
                await userGroup.save()
            } else {
                // callback({message: 'user already in group'})
                return
            }
            // add the user groupChat
            const updatedGroupRes = await GroupChat.findByIdAndUpdate(
                chatID,
                { $addToSet: { members: { userID } } },
                { new: true }
            )

            const updatedGroup = {
                ...updatedGroupRes,
                members: updatedGroupRes.members.map(item => String(item.userID)),
                profile: updatedGroupRes.profile,
                description: updatedGroupRes.description,
            }

            // make the other user join this room if they are online
            const socketID = onlineUsers[userID]
            if (socketID) {
                const targetSocket = io.sockets.sockets.get(socketID)
                targetSocket.join(chatID)
            }

            // get all the lastOnlien info of users
            const lastOnlineStatuses = await LastOnlineUser.getLastOnlineStatus(updatedGroup.members)
            // get online members
            const onlineMembers = updatedGroup.members.filter(item => onlineUsers[item])

            // get infos of members
            let userInfos = {}
            for (const item of updatedGroup.members) {
                const userInfo = await User.findById(item)
                userInfos[item] = userInfo
            }


            // send message to all the users in that chat
            const userInfo = await User.findById(userID)

            // create an alert message that the user has left that chat
            const alertMessage = new Message({
                type: 'alert',
                text: `${adderName} added ${userInfo.firstName} ${userInfo.lastName}.`,
                chatID,
                sentAt: Date.now()
            })
            await alertMessage.save()

            io.to(chatID).emit('group-update', {
                type: 'userJoin',
                userID,
                chatID,
                time: Date.now(),
                userInfo,
                group: updatedGroup._doc,
                lastOnlineStatuses,
                onlineMembers,
                userInfos,
                alertMessage
            })
        } catch (e) {
            console.log("error 'join-user-group': ", e.message)
        }
    })

    socket.on('edit-group', async (data) => {
        try {
            await GroupChat.findByIdAndUpdate(
                data.chatID,
                {
                    name: data.name,
                    description: data.description,
                    profile: data.profile
                },
            )
            const message = new Message({
                type: 'alert',
                text: `${data.editorName} updated group info.`,
                chatID: data.chatID,
                sentAt: Date.now()
            })
            await message.save()

            io.to(data.chatID).emit('edit-group', { ...data, chatID: data.chatID })
            io.to(data.chatID).emit('message', message)
        } catch (e) {
            console.log("error 'edit-group': ", e.message)
        }
    })

    socket.on('delete-chat', async (data, callback) => {
        try {
            const { chatID, otherUserID, userID } = data
            await GroupChat.findByIdAndDelete(chatID)
            await UserGroup.deleteOne({ groupID: chatID, userID: userID })
            await UserGroup.deleteOne({ groupID: chatID, userID: otherUserID })

            // send message that user is removed
            io.to(chatID).emit('delete-chat', { chatID })

            // remove this user form room of this chat
            socket.leave(chatID)

            // remove other user from room of this chat
            const socketID = onlineUsers[otherUserID]
            if (socketID) {
                const socket = io.sockets.sockets.get(socketID);
                socket.leave(chatID)
            }
            callback({success: true, message: 'Chat deleated successfully!'})
        } catch (e) {
            console.log("error 'delete-chat': ", e.message)
            callback({success: false,  message: 'Error deleating chat.'})
        }
    })


    socket.on('disconnect', async () => {
        try {
            console.log(`${socket.id} disconnected`);

            const entries = Object.entries(onlineUsers)

            // send message to all the conencted users that the user is offline
            const removedEntries = entries.filter(item => item[1] == socket.id);
            if (removedEntries[0]) {
                const searchedGroups = await UserGroup.getAllUserGroups(removedEntries[0][0]);
                searchedGroups.forEach(async group => {
                    const groupID = String(group._id)
                    socket.to(groupID).emit('user-offline', { userID: removedEntries[0][0], lastOnline: Date.now() })
                });

                // remove the user from onlineUsers
                const filteredEntries = entries.filter(item => item[1] != socket.id)
                const newOnlineUsers = Object.fromEntries(filteredEntries)
                onlineUsers = newOnlineUsers

                // update the last online status
                await LastOnlineUser.updateOne(
                    { userID: removedEntries[0][0] },
                    { lastOnline: Date.now() }
                );
            }
        } catch (e) {
            console.log("error 'disconnect': ", e.message)
        }

    });

    // socket.onAny((eventName, ...args) => {
    //     console.log(eventName);
    // });



});

app.get('/', (req, res) => {
    res.send('Backend working...');
});

app.post('/findByQuery', async (req, res) => {
    const query = req.body.query;
    const response = await User.findByQuery(query);
    res.send(response);
});

app.post('/findAllGroups', async (req, res) => {
    const response = await UserGroup.getAllUserGroups(req.body.userID);
    res.send(response);
});

app.get('/get-all-rooms', (req, res) => {
    const activeRooms = Array.from(io.sockets.adapter.rooms.keys());
    res.json({ rooms: activeRooms });
});

app.get('/get-online-users', (req, res) => {
    res.json({ onlineUsers });
});

app.post('/get-messages-of-group', async (req, res) => {
    const response = await Message.getMessagesOfChat(req.body.chatID)
    res.send(response);
});

app.get('/test', (req, res) => {
    res.send({res: true})
})

server.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
