
const jwt = require('jsonwebtoken')
const {connection} = require('../util/connect')

exports.signup = (req,res) => {
    var shop_name = req.body.shop_name;
    var shop_owner = req.body.shop_owner;
    var shop_contact = req.body.shop_contact;
    var shop_location = req.body.shop_location;
    var shop_longitude = req.body.shop_longitude;
    var shop_latitude = req.body.shop_latitude;
    var shop_timing = req.body.shop_timing;
    var shop_upiId = req.body.upiId;
    var shop_email = req.body.shop_email;
    var shop_password = req.body.shop_password;
    var shop_image = req.body.shop_image || "https://firebasestorage.googleapis.com/v0/b/grocy-9ba9a.appspot.com/o/shop_sample.jpg?alt=media&token=7a00d104-86dc-4489-b515-bc1a5922f19f"

    const CHECK_OWNER = `SELECT * FROM shop WHERE shop_email='${shop_email}'`

    const INSERT_SHOP = `INSERT INTO shop (shop_name,shop_owner,shop_contact,shop_location,shop_longitude,shop_latitude,shop_timing,shop_upiId,shop_email,shop_password,shop_image) VALUES('${shop_name}','${shop_owner}',${shop_contact},'${shop_location}',${shop_longitude},${shop_latitude},'${shop_timing}','${shop_upiId}','${shop_email}','${shop_password}','${shop_image}')`

    connection.query(CHECK_OWNER,(err,result) => {
        if(err){
            return res.json(err)
        } else {
            if(result.length>0){
                return res.json({error : 'Account already Exists ! Please Login'})
            } else {
                connection.query(INSERT_SHOP,(err,result) => {
                    if(err){
                        return res.json(err)
                    } else {
                        var shop_id = result.insertId
                        const shop = {
                            shop_id,
                            shop_email,
                            shop_name,
                            shop_owner,
                            shop_contact,
                            shop_location,
                            shop_longitude,
                            shop_latitude,
                            shop_timing,
                            shop_upiId,
                            shop_image
                        }
                        console.log(shop)
                        const token = jwt.sign(shop,process.env.ACCESS_TOKEN_SECRET)
                        return res.json({token : token})
                    }
                })
            }
        }
    })
}

exports.login = (req,res) => {
    var email = req.body.email;
    var password = req.body.password;

    const CHECK_OWNER = `SELECT * FROM shop WHERE shop_email='${email}'`

    const CHECK_LOGIN = `SELECT * FROM shop WHERE shop_email='${email}' AND shop_password='${password}'`

    connection.query(CHECK_OWNER,(err,result) => {
        if(err){
            return res.json(err)
        } else {
            if(result.length > 0){
                connection.query(CHECK_LOGIN,(err,result) => {
                    if(err){
                        console.log(err)
                    } else {
                        if(result.length > 0){
                            //console.log(result[0])
                            var shop_id = result[0].shop_id;
                            var shop_email = result[0].shop_email;
                            var shop_name = result[0].shop_name;
                            var shop_owner = result[0].shop_owner;
                            var shop_contact = result[0].shop_contact;
                            var shop_location = result[0].shop_location;
                            var shop_longitude = result[0].shop_longitude;
                            var shop_latitude = result[0].shop_latitude;
                            var shop_timing = result[0].shop_timing;
                            var shop_upiId = result[0].shop_upiId;
                            var shop_image = result[0].shop_image;
                            const shop = {
                                shop_id,
                                shop_email,
                                shop_name,
                                shop_owner,
                                shop_contact,
                                shop_location,
                                shop_longitude,
                                shop_latitude,
                                shop_timing,
                                shop_upiId,
                                shop_image
                            }
                            const token = jwt.sign(shop,process.env.ACCESS_TOKEN_SECRET)
                            return res.json({token : token})
                        } else {
                            return res.json({error : 'Incorrect Password ! Try Again'})
                        }
                    }
                })
            } else {
                return res.json({error : 'Account does not Exist ! Signup First'})
            }
        }
    })
}