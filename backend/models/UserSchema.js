

const { Schema, model, default: mongoose } = require('mongoose')

const userSchema = Schema({
    authId: String,
})



const User = model('User', userSchema) // always make sure that model is creted after the static or method functions

module.exports = userSchema