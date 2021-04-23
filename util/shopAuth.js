require('dotenv').config()
const jwt = require('jsonwebtoken')

module.exports = (req,res,next) => {
    let idToken;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        idToken=req.headers.authorization.split('Bearer ')[1];
    } else {
        console.error(err)
        return res.status(403).json({error: 'Unauthorized'})
    }
    jwt.verify(idToken,process.env.ACCESS_TOKEN_SECRET , (err,shop) => {
        if(err) return res.json({error : 'Error while Verifying Token'})
        req.shop = shop
        console.log(shop)
        next()
    })
}