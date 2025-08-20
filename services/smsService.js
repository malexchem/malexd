const africastalking = require('africastalking')({
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME
});

const sms = africastalking.SMS;

async function sendOTP(phoneNumber, otp) {
    try {
        const result = await sms.send({
            to: phoneNumber,
            message: `Your verification code is ${otp}`,
            from: '' 
        });
        console.log(result);
    } catch (error) {
        console.error("Error sending SMS:", error);
    }
}

module.exports = { sendOTP };
