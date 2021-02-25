const crypto = require('crypto');


const getSHA1Hex = (...keys) => {
	const hash = crypto.createHash('sha1');
	hash.update("");
	keys.forEach((key) => {
		hash.update(key);
	})
	const keyHash = hash.digest('base64');
	return keyHash;
};


const randomHash = () => {
	return crypto.randomBytes(16).toString('hex');
}


module.exports = {
	getSHA1Hex,
	randomHash
}