const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;
const sendMail = require("../sendMail");

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

const dotenv = require("dotenv");

dotenv.config();

exports.signup = async (req, res) => {
	try {
		const {
			fullname,
			username,
			password,
			roles,
			email,
			referralCode,
			address,
		} = req.body;
		const user = new User({
			fullname: fullname,
			username: username,
			email: email,
			password: bcrypt.hashSync(password, 8),
			isAdmin: roles.includes("admin"),
			deposits: [],
			withdrawals: [],
			earnings: [],
			referrals: [],
			referralCode: username,
			balance: 0,
			activeDeposit: 0,
			totalDeposits: 0,
			totalEarnings: 0,
			wallets: [
				{
					name: "PerfectMoney",
					address: address.perfectMoney,
					available: 0,
					pending: 0,
				},
				{
					name: "Payeer",
					address: address.payeer,
					available: 0,
					pending: 0,
				},
				{
					name: "Bitcoin",
					address: address.bitcoin,
					available: 0,
					pending: 0,
				},
				{
					name: "Litecoin",
					address: address.litecoin,
					available: 0,
					pending: 0,
				},
				{
					name: "Ethereum",
					address: address.ethereum,
					available: 0,
					pending: 0,
				},
			],
		});

		const savedUser = await user.save();
		if (referralCode) {
			const referrer = await User.findOne({ referralCode });
			if (referrer) {
				referrer.referrals.push(user._id);
				console.log(sendMail);
				sendMail(
					referrer.email,
					"REFERRAL SUCCESSFUL",
					`Hi, You successfully referred ${savedUser.username}`
				);
				await referrer.save();
			}
		}
		console.log(sendMail);
		sendMail(
			savedUser.email,
			"Registration Successful",
			`Hello ${savedUser.username}, \n\nThank you for registering on our platform. \n\nYour login information: \n\nUsername: ${savedUser.username}  \n\nPassword: ${password} \n\nYou can login here: https://coinventure.live/login \n\nContact us immediately if you did not authorize this registration. \n\nRegards, \nCoinDash Team`
		);
		sendMail(
			"coinventure0@gmail.com",
			"FIRMCOIN NEW REGISTRATION",
			`A new user just registered \nusername: ${username} \nemail: ${email}`
		);

		if (req.body.roles) {
			const roles = await Role.find({ name: { $in: req.body.roles } });
			savedUser.roles = roles.map((role) => role._id);
		} else {
			const role = await Role.findOne({ name: "user" });
			savedUser.roles = [role._id];
		}

		await savedUser.save();
		res.send({ message: "User was registered successfully!" });
	} catch (error) {
		res.status(500).send({ message: error });
	}
};

exports.signin = async (req, res) => {
	try {
		const user = await User.findOne({ username: req.body.username })
			.populate("roles", "-__v")
			.exec();

		if (!user) {
			return res.status(404).send({ message: "User Not found." });
		}

		const passwordIsValid = bcrypt.compareSync(
			req.body.password,
			user.password
		);

		if (!passwordIsValid) {
			return res.status(401).send({ message: "Invalid Password!" });
		}

		const token = jwt.sign({ id: user.id }, config.secret, {
			expiresIn: 86400, // 24 hours
		});

		const authorities = user.roles.map(
			(role) => "ROLE_" + role.name.toUpperCase()
		);

		req.session.token = token;

		res.status(200).send({
			id: user._id,
			fullname: user.fullname,
			username: user.username,
			email: user.email,
			isAdmin: user.isAdmin,
			deposits: user.deposits,
			balance: user.balance,
			roles: authorities,
			earnings: user.earnings,
			withdrawals: user.withdrawals,
			activeDeposit: user.activeDeposit,
			totalDeposits: user.totalDeposits,
			totalEarnings: user.totalEarnings,
			referrals: user.referrals,
			referralCode: user.referralCode,
			wallets: user.wallets,
		});
	} catch (error) {
		res.status(500).send({ message: error });
	}
};

exports.signout = async (req, res) => {
	try {
		req.session = null;
		return res.status(200).send({ message: "You've been signed out!" });
	} catch (err) {
		this.next(err);
	}
};
