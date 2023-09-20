const mongoose = require("mongoose");

const Wallet = mongoose.model(
	"Wallet",
	new mongoose.Schema({
		name: String,
		address: String,
	})
);

module.exports = Wallet;
