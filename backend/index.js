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

const messageSchema = require('./models/MessageSchema')
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
const dbURL = process.env.DB_URL;

let onlineUsers = {} // format: userID: socketID

mongoose.connect(dbURL)
    .then(() => console.log('Connected to MongoDB'))
    .catch(error => console.error('Connection error:', error));

io.on('connection', socket => {
    console.log(`${socket.id} connected`);

    socket.on('get-user-info-form-authID', async (data, callback) => {
        const user = await User.find({ authID: data.authID });
        // mark the user as online here
        const userID = String(user[0]._id)
        onlineUsers[userID] = socket.id
        callback(user[0]);
    });

    socket.on('sign-up', async (data, callback) => {
        const user = new User({
            authID: data.user.uid,
            firstName: data.firstName,
            lastName: data.lastName,
            profile: data.profileImage,
            email: data.user.email,
        });
        const lastOnline = new LastOnlineUser({
            userID: user._id,
            lastOnline: Date.now()
        });
        await user.save();
        await lastOnline.save();
        callback(user);
    });

    socket.on('get-users-from-query', async (data, callback) => {
        const { query } = data;
        const searchedUsers = await User.findByQuery(query);
        callback(searchedUsers);
    });

    socket.on('create-chat', async (data, callback) => {
        const members = data.userIDs.map(item => ({ userID: item }));
        const groupChat = new GroupChat({
            name: data.name,
            members,
            // profile: data.profile,
            profile: '',
            type: data.type
        });
        const groupPromises = members.map(user => {
            const userGroup = new UserGroup({
                userID: user.userID,
                groupID: groupChat._id,
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
            if(targetSocket) targetSocket.join(roomName)
        }

        // now send message to this room that this user has joined
        const populatedGroup = await GroupChat.findById(groupChat._id).populate('members.userID');
        io.to(roomName).emit('group-created', populatedGroup)
        callback({ success: true, groupID: groupChat._id });
    });

    socket.on('message', async ({ room, messageData }) => {
        // artificial delay
        setTimeout(async () => {
            // save message to db
            const message = new Message({
                ...messageData,
                status: 'sent',
            });
            await message.save();
            socket.to(room).emit('message', message);
            socket.emit('update-message', { messageID: messageData.ID, status: 'sent', chatID: messageData.chatID, type: 'sent', _id: message._id })
        }, 1000);
    });

    socket.on('messages-read', async ({ chatID, pendingMessagesIDs }) => {
        // we are sending message sent only to the clients (if online) who sent the message
        // because for the other clients this info is useless
        for (const { messageID, readerID, senderID } of pendingMessagesIDs) {
            if (onlineUsers[senderID]) {
                const socketID = String(onlineUsers[senderID]) // send message to senderID socket
                console.log(pendingMessagesIDs)
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
    })

    socket.on('get-all-groupChats', async (data, callback) => {
        const searchedGroups = await UserGroup.getAllUserGroups(data.userID);
        searchedGroups.forEach(async group => {
            // join the user to each chat (room) they are a part of
            const roomName = String(group._id)
            socket.join(roomName);

            // get last online time of the user
            const time = await LastOnlineUser.find({userID: data.userID})
            socket.to(roomName).emit('user-online', { userID: data.userID, lastOnline: time[0].lastOnline })
        });
        callback(searchedGroups);
    });


    socket.on('get-online-users', async (data, callback) => {
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
    });

    socket.on('user-typing', async (data) => {
        socket.to(data.groupID).emit('user-typing', data)
        // console.log('typing...', data)
    })


    socket.on('get-last-online-statuses', async (data, callback) => {
        if (!data.userIDs.length) {
            callback({})
            return
        }
        const lastOnlineStatuses = await LastOnlineUser.getLastOnlineStatus(data.userIDs)
        callback(lastOnlineStatuses)
    })

    socket.on('get-all-messages-of-chat', async ({chatID}, callback) => {
        const messages  = await Message.getMessagesOfChat(chatID)
        callback(messages   )
    })

    socket.on('file-message', async (data, callback) => {
        console.log(data)
        callback({res: true})
    })


    socket.on('disconnect', async () => {
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

server.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
