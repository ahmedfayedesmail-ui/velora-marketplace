module.exports = async function handler(req, res) {
  res.status(200).json({
    enabled: !!process.env.VAPID_PRIVATE_KEY,
    publicKey: 'BK0OWJTIQ3L62VXZUkoVCyrZkhBSTuajYcusoOcckLId7poLrHYE129EHGh9Kdrb62jrXlCx0rOKtLJv405mfCU'
  });
};
