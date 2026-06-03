async function sendEmail({ to, subject, text }) {
  if (!to || !subject || !text) {
    throw new Error("Email recipient, subject, and text are required.");
  }

  const otpMatch = text.match(/\b\d{6}\b/);

  console.log("\n================ BUY&SELL LOCAL EMAIL ================");
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(text);
  if (otpMatch) {
    console.log(`OTP CODE: ${otpMatch[0]}`);
  }
  console.log("======================================================\n");
}

module.exports = { sendEmail };
