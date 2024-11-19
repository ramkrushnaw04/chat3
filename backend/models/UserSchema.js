

const { Schema, model, default: mongoose } = require('mongoose')

const userSchema = Schema({
    firstName: String,
    lastName: String,
    authID: String,
    email: String,
    profile: {
        type: String,
        default: ''
    }
})


userSchema.statics.findByQuery = async function (query) {
    const regexQuery = new RegExp(query, 'i'); 

    const results = await this.find({
        $or: [
            { firstName: regexQuery },
            { lastName: regexQuery },
            { email: regexQuery }
        ]
    });

    return results;
}







module.exports = userSchema