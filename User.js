const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    userStatus: { type: String, default: "active" },
    coins: { type: Number, default: 0 },

    // to do list
    list1: { type: String, default: "empty" },
    list2: { type: String, default: "empty" },
    list3: { type: String, default: "empty" },
    list4: { type: String, default: "empty" },
    list5: { type: String, default: "empty" },
});

module.exports = mongoose.model("User", userSchema);