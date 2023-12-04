const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");

const sendEmail = require("./app/sendMail");

const app = express();

app.use(cors());

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.use(
	cookieSession({
		name: "detroinin-session",
		secret: "COOKIE_SECRET", // should use as secret environment variable
		httpOnly: true,
	})
);

const db = require("./app/models");
const sendMail = require("./app/sendMail");
const Role = db.role;
const Wallet = db.wallet;
const Plan = db.plan;
const userWallet = db.userWallet;

db.mongoose
	.connect(
		`mongodb+srv://deaththekidd:Pendejos001@cluster0.xu0vgz8.mongodb.net/CoinVenture`,
		{
			useNewUrlParser: true,
			useUnifiedTopology: true,
		}
	)
	.then(() => {
		console.log("Successfully connect to MongoDB.");
		initial();
		walletAdd();
		planAdd();
	})
	.catch((err) => {
		console.error("Connection error", err);
		process.exit();
	});

async function initial() {
	try {
		const count = await Role.estimatedDocumentCount();

		if (count === 0) {
			try {
				await new Role({ name: "user" }).save();
				console.log("added 'user' to roles collection");

				await new Role({ name: "moderator" }).save();
				console.log("added 'moderator' to roles collection");

				await new Role({ name: "admin" }).save();
				console.log("added 'admin' to roles collection");
			} catch (err) {
				console.log("error", err);
			}
		}
	} catch (err) {
		console.error("Error estimating document count:", err);
	}
}

async function walletAdd() {
	const walletArray = [
		{
			address: "bc1qeclky6zl4sg2ceklusxsex3ww5us0hasjvf8lh",
			name: "Bitcoin",
		},
		{
			address: "0xF77773dA8e165a62e8DF8833Dd2865c2Ac0f7058",
			name: "Ethereum",
		},
		{
			address: "TUXEq2VMA",
			name: "Usdt Trc20",
		},
		{
			address: "ltc1qv0gx64jkvtnf873uvxuzmt707ylcwdjx320798",
			name: "Litecoin",
		},
		{
			address: "P1107468462",
			name: "Payeer",
		},
	];
	try {
		walletArray.map(async (wallet, index) => {
			const { address, name } = wallet;
			const existingWallet = await Wallet.findOne({ name });
			if (!existingWallet) {
				await new Wallet(wallet).save();
				console.log(`added ${name} to wallets collection`);
				return;
			}

			existingWallet.address = address;
			existingWallet.save();
			console.log(`updated wallets`);
			return;
		});
	} catch (err) {
		console.log("error", err);
	}
}
async function planAdd() {
	const planArray = [
		{
			id: "starter",
			name: "STARTING PLAN",
			rate: "7",
			min: "50",
			max: "499",
			duration: 1,
			interval: "24 HOURS",
		},
		{
			id: "premium",
			name: "PREMIUM PLAN",
			rate: "10",
			min: "500",
			max: "999",
			duration: 0.5,
			interval: "10 HOURS",
		},
		{
			id: "pro",
			name: "PROFESSIONAL PLAN",
			rate: "15",
			min: "1,000",
			max: "5,000",
			duration: 2,
			interval: "2 DAYS",
		},
		{
			id: "vip",
			name: "VIP PLAN",
			rate: "20",
			min: "4999",
			max: "♾️",
			duration: 3,
			interval: "3 DAYS",
		},
		{
			id: "blackd",
			name: "Black Diamond PLAN",
			rate: "50",
			min: "5000",
			max: "100000",
			duration: 30,
			interval: "30 DAYS",
		},
	];
	try {
		planArray.map(async (plan, index) => {
			const { name } = plan;
			const existingPlan = await Plan.findOne({ name });
			if (!existingPlan) {
				await new Plan(plan).save();
				console.log(`added ${name} to plans collection`);
			}
		});
	} catch (err) {
		console.log("error", err);
	}
}

// simple route
app.get("/", (req, res) => {
	res.json({ message: "Welcome to Coin venture application." });
});

// routes
require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}.`);
});

sendMail(
	"ohiemidivine8@gmail.com",
	"DEPOSIT APPROVED",
	`Your deposit of $200 has been approved by our admins`
);
