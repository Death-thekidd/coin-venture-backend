const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models");
const User = db.user;
const Role = db.role;

const verifyToken = async (req, res, next) => {
	let token = req.session.token;

	if (!token) {
		return res.status(403).send({ message: "No token provided!" });
	}

	try {
		const decoded = jwt.verify(token, config.secret);
		req.userId = decoded.id;
		next();
	} catch (err) {
		return res.status(401).send({ message: "Unauthorized!" });
	}
};

const isAdmin = async (req, res, next) => {
	try {
		const user = await User.findById(req.userId).exec();
		const roles = await Role.find({ _id: { $in: user.roles } }).exec();

		if (roles.some((role) => role.name === "admin")) {
			next();
			return;
		}

		res.status(403).send({ message: "Require Admin Role!" });
	} catch (err) {
		res.status(500).send({ message: err });
	}
};

const isModerator = async (req, res, next) => {
	try {
		const user = await User.findById(req.userId).exec();
		const roles = await Role.find({ _id: { $in: user.roles } }).exec();

		if (roles.some((role) => role.name === "moderator")) {
			next();
			return;
		}

		res.status(403).send({ message: "Require Moderator Role!" });
	} catch (err) {
		res.status(500).send({ message: err });
	}
};

const authJwt = {
	verifyToken,
	isAdmin,
	isModerator,
};

module.exports = authJwt;
