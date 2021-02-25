/*
indexStartRawData = -1 // it doesn't matter what value is
                       // set here - it will be set now:

if bytesRaw.length <= 125
    bytesFormatted[1] = bytesRaw.length

    indexStartRawData = 2

else if bytesRaw.length >= 126 and bytesRaw.length <= 65535
    bytesFormatted[1] = 126
    bytesFormatted[2] = ( bytesRaw.length >> 8 ) AND 255
    bytesFormatted[3] = ( bytesRaw.length      ) AND 255

    indexStartRawData = 4

else
    bytesFormatted[1] = 127
    bytesFormatted[2] = ( bytesRaw.length >> 56 ) AND 255
    bytesFormatted[3] = ( bytesRaw.length >> 48 ) AND 255
    bytesFormatted[4] = ( bytesRaw.length >> 40 ) AND 255
    bytesFormatted[5] = ( bytesRaw.length >> 32 ) AND 255
    bytesFormatted[6] = ( bytesRaw.length >> 24 ) AND 255
    bytesFormatted[7] = ( bytesRaw.length >> 16 ) AND 255
    bytesFormatted[8] = ( bytesRaw.length >>  8 ) AND 255
    bytesFormatted[9] = ( bytesRaw.length       ) AND 255

    indexStartRawData = 10

// put raw data at the correct index
bytesFormatted.put(bytesRaw, indexStartRawData)


// now send bytesFormatted (e.g. write it to the socket stream)

}
 */

const createBuffer = (obj) => {
	const data = JSON.stringify(obj);
	const dataLen = data.length;

	const startBuf = getInitialByteBuffer(dataLen);
	const lenBuf = getLengthBuffer(dataLen);
	const dataBuf = Buffer.from(data);

	const totalLen = startBuf.length + lenBuf.length + dataLen
	const buffer = Buffer.concat([startBuf, lenBuf, dataBuf], totalLen);

	return buffer;
}


const getInitialByteBuffer = (len) => {
	if (len < Math.pow(2, 16))
		return Buffer.from([129]);
	else
		return Buffer.from([1]);
}


const getLengthBuffer = (len) => {
	if (len <= 125)
		return Buffer.from([len]);
	else if (len < Math.pow(2, 16)) {
		const buf = Buffer.alloc(3);
		buf[0] = 126;
		buf[1] = ((len >> 8) & 255);
		buf[2] = (len) & 255;
		return buf;
	} else
		return Buffer.from([127, len]);
}


const extractSendingData = (buffer) => {
	if (buffer[0] === 129 || buffer[0] === 1) {
		// console.log("Buffer received :: ", buffer);
		const length = buffer[1];
		const decodedData = createArray(buffer, 2, length);

		let data = '';
		for (i = 0; i < length; ++i)
			data += String.fromCharCode(decodedData[i]);

		return data;
	}
	return null;
}


const extractData = (buffer) => {
	if (buffer[0] === 129 || buffer[0] === 1) {
		// console.log("Buffer received :: ", buffer);
		const length = getLength(buffer);
		const maskKey = getMaskingKey(buffer, length);
		const maskedData = getMaskedData(buffer, length);
		const decodedData = XOR(maskedData, maskKey, length);

		let data = '';
		for (i = 0; i < length; ++i)
			data += String.fromCharCode(decodedData[i]);

		return data;
	}
	return null;
}


const getLength = (buffer) => {
	length = buffer[1] - 0x80; //0x80 == 128
	if (length <= 125)
		return length;
	else if (length === 126) {
		return parseInt(buffer.toString('hex', 2, 4), 16);
	} else
		return parseInt(buffer.toString('hex', 2, 8), 16);
};


const getMaskingKey = (buffer, length) => {
	if (length <= 125)
		return createArray(buffer, 2, 4);
	else if (length < Math.pow(2, 16))
		/**
		 * Read the next 16 bits
		 */
		return createArray(buffer, 4, 4);
	else
		/**
		 * Read the next 64 bits(16 + 48)
		 */
		return createArray(buffer, 10, 4);
};


const getMaskedData = (buffer, length) => {
	if (length <= 125)
		return createArray(buffer, 6, length);
	else if (length < Math.pow(2, 16))
		return createArray(buffer, 8, length);
	else
		return createArray(buffer, 14, length);
};


const createArray = (buffer, pos, times) => {
	return buffer.slice(pos, pos + times);
};


const XOR = (maskedData, maskKey, length) => {
	const decoded = [];
	for (let i = 0; i < length; ++i)
		decoded[i] = maskedData[i] ^ maskKey[i % 4];
	return decoded;
};


module.exports = {
	createBuffer,
	extractData,
	extractSendingData
};