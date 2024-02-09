const { authJwt } = require("../middlewares");
const controller = require("../controllers/user.controller");
const config = require("../config/auth.config");
const db = require("../models");
const sendMail = require("../sendMail");
const User = db.user;
const Role = db.role;
const Plan = db.plan;
const Wallet = db.wallet;
var bcrypt = require("bcryptjs");

module.exports = function (app) {
	app.use(function (req, res, next) {
		res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
		next();
	});

	app.get("/api/test/all", controller.allAccess);

	app.get("/api/test/user/:id", controller.userBoard);

	app.get(
		"/api/test/mod",
		[authJwt.verifyToken, authJwt.isModerator],
		controller.moderatorBoard
	);

	app.get(
		"/api/test/admin",
		[authJwt.verifyToken, authJwt.isAdmin],
		controller.adminBoard
	);

	app.get("/api/test/users", async (req, res) => {
		const users = await User.find({});
		res.json(users);
	});
	app.post("/api/test/deposit", async (req, res) => {
		const { username, amount, walletName, plan } = req.body;

		const user = await User.findOne({ username });
		if (!user) return res.status(404).json({ message: "User not found" });

		user.wallets.map((wallet, index) => {
			if (wallet.name === walletName) {
				wallet.pending += amount;
			}
		});

		user.deposits.push({
			amount: amount,
			walletName: walletName,
			plan: plan,
			status: "pending",
			lastProfitDate: new Date(),
		});
		await user.save();

		sendMail(
			"coinventure169@gmail.com",
			"NEW DEPOSIT",
			`${username} just saved a deposit of $${amount}. Please review and approve`
		);
		sendMail(
			user.email,
			"DEPOSIT SAVED",
			`Hi, You just saved a new deposit of $${amount} and it is pending admin approval`
		);

		res.json({ message: "Deposit pending admin approval" });
	});

	app.post("/api/test/withdraw", async (req, res) => {
		const { username, amount, walletName } = req.body;

		const user = await User.findOne({ username });
		if (!user) return res.status(404).json({ message: "User not found" });

		user.balance -= amount;
		user.wallets.map((wallet, index) => {
			if (wallet.name === walletName) {
				wallet.balance -= amount;
			}
		});

		user.withdrawals.push({
			amount: amount,
			walletName: walletName,
			status: "pending",
		});
		await user.save();

		sendMail(
			"coinventure169@gmail.com",
			"NEW WITHDRAWAL",
			`${username} just requested a withdrawal of $${amount}. Please review and approve`
		);
		sendMail(
			user.email,
			"WITHDRAWAL SAVED",
			`Hi, You just saved a new withdrawal of $${amount} and it is pending admin approval`
		);

		res.status(201).json({ message: "Withdrawal pending admin approval" });
	});

	app.post("/api/test/cancel-withdrawal", async (req, res) => {
		const { username, userToCancel, withdrawalId } = req.body;

		const admin = await User.findOne({ username });
		if (!admin || !admin.isAdmin)
			return res.status(403).json({ message: "Access denied" });

		const user = await User.findOne({ username: userToCancel });
		if (!user) return res.status(404).json({ message: "User not found" });

		const withdrawal = user.withdrawals.id(withdrawalId);
		if (!withdrawal || withdrawal.status === "cancelled")
			return res.status(400).json({ message: "Invalid withdrawal request" });

		user.balance += withdrawal.amount;
		user.wallets.map((wallet, index) => {
			if (wallet.name === withdrawal.walletName) {
				wallet.balance += withdrawal.amount;
			}
		});
		withdrawal.status = "cancelled";
		withdrawal.approvedBy = admin.username;
		user.lastWithdrawal = withdrawal.amount;
		user.totalWithdrawals = user.withdrawals.reduce(
			(acc, withdrawal) => acc + withdrawal.amount,
			0
		);
		await user.save();
		sendMail(
			user.email,
			"WITHDRAWAL CANCELLED",
			`Your withdrawal of $${withdrawal.amount} has been cancelled by our admins`
		);

		res.status(200).json({ message: "Withdrawal approved" });
	});

	app.post("/api/test/approve-withdrawal", async (req, res) => {
		const { username, userToApprove, withdrawalId } = req.body;
		const admin = await User.findOne({ username });
		if (!admin || !admin.isAdmin)
			return res.status(403).json({ message: "Access denied" });

		const user = await User.findOne({ username: userToApprove });

		const withdrawal = user.withdrawals.id(withdrawalId);
		if (!withdrawal || withdrawal.status !== "pending")
			return res.status(400).json({ message: "Invalid withdrawal request" });

		withdrawal.status = "confirmed";
		withdrawal.approvedBy = admin.username;
		user.lastWithdrawal = withdrawal.amount;
		user.totalWithdrawals = user.withdrawals.reduce(
			(acc, withdrawal) => acc + withdrawal.amount,
			0
		);
		await user.save();
		sendMail(
			user.email,
			"WITHDRAWAL APPROVED",
			`Your withdrawal of $${withdrawal.amount} has been approved by our admins`
		);

		res.status(200).json({ message: "Withdrawal approved" });
	});

	app.post("/api/test/approve-deposit", async (req, res) => {
		const { username, userToApprove, depositId } = req.body;

		const admin = await User.findOne({ username });
		if (!admin || !admin.isAdmin)
			return res.status(403).json({ message: "Access denied" });

		const user = await User.findOne({ username: userToApprove });
		if (!user) return res.status(404).json({ message: "User not found" });

		const deposit = user.deposits.id(depositId);
		if (!deposit || deposit.status !== "pending")
			return res.status(400).json({ message: "Invalid deposit request" });

		user.balance += deposit.amount;
		user.wallets.map((wallet, index) => {
			if (wallet.name === deposit.walletName) {
				wallet.pending -= deposit.amount;
				wallet.balance += deposit.amount;
			}
		});
		user.totalDeposits = user.deleteOne.reduce(
			(acc, deposit) => acc + deposit.amount,
			0
		);
		user.activeDeposit = deposit.amount;
		deposit.status = "approved";
		deposit.approvedBy = admin.username;
		await user.save();
		sendMail(
			user.email,
			"DEPOSIT APPROVED",
			`Your deposit of $${deposit.amount} has been approved by our admins`
		);

		res.json({ message: "Deposit approved" });
	});

	app.post("/api/test/change-balance", async (req, res) => {
		const { username, userToChange, amount, type } = req.body;

		const admin = await User.findOne({ username });
		if (!admin || !admin.isAdmin)
			return res.status(403).json({ message: "Access denied" });

		const user = await User.findOne({ username: userToChange });
		if (!user) return res.status(404).json({ message: "User not found" });

		if (type === "increase") {
			user.balance += amount;
			user.totalEarnings += amount;
		} else {
			user.balance -= amount;
			user.totalEarnings -= amount;
		}
		user.earnings.push({
			amount: type === "increase" ? amount : -amount,
			status: "approved",
		});
		await user.save();

		res.json({ message: `${amount}` });
	});
	app.get("/api/test/plans", async (req, res) => {
		const plans = await Plan.find({});
		res.json(plans);
	});

	app.post("/api/test/change-plan", async (req, res) => {
		const { id, name, rate, min, max } = req.body;
		const existingPlan = await Plan.findOne({ id });
		if (existingPlan) {
			existingPlan.name = name;
			existingPlan.rate = rate;
			existingPlan.min = min;
			existingPlan.max = max;
			await existingPlan.save();
		} else {
			const plan = new Plan({
				id: id,
				name: name,
				rate: rate,
				min: min,
				max: max,
			});
			await plan.save();
		}
		res.json({ message: "Plan Updated Succesfully" });
	});

	app.get("/api/test/wallets", async (req, res) => {
		const wallets = await Wallet.find({});
		res.json(wallets);
	});

	app.post("/api/test/change-wallet", async (req, res) => {
		req.body.map(async (wallet, index) => {
			const _id = wallet["_id"];
			const existingWallet = await Wallet.findOne({ _id });
			if (existingWallet) {
				existingWallet.name = wallet?.name;
				existingWallet.address = wallet?.address;
				await existingWallet.save();
			} else {
				const newWallet = new Wallet({
					name: wallet?.name,
					address: wallet?.address,
				});
				await newWallet.save();
			}
		});
		res.json({ message: "Wallet Updated Succesfully" });
	});

	app.post("/api/test/update-user", async (req, res) => {
		const updatedUserData = req.body;
		if (updatedUserData?.password) {
			updatedUserData.password = bcrypt.hashSync(updatedUserData.password, 8);
		}

		try {
			const updatedUser = await User.findOneAndUpdate(
				{ _id: updatedUserData._id }, // Replace with the appropriate unique identifier
				{ $set: updatedUserData }, // Use $set to update all fields in the user document
				{ new: true } // Set new: true to return the updated user object
			);
			if (!updatedUser) {
				return res.status(404).json({ message: "User not found" });
			}
			return res.status(200).json({ data: updatedUser });
		} catch (error) {
			return res.status(500).json({ message: "Internal Server Error" });
		}
	});

	app.get("/api/test/add-profit", async (req, res) => {
		try {
			const users = await User.find({});
			const currentDate = new Date();

			for (const user of users) {
				for (const deposit of user?.deposits || []) {
					if (
						deposit?.status === "approved" &&
						deposit?.plan &&
						deposit?.lastProfitDate <= currentDate
					) {
						const plan = await Plan.findOne({ id: deposit.plan });

						const timeDifference =
							currentDate.getTime() - deposit.lastProfitDate.getTime();

						const daysPassed = Math.floor(timeDifference / (1000 * 3600 * 24));

						if (daysPassed >= plan?.duration) {
							const profit = (Number(plan?.rate) / 100) * Number(deposit?.amount);
							user.balance += profit;

							user?.wallets?.forEach((wallet) => {
								if (wallet?.name === deposit?.walletName && wallet?.id === "starter") {
									wallet.available += profit;
								}
							});

							deposit.lastProfitDate = currentDate;
						}
					}
				}
				await user.save(); // Save each user separately after processing deposits
			}

			console.log("Yea");
			res.status(200).json({ message: "Job executed" });
		} catch (error) {
			console.log(error);
			return res.status(500).json({ message: "Internal Server Error" });
		}
	});
};
