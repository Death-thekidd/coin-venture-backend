const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");

const sendEmail = require("./app/sendMail");

const app = express();

const whitelist = [process.env.CLIENT_ORIGIN, "http://localhost:8081"];

var corsOptions = {
	origin: function (origin, callback) {
		if (whitelist.indexOf(origin) !== -1) {
			callback(null, true);
		} else {
			callback(new Error("Not allowed by CORS"));
		}
	},
	credentials: true,
};

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
			address: "bc1qf46fs70sqe08ncew53k48ewe7cc9mgr34sxj2p",
			name: "Bitcoin",
		},
		{
			address: "0x6236CeAbe5595E2fE74484543B857DFb406C0c6d",
			name: "Ethereum",
		},
		{
			address: "TVYK8mSHX1xaA3vhfE2MNAby5WQUUFSF5U",
			name: "Usdt Trc20",
		},
		{
			address: "ltc1qc8qa9umfq4jygcfljmj9ay3h95yk5u9vgftxm0",
			name: "Litecoin",
		},
		{
			address: "P1082665639",
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
			rate: "6",
			min: "50",
			max: "500",
		},
		{
			id: "pro",
			name: "PROFESSIONAL PLAN",
			rate: "10",
			min: "500",
			max: "1000",
		},
		{
			id: "premium",
			name: "PREMIUM PLAN",
			rate: "14",
			min: "1,000",
			max: "5,000",
		},
		{
			id: "vip",
			name: "VIP-TRIL PLAN",
			rate: "30",
			min: "5,000",
			max: "♾️",
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
