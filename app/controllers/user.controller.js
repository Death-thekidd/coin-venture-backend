const User = require("../models/user.model");

exports.allAccess = (req, res) => {
	res.status(200).send("Public Content.");
};

exports.userBoard = async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		if (!user) return res.status(404).json({ error: "User not found" });
		return res
			.status(200)
			.json({ message: "User fetched succesfully", data: user });
	} catch (error) {
		return res.status(500).json({ error });
	}
};

exports.adminBoard = (req, res) => {
	res.status(200).send("Admin Content.");
};

exports.moderatorBoard = (req, res) => {
	res.status(200).send("Moderator Content.");
};
