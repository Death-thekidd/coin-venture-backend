const Sib = require("sib-api-v3-sdk");

require("dotenv").config();

const client = Sib.ApiClient.instance;

const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.SIB_API_KEY;

const transEmailApi = new Sib.TransactionalEmailsApi();

const sender = {
	email: process.env.SENDER_EMAIL,
	name: "support",
};

async function sendTransacEmail({ to, subject, textContent }) {
	const mailOptions = {
		sender,
		to,
		subject,
		textContent,
	};

	try {
		transEmailApi.sendTransacEmail(mailOptions);
	} catch (err) {
		console.log(err);
	}
}

module.exports = { sendTransacEmail };
