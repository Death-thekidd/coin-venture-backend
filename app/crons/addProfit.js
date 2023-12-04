const db = require("../models");
const User = db.user;
const Plan = db.plan;

export default async function handler(req, res) {
	try {
		const users = await User.find({});
		const currentDate = new Date();

		users?.forEach(async (user) => {
			await Promise.all(
				user?.deposits?.map(async (deposit) => {
					if (
						deposit?.status === "approved" &&
						deposit?.plan &&
						deposit?.lastProfitDate <= currentDate // Check if last profit date is less than or equal to current date
					) {
						const plan = await Plan.findOne({ id: deposit.plan });

						// Calculate the time difference in milliseconds
						const timeDifference =
							currentDate.getTime() - deposit.createdDate.getTime();

						// Calculate the number of days passed since the deposit was created
						const daysPassed = Math.floor(timeDifference / (1000 * 3600 * 24));

						if (daysPassed >= plan?.interval) {
							console.log("Adding profit for deposit:", deposit._id);
							const profit = (Number(plan?.rate) / 100) * Number(deposit?.amount);
							user.balance += profit;

							user?.wallets?.map((wallet) => {
								if (wallet?.name === deposit?.walletName && wallet?.id === "starter") {
									wallet.available += profit;
								}
							});

							deposit.lastProfitDate = currentDate; // Update last profit date to current date
							await user.save();
						}
					}
				})
			);
		});

		console.log("Yea");
		res.status(200).json({ message: "Job executed" });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ message: "Internal Server Error" });
	}
}
