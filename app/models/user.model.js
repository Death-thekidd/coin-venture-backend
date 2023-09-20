const mongoose = require("mongoose");

const User = mongoose.model(
	"User",

	new mongoose.Schema({
		fullname: String,
		username: String,
		email: String,
		password: String,
		isAdmin: Boolean,
		activeDeposit: Number,
		totalEarnings: Number,
		totalDeposits: Number,
		deposits: [
			{
				amount: Number,
				status: String,
				walletName: String,
				approvedBy: String,
			},
		],
		earnings: [
			{
				amount: Number,
				status: String,
			},
		],
		withdrawals: [
			{
				amount: Number,
				status: String,
				comment: String,
				approvedBy: String,
			},
		],
		balance: Number,
		roles: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Role",
			},
		],
		referralCode: String,
		referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
		wallets: [
			{ name: String, address: String, available: Number, pending: Number },
		],
	})
);

module.exports = User;
