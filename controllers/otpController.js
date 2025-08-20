const { sendOTP } = require('../services/smsService');

// Temporary in-memory storage (use Redis or DB in production)
const otpStore = {};

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.requestOTP = async (req, res) => {
    const { phoneNumber } = req.body;
    const otp = generateOTP();

    otpStore[phoneNumber] = { otp, expires: Date.now() + 5 * 60 * 1000 }; // 5 mins expiry

    await sendOTP(phoneNumber, otp);

    res.json({ success: true, message: "OTP sent" });
};

exports.verifyOTP = (req, res) => {
    const { phoneNumber, otp } = req.body;

    const record = otpStore[phoneNumber];
    if (!record) return res.status(400).json({ success: false, message: "OTP not found" });

    if (Date.now() > record.expires) {
        delete otpStore[phoneNumber];
        return res.status(400).json({ success: false, message: "OTP expired" });
    }

    if (record.otp === otp) {
        delete otpStore[phoneNumber];
        return res.json({ success: true, message: "OTP verified" });
    }

    return res.status(400).json({ success: false, message: "Invalid OTP" });
};
