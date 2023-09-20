const nodemailer = require("nodemailer");

const dotenv = require("dotenv");

dotenv.config();

const createTransporter = async () => {
	const transporter = nodemailer.createTransport({
		host: "smtp-relay.sendinblue.com",
		port: 465,
		auth: {
			user: process.env.SENDER_EMAIL,
			pass: process.env.SENDER_PASS,
		},
	});

	return transporter;
};

async function sendMail(to, subject, text) {
	let mailOptions = {
		from: process.env.SENDER_EMAIL, // sender address
		to: to, // list of receivers
		subject: subject, // Subject line
		text: text, // plain text body
	};

	console.log(mailOptions);

	try {
		// Get response from the createTransport
		let emailTransporter = await createTransporter();

		// Send email
		await new Promise((resolve, reject) => {
			emailTransporter.sendMail(mailOptions, function (error, info) {
				if (error) {
					// failed block
					console.log(error);
					reject(error);
				} else {
					// Success block
					console.log("Email sent: " + info.response);
					resolve(info);
				}
			});
		});
	} catch (error) {
		return console.log(error);
	}
}

module.exports = sendMail;
