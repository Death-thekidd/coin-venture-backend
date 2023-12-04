const mongoose = require("mongoose");

const Plan = mongoose.model(
	"Plan",
	new mongoose.Schema({
		id: String,
		name: String,
		rate: String,
		min: String,
		max: String,
		interval: String,
		duration: Number,
	})
);

module.exports = Plan;
