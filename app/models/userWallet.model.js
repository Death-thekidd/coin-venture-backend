const mongoose = require("mongoose");

const UserWallet = mongoose.model(
	"UserWallet",
	new mongoose.Schema({
		name: String,
		address: String,
		available: Number,
		pending: Number,
	})
);

module.exports = UserWallet;
