const { verifySignUp } = require("../middlewares");
const controller = require("../controllers/auth.controller");

const allowedOrigins = [process.env.CLIENT_ORIGIN, "http://localhost:8081"];

module.exports = function (app) {
	app.use(function (req, res, next) {
		const origin = req.headers.origin;
		if (allowedOrigins.includes(origin)) {
			res.header("Access-Control-Allow-Origin", origin);
		}
		res.header(
			"Access-Control-Allow-Headers",
			"Origin, X-Requested-With, Content-Type, Accept"
		);
		next();
	});

	app.post(
		"/api/auth/signup",
		[
			verifySignUp.checkDuplicateUsernameOrEmail,
			verifySignUp.checkRolesExisted,
		],
		(req, res) => {
			controller.signup(req, res);
		}
	);

	app.post("/api/auth/signin", (req, res) => {
		console.log("Signin route hit"); // Add a log statement here
		controller.signin(req, res);
	});

	app.post("/api/auth/signout", controller.signout);
};
