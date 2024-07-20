const jwt = require('jsonwebtoken');

function decodeJwt(token) {
    try {
        const decoded = jwt.verify(token, 'ifsp');
        console.log('Decoded JWT:', decoded);
        return decoded._id;
    } catch (error) {
        console.error('Failed to decrypt JWT:', error);
        return null;
    }
}




module.exports = decodeJwt;