const jwt=require('jsonwebtoken');

const key="himanshu@1234";

function createTokenforUser(user){
    const payload={
        _id: user._id,
        email: user.email,
        role: "doctor"
    }
    const token=jwt.sign(payload, key)
    return token
}

function validateToken(token){
    const payload=jwt.verify(token, key)
    return payload
}

module.exports={
    createTokenforUser,
    validateToken
}