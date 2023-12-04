const nodemailer = require("nodemailer");

const dotenv = require("dotenv");

dotenv.config();

const Sib = require("sib-api-v3-sdk");

require("dotenv").config();

const client = Sib.ApiClient.instance;

const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.SIB_API_KEY;
console.log(process.env.SIB_API_KEY);
const tranEmailApi = new Sib.TransactionalEmailsApi();

async function sendMail(receivers, subject, text) {
	const sender = {
		email: process.env.SENDER_EMAIL,
		name: "Coin Venture Support",
	};
	let mailOptions = {
		sender, // sender address
		to: [{ email: receivers }], // list of receivers
		subject: subject, // Subject line
		textContent: text, // plain text body
	};

	try {
		tranEmailApi
			.sendTransacEmail(mailOptions)
			.then(() => {
				console.log("Email sent:");
			})
			.catch((error) => {
				console.log(error);
			});
	} catch (error) {
		return console.log(error);
	}
}

module.exports = sendMail;
