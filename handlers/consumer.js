require('dotenv').config()
const jwt = require('jsonwebtoken')
const {connection} = require('../util/connect')

exports.consumerSignup = (req,res) => {
    var consumer_email = req.body.consumer_email;
    var consumer_password = req.body.consumer_password;
    var consumer_contact = req.body.consumer_contact;
    var consumer_address = req.body.consumer_address;
    var consumer_name = req.body.consumer_name;
    var consumer_image = req.body.consumer_image || 'https://firebasestorage.googleapis.com/v0/b/grocy-9ba9a.appspot.com/o/user_sample.jpg?alt=media&token=84b86aef-1b18-438a-bce5-f7a2a752cbbd'

    const CHECK_CONSUMER = `SELECT * FROM consumer WHERE consumer_email='${consumer_email}'`

    const INSERT_CONSUMER = `INSERT INTO consumer (consumer_email,consumer_password,consumer_contact,consumer_address,consumer_name) VALUES('${consumer_email}','${consumer_password}','${consumer_contact}','${consumer_address}','${consumer_name}')`

    connection.query(CHECK_CONSUMER,(err,result) => {
        if(err) {
            return res.json(err)
        } else {
            if(result.length>0){
                return res.json({error : 'Account already Exists ! Please Login'})
            } else {
                connection.query(INSERT_CONSUMER,(err,result) => {
                    if(err){
                        return res.json(err)
                    } else {
                        var consumer_id = result.insertId
                        const consumer = {
                            consumer_id,
                            consumer_name,
                            consumer_contact,
                            consumer_email,
                            consumer_address,
                            consumer_image
                        }
                        console.log(consumer)
                        const token = jwt.sign(consumer,process.env.ACCESS_TOKEN_SECRET)
                        return res.json({token : token})
                    }
                })
            }
        }
    })
}

exports.consumerLogin = (req,res) => {
    console.log(req.body)
    var consumer_email = req.body.consumer_email
    var consumer_password = req.body.consumer_password

    const CHECK_CONSUMER = `SELECT * FROM consumer WHERE consumer_email='${consumer_email}'`

    const GET_CONSUMER = `SELECT * FROM consumer WHERE consumer_email='${consumer_email}' AND consumer_password='${consumer_password}'`

    connection.query(CHECK_CONSUMER,(err,result) => {
        if(err){
            return res.json(err)
        } else {
            if(result.length > 0){
                connection.query(GET_CONSUMER,(err,result) => {
                    if(result.length>0){
                        var consumer_id = result[0].consumer_id
                        var consumer_email = result[0].consumer_email
                        var consumer_name = result[0].consumer_name
                        var consumer_address = result[0].consumer_address
                        var consumer_contact = result[0].consumer_contact
                        var consumer_image = result[0].consumer_image
                        const consumer = {
                            consumer_id,
                            consumer_name,
                            consumer_contact,
                            consumer_email,
                            consumer_address,
                            consumer_image
                        }

                        console.log(consumer)
                        const token = jwt.sign(consumer,process.env.ACCESS_TOKEN_SECRET)
                        return res.json({token : token})
                        
                    } else {
                        return res.json({error : 'Incorrect Password ! Try Again'})
                    }
                })
            } else {
                return res.json({error : 'Account does not Exist ! Signup'})
            }
        }
    })
}

exports.getShops = (req,res) => {
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;

    const GET_SHOPS = `Select shop_id,shop_name,shop_owner,shop_location,shop_email,shop_image,shop_contact,shop_timing,acos(sin(radians(${latitude}))*sin(radians(shop_latitude)) + cos(radians(${latitude}))*cos(radians(shop_latitude))*cos(radians(shop_longitude)-radians(${longitude}))) * 6378 As D From test_schema.shop Where acos(sin(radians(${latitude}))*sin(radians(shop_latitude)) + cos(radians(${latitude}))*cos(radians(shop_latitude))*cos(radians(shop_longitude)-radians(${longitude}))) * 6378 <= 15`

    connection.query(GET_SHOPS,(err,result) => {
        if(err){
            return res.json(err)
        } else {
            if(result.length > 0){
                var n = result.length;
                var shops = []
                for (var i=0;i<n;i++) {
                    shops.push(result[i])
                }
                return res.json(shops)
            } else {
                return res.json([])
            }
        }
    })
}

exports.getProducts = (req,res) => {

    var shop_id = parseInt(req.params.shop_id);

    const GET_PRODUCTS = `SELECT product_id,product_name,product_quantity,product_price,product_type,product_image FROM products WHERE shop_id=${shop_id}`

    connection.query(GET_PRODUCTS,(err,result) => {
        if(err){
            return res.json(err)
        } else {
            if(result.length>0){
                const n = result.length
                var products = []
                for(var i=0;i<n;i++) {
                    products.push(result[i])
                }
                return res.json(products)
            } else {
                return res.json([])
            }
        }
    })
}

exports.addtocart = (req,res) => {
    var product_id = parseInt(req.params.product_id)
    var consumer_id = req.consumer.consumer_id;
    var quantity = 1;
    var cart_id;

    var product = []

    const NEW_CART = `INSERT INTO cart (consumer_id) VALUES(${consumer_id})`

    const CHECK_CART = `SELECT * FROM cart WHERE consumer_id=${consumer_id}`

    const CHECK_IN_CART = `SELECT * FROM cart_items WHERE product_id=${product_id} AND consumer_id=${consumer_id}`

    connection.query(CHECK_CART,(err,result) => {
        if(err){
            return res.json(err)
        } else {
            if(result.length>0){
                cart_id = result[0].cart_id
                var prev_total = result[0].cart_total;
                connection.query(CHECK_IN_CART,(err,result) => {
                    if(result.length>0){
                        //in cart
                        var quantity = result[0].quantity+1
                        var shop_id = result[0].shop_id
                        var product_price = result[0].product_price
                        var total = result[0].total + product_price
                        var cart_item_id = result[0].cart_item_id

                        const cart_item = {
                            product_id,
                            cart_id,
                            consumer_id,
                            shop_id,
                            product_price,
                            quantity,
                            total
                        }

                        const UPDATE_CART_ITEMS = `UPDATE cart_items SET quantity=quantity+1,total=total+${product_price} WHERE cart_item_id=${cart_item_id}`

                        const UPDATE_TOTAL = `UPDATE cart SET cart_total=cart_total+${product_price} WHERE cart_id=${cart_id}`

                        connection.query(UPDATE_CART_ITEMS,(err,result) => {
                            connection.query(UPDATE_TOTAL,(err,result) => {
                                return res.json(cart_item)
                            })
                        })
                    } else {
                        //not in cart
                        const GET_PRODUCT_DETAILS = `SELECT product_id,shop_id,product_name,product_quantity,product_price,product_type,product_image FROM products WHERE product_id=${product_id}`
                        connection.query(GET_PRODUCT_DETAILS,(err,result) => {
                            product.push(result[0])
                            var total = product[0].product_price;
                            const cart_item = {
                                product_id,
                                cart_id,
                                consumer_id,
                                shop_id:product[0].shop_id,
                                product_price:product[0].product_price,
                                quantity,
                                total
                            }
                            const INSERT_ITEM = `INSERT INTO cart_items(product_id,cart_id,consumer_id,shop_id,product_price,quantity,total) VALUES(${cart_item.product_id},${cart_item.cart_id},${cart_item.consumer_id},${cart_item.shop_id},${cart_item.product_price},1,${cart_item.product_price})`

                            const UPDATE_TOTAL = `UPDATE cart SET cart_total=cart_total+${total} WHERE cart_id=${cart_id}`

                            connection.query(INSERT_ITEM,(err,result) => {
                                console.log(err)
                                connection.query(UPDATE_TOTAL,(err,result) => {
                                    //connection.query(REDUCE_QUANTITY)
                                    return res.json(cart_item)
                                })
                            })
                        })
                    }
                })
            } else {
                connection.query(NEW_CART,(err,result) => {
                    if(err){
                        return res.json(err)
                    } else {
                        cart_id = result.insertId;
                        connection.query(CHECK_IN_CART,(err,result) => {
                            if(result.length>0){
                                //in cart
                                //Never a possibility
                            } else {
                                //not in cart
                                const GET_PRODUCT_DETAILS = `SELECT product_id,shop_id,product_name,product_quantity,product_price,product_type,product_image FROM products WHERE product_id=${product_id}`
                                connection.query(GET_PRODUCT_DETAILS,(err,result) => {
                                    product.push(result[0])
                                    var total = product[0].product_price;
                                    const cart_item = {
                                        product_id,
                                        cart_id,
                                        consumer_id,
                                        shop_id:product[0].shop_id,
                                        product_price:product[0].product_price,
                                        quantity,
                                        total,
                                    }
                                    const INSERT_ITEM = `INSERT INTO cart_items(product_id,cart_id,consumer_id,shop_id,product_price,quantity,total) VALUES(${cart_item.product_id},${cart_item.cart_id},${cart_item.consumer_id},${cart_item.shop_id},${cart_item.product_price},${cart_item.quantity},${cart_item.total})`
        
                                    const UPDATE_TOTAL = `UPDATE cart SET cart_total=cart_total+${total} WHERE cart_id=${cart_id}`
        
                                    connection.query(INSERT_ITEM,(err,result) => {
                                        console.log(err)
                                        connection.query(UPDATE_TOTAL,(err,result) => {
                                            //connection.query(REDUCE_QUANTITY)
                                            return res.json(cart_item)
                                        })
                                    })
                                })
                            }
                        })
                    }
                })
            }
        }
    })
}

exports.getShopDetails = (req,res) => {
    var shop_id = req.params.shop_id;
    
    const GET_SHOP_DETAILS = `Select * FROM shop where shop_id=${shop_id}`

    connection.query(GET_SHOP_DETAILS,(err,result) => {
        if(err){
            return res.json(err)
        } else {
            if(result.length>0){
                return res.json(result)
            }
        }
    })
}

exports.subtractFromcart = (req,res) => {
    var product_id = parseInt(req.params.product_id)
    var consumer_id = req.consumer.consumer_id;
    var quantity = 1;
    var cart_id;

    var product = []

    const NEW_CART = `INSERT INTO cart (consumer_id) VALUES(${consumer_id})`

    const CHECK_CART = `SELECT * FROM cart WHERE consumer_id=${consumer_id}`

    const CHECK_IN_CART = `SELECT * FROM cart_items WHERE product_id=${product_id} AND consumer_id=${consumer_id}`

    connection.query(CHECK_CART,(err,result) => {
        if(err){
            return res.json(err)
        } else {
            if(result.length>0){
                cart_id = result[0].cart_id
                var prev_total = result[0].cart_total;
                connection.query(CHECK_IN_CART,(err,result) => {
                    if(result.length>0){
                        //in cart
                        var quantity = result[0].quantity-1
                        var shop_id = result[0].shop_id
                        var product_price = result[0].product_price
                        var total = result[0].total - product_price
                        var cart_item_id = result[0].cart_item_id

                        const cart_item = {
                            product_id,
                            cart_id,
                            consumer_id,
                            shop_id,
                            product_price,
                            quantity,
                            total
                        }

                        const UPDATE_CART_ITEMS = `UPDATE cart_items SET quantity=quantity-1,total=total-${product_price} WHERE cart_item_id=${cart_item_id}`

                        const UPDATE_TOTAL = `UPDATE cart SET cart_total=cart_total-${product_price} WHERE cart_id=${cart_id}`

                        connection.query(UPDATE_CART_ITEMS,(err,result) => {
                            connection.query(UPDATE_TOTAL,(err,result) => {
                                return res.json(cart_item)
                            })
                        })
                    } else {
                        //not in cart
                        const GET_PRODUCT_DETAILS = `SELECT product_id,shop_id,product_name,product_quantity,product_price,product_type,product_image FROM products WHERE product_id=${product_id}`
                        connection.query(GET_PRODUCT_DETAILS,(err,result) => {
                            product.push(result[0])
                            var total = product[0].product_price;
                            const cart_item = {
                                product_id,
                                cart_id,
                                consumer_id,
                                shop_id:product[0].shop_id,
                                product_price:product[0].product_price,
                                quantity,
                                total
                            }
                            const INSERT_ITEM = `INSERT INTO cart_items(product_id,cart_id,consumer_id,shop_id,product_price,quantity,total) VALUES(${cart_item.product_id},${cart_item.cart_id},${cart_item.consumer_id},${cart_item.shop_id},${cart_item.product_price},1,${cart_item.product_price})`

                            const UPDATE_TOTAL = `UPDATE cart SET cart_total=cart_total+${total} WHERE cart_id=${cart_id}`

                            connection.query(INSERT_ITEM,(err,result) => {
                                console.log(err)
                                connection.query(UPDATE_TOTAL,(err,result) => {
                                    //connection.query(REDUCE_QUANTITY)
                                    return res.json(cart_item)
                                })
                            })
                        })
                    }
                })
            } else {
                connection.query(NEW_CART,(err,result) => {
                    if(err){
                        return res.json(err)
                    } else {
                        cart_id = result.insertId;
                        connection.query(CHECK_IN_CART,(err,result) => {
                            if(result.length>0){
                                //in cart
                                //Never a possibility
                            } else {
                                //not in cart
                                const GET_PRODUCT_DETAILS = `SELECT product_id,shop_id,product_name,product_quantity,product_price,product_type,product_image FROM products WHERE product_id=${product_id}`
                                connection.query(GET_PRODUCT_DETAILS,(err,result) => {
                                    product.push(result[0])
                                    var total = product[0].product_price;
                                    const cart_item = {
                                        product_id,
                                        cart_id,
                                        consumer_id,
                                        shop_id:product[0].shop_id,
                                        product_price:product[0].product_price,
                                        quantity,
                                        total,
                                    }
                                    const INSERT_ITEM = `INSERT INTO cart_items(product_id,cart_id,consumer_id,shop_id,product_price,quantity,total) VALUES(${cart_item.product_id},${cart_item.cart_id},${cart_item.consumer_id},${cart_item.shop_id},${cart_item.product_price},${cart_item.quantity},${cart_item.total})`
        
                                    const UPDATE_TOTAL = `UPDATE cart SET cart_total=cart_total+${total} WHERE cart_id=${cart_id}`
        
                                    connection.query(INSERT_ITEM,(err,result) => {
                                        console.log(err)
                                        connection.query(UPDATE_TOTAL,(err,result) => {
                                            //connection.query(REDUCE_QUANTITY)
                                            return res.json(cart_item)
                                        })
                                    })
                                })
                            }
                        })
                    }
                })
            }
        }
    })
}

exports.deleteFromCart = (req,res) => {
    var product_id = req.params.product_id;
    var consumer_id = req.consumer.consumer_id;

    var cart_item = []

    const GET_ITEM = `SELECT * FROM cart_items WHERE consumer_id=${consumer_id} AND product_id=${product_id}`

    connection.query(GET_ITEM,(err,result) => {
        if(err){
            return res.json(err)
        } else {
            if(result.length>0){
                console.log(result)
                var cart_id = result[0].cart_id
                var cart_item_id = result[0].cart_item_id;
                var quantity = result[0].quantity
                var product_price = result[0].product_price
                //var total = result[0].total
                if(quantity===1){
                    
                    const DELETE_ITEM = `DELETE FROM cart_items WHERE cart_item_id=${cart_item_id}`

                    const REDUCE_TOTAL = `UPDATE cart SET cart_total=cart_total-${product_price} WHERE consumer_id=${consumer_id}`

                    connection.query(DELETE_ITEM,(err,result) => {
                        if(err){
                            return res.json(err)
                        } else {
                            connection.query(REDUCE_TOTAL,(err,result) => {
                                return res.json({deleted : 'product removed from cart'})
                            })
                        }
                    })
                } else {

                    const REDUCE_QUANTITY = `UPDATE cart_items SET total=total-${product_price},quantity=quantity-1 WHERE cart_item_id=${cart_item_id}`

                    const REDUCE_TOTAL = `UPDATE cart SET cart_total=cart_total-${product_price} WHERE consumer_id=${consumer_id}`

                    connection.query(REDUCE_QUANTITY,(err,result) => {
                        connection.query(REDUCE_TOTAL,(err,result) => {
                            return res.json({deleted : 'reduced quantity by 1'})
                        })
                    })
                }
            }
        }
    })
}

exports.checkAvalibilty = (req,res) => {
    var consumer_id = req.consumer.consumer_id;
    var products = []
    var order_cart_id;

    const GET_CART_PRODUCTS = `SELECT cart_items.*,products.product_quantity,cart.cart_total,products.product_name,products.product_image FROM test_schema.cart_items 
    inner join products on cart_items.consumer_id=${consumer_id} and cart_items.product_id=products.product_id
    inner join cart on cart.consumer_id=${consumer_id}`

    function getCartProducts() {
        return new Promise(resolve => {
            connection.query(GET_CART_PRODUCTS,(err,result) => {
                if(err){
                    console.log(err)
                } else {
                    var products=[]
                    if(result.length>0){
                        var n = result.length;
                        for(var i=0;i<n;i++){
                            products.push(result[i])
                        }
                    }
                    resolve(products)
                }
            })
        })
    }

    function checkProductAvalibility(products) {
        console.log(products[0].quantity," + product")
        return new Promise((resolve,reject) => {
            for(var i=0;i<products.length;i++){
                if(products[i].quantity>products[i].product_quantity){
                    const reject_details={
                        products:[],
                        message:`Maximum available quantity of ${products[i].product_name} is ${products[i].product_quantity}`,
                        faulty:products[i]
                    }
                    reject(reject_details)
                }
            }
            resolve(products)
        })
    }

    getCartProducts().then((product) => {
        console.log(product)
        var products=[]
        var n = product.length
        for(var i=0;i<n;i++){
            products.push(product[i])
        }
        checkProductAvalibility(products).then((result) => {
            console.log(res,"ks v")
            return res.json({products:result});
            //return res.json(details)
        })
        .catch((err) => {
            console.log(err,'rrrrrrr')
            return res.json(err)
        })
    })
}

exports.makeOrder2 = (req,res) => {
    var payment_mode = req.body.payment_mode;
    var payment_status = req.body.payment_status;
    var consumer_id = req.consumer.consumer_id;
    console.log(payment_mode);
    var products = []
    var order_cart_id;

    const GET_CART_PRODUCTS = `SELECT cart_items.*,products.product_quantity,cart.cart_total,products.product_name,products.product_image FROM test_schema.cart_items 
    inner join products on cart_items.consumer_id=${consumer_id} and cart_items.product_id=products.product_id
    inner join cart on cart.consumer_id=${consumer_id}`

    function getCartProducts() {
        return new Promise(resolve => {
            connection.query(GET_CART_PRODUCTS,(err,result) => {
                if(err){
                    console.log(err)
                } else {
                    var products=[]
                    if(result.length>0){
                        var n = result.length;
                        for(var i=0;i<n;i++){
                            products.push(result[i])
                        }
                    }
                    resolve(products)
                }
            })
        })
    }

    function checkProductAvalibility(products) {
        //console.log(products[0].quantity," + product")
        return new Promise((resolve,reject) => {
            for(var i=0;i<products.length;i++){
                if(products[i].quantity>products[i].product_quantity){
                    const reject_details={
                        products:[],
                        message:`Maximum available quantity of ${products[i].product_name} is ${products[i].product_quantity}`,
                        faulty:products[i]
                    }
                    reject(reject_details)
                }
            }
            resolve(products)
        })
    }

    function insertOrder(products,total) {
        var order_cart_id;
        const INSERT_ORDER = `INSERT INTO order_cart(consumer_id,order_cart_total) VALUES(${consumer_id},${total})`
                //console.log(products,"insert Order")
                connection.query(INSERT_ORDER,(err,result) => {
                    console.log(err)
                    order_cart_id=result.insertId
                    var n = products.length;
                    for(var i=0;i<n;i++){
                        var product = products[i];
                        const INSERT_ORDER_ITEM = `INSERT INTO ordered_items(order_cart_id,product_id,shop_id,product_price,quantity,total,payment_mode,payment_status,delivery_status) VALUES(${order_cart_id},${product.product_id},${product.shop_id},${product.product_price},${product.quantity},${product.total},'online','done','pending')`
                        const UPDATE_PRODUCT_QUANTITY = `Update products set product_quantity=product_quantity-${product.quantity} where product_id=${product.product_id}`
                        connection.query(INSERT_ORDER_ITEM,(err,result) => {
                            console.log(err)
                            if(err){
                                console.error(err)
                            } else {
                                connection.query(UPDATE_PRODUCT_QUANTITY)
                            }
                        })
                    }
                })
                const DELETE_CART_ITEMS = `DELETE FROM cart_items WHERE consumer_id=${consumer_id}`
                const DELETE_CART = `DELETE FROM cart WHERE consumer_id=${consumer_id}`

                connection.query(DELETE_CART_ITEMS,(err,result) => {
                    if(err){
                        console.log(err)
                    } else {
                        connection.query(DELETE_CART,(err,result) => {
                            if(err){
                                console.log(err)
                            } else {
                                const order_details = {
                                    order_cart_id,
                                    products,
                                    total,
                                    payment_mode,
                                    payment_status
                                }
                                return res.json(order_details)
                            }
                        })
                    }
                })
    }

    getCartProducts().then((product) => {
        console.log(product)
        var products=[]
        var n = product.length
        for(var i=0;i<n;i++){
            products.push(product[i])
        }
        checkProductAvalibility(products).then((res) => {
            console.log(res,"ks v")
            insertOrder(res,res[0].cart_total);
            //return res.json(details)
        })
        .catch((err) => {
            console.log(err,'rrrrrrr')
            return res.json(err)
        })
    })
}

exports.makeOrderCod = (req,res) => {
    var payment_mode = req.body.payment_mode;
    var payment_status = req.body.payment_status;
    var consumer_id = req.consumer.consumer_id;
    console.log(payment_mode);
    var products = []
    var order_cart_id;

    const GET_CART_PRODUCTS = `SELECT cart_items.*,products.product_quantity,cart.cart_total,products.product_name,products.product_image FROM test_schema.cart_items 
    inner join products on cart_items.consumer_id=${consumer_id} and cart_items.product_id=products.product_id
    inner join cart on cart.consumer_id=${consumer_id}`

    function getCartProducts() {
        return new Promise(resolve => {
            connection.query(GET_CART_PRODUCTS,(err,result) => {
                if(err){
                    console.log(err)
                } else {
                    var products=[]
                    if(result.length>0){
                        var n = result.length;
                        for(var i=0;i<n;i++){
                            products.push(result[i])
                        }
                    }
                    resolve(products)
                }
            })
        })
    }

    function checkProductAvalibility(products) {
        //console.log(products[0].quantity," + product")
        return new Promise((resolve,reject) => {
            for(var i=0;i<products.length;i++){
                if(products[i].quantity>products[i].product_quantity){
                    const reject_details={
                        products:[],
                        message:`Maximum available quantity of ${products[i].product_name} is ${products[i].product_quantity}`,
                        faulty:products[i]
                    }
                    reject(reject_details)
                }
            }
            resolve(products)
        })
    }

    function insertOrder(products,total) {
        var order_cart_id;
        const INSERT_ORDER = `INSERT INTO order_cart(consumer_id,order_cart_total) VALUES(${consumer_id},${total})`
                //console.log(products,"insert Order")
                connection.query(INSERT_ORDER,(err,result) => {
                    console.log(err)
                    order_cart_id=result.insertId
                    var n = products.length;
                    for(var i=0;i<n;i++){
                        var product = products[i];
                        const INSERT_ORDER_ITEM = `INSERT INTO ordered_items(order_cart_id,product_id,shop_id,product_price,quantity,total,payment_mode,payment_status,delivery_status) VALUES(${order_cart_id},${product.product_id},${product.shop_id},${product.product_price},${product.quantity},${product.total},'cod','pending','pending')`
                        const UPDATE_PRODUCT_QUANTITY = `Update products set product_quantity=product_quantity-${product.quantity} where product_id=${product.product_id}`
                        connection.query(INSERT_ORDER_ITEM,(err,result) => {
                            console.log(err)
                            if(err){
                                console.error(err)
                            } else {
                                connection.query(UPDATE_PRODUCT_QUANTITY)
                            }
                        })
                    }
                })
                const DELETE_CART_ITEMS = `DELETE FROM cart_items WHERE consumer_id=${consumer_id}`
                const DELETE_CART = `DELETE FROM cart WHERE consumer_id=${consumer_id}`

                connection.query(DELETE_CART_ITEMS,(err,result) => {
                    if(err){
                        console.log(err)
                    } else {
                        connection.query(DELETE_CART,(err,result) => {
                            if(err){
                                console.log(err)
                            } else {
                                const order_details = {
                                    order_cart_id,
                                    products,
                                    total,
                                    payment_mode,
                                    payment_status
                                }
                                return res.json(order_details)
                            }
                        })
                    }
                })
    }

    getCartProducts().then((product) => {
        console.log(product)
        var products=[]
        var n = product.length
        for(var i=0;i<n;i++){
            products.push(product[i])
        }
        checkProductAvalibility(products).then((res) => {
            console.log(res,"ks v")
            insertOrder(res,res[0].cart_total);
            //return res.json(details)
        })
        .catch((err) => {
            console.log(err,'rrrrrrr')
            return res.json(err)
        })
    })
}

exports.makeOrder = async(req,res) =>{
    var payment_mode = req.body.payment_mode;
    var payment_status = req.body.payment_status;
    var consumer_id = req.consumer.consumer_id;
    var products = []
    var order_cart_id;
    //var stop = 0;

    const GET_CART_PRODUCTS = `SELECT product_id,shop_id,product_price,quantity,total FROM cart_items WHERE consumer_id=${consumer_id}`

    //const GET_PRODUCT_DETAILS

    connection.query(GET_CART_PRODUCTS,async(err,result) => {
        if(err){
            return res.json(err)
        } else {
            if(result.length>0){
                var n = result.length;
                var stop=0;
                var total=0;
                for(var i=0;i<n;i++){
                    products.push(result[i])
                    total+=parseFloat(result[i].total)
                }
                console.log(total)
                const INSERT_ORDER = `INSERT INTO order_cart(consumer_id,order_cart_total) VALUES(${consumer_id},${total})`
                console.log(products)
                console.log(stop,"Stop");    
                connection.query(INSERT_ORDER,(err,result) => {
                    console.log(err)
                    order_cart_id=result.insertId
                    for(var i=0;i<n;i++){
                        var product = products[i];
                        const INSERT_ORDER_ITEM = `INSERT INTO ordered_items(order_cart_id,product_id,shop_id,product_price,quantity,total,payment_mode,payment_status,delivery_status) VALUES(${order_cart_id},${product.product_id},${product.shop_id},${product.product_price},${product.quantity},${product.total},'${payment_mode}','${payment_status}','pending')`
                        const UPDATE_PRODUCT_QUANTITY = `Update products set product_quantity=product_quantity-${product.quantity} where product_id=${product.product_id}`
                        connection.query(INSERT_ORDER_ITEM,(err,result) => {
                            console.log(err)
                            if(err){
                                console.error(err)
                            } else {
                                connection.query(UPDATE_PRODUCT_QUANTITY)
                            }
                        })
                    }
                })
                const DELETE_CART_ITEMS = `DELETE FROM cart_items WHERE consumer_id=${consumer_id}`
                const DELETE_CART = `DELETE FROM cart WHERE consumer_id=${consumer_id}`

                connection.query(DELETE_CART_ITEMS,(err,result) => {
                    if(err){
                        console.log(err)
                    } else {
                        connection.query(DELETE_CART,(err,result) => {
                            if(err){
                                console.log(err)
                            } else {
                                const order_details = {
                                    order_cart_id,
                                    products,
                                    total
                                }
                                return res.json(order_details)
                            }
                        })
                    }
                })
            } else {
                return res.json({error : 'No Items in Cart'})
            }
        }
    })
}

exports.improveMakeOrder = async(req,res) => {
    var payment_mode = req.body.payment_mode;
    var payment_status = req.body.payment_status;
    var consumer_id = req.consumer.consumer_id;
    var products = []
    var order_cart_id;
    //var stop = 0;

    const GET_CART_PRODUCTS = `SELECT product_id,shop_id,product_price,quantity,total FROM cart_items WHERE consumer_id=${consumer_id}`

    await connection.query(GET_CART_PRODUCTS,async(err,result) => {
        console.log("Here")
        if(err){
            return res.json(err)
        } else {
            var n = result.length;
            var total=0;
            for(var i=0;i<n;i++){
                await products.push(result[i])
                total+=parseFloat(result[i].total)
            }
        }
    })
    console.log(products);
    console.log("Hi")
}

exports.getPreviousOrders = (req,res) => {
    var consumer_id = req.consumer.consumer_id;

    var orders = []

    const GET_ORDERS = `SELECT order_cart_id,order_cart_total,ordered_time FROM order_cart WHERE consumer_id=${consumer_id} ORDER BY order_cart.ordered_time DESC `

    connection.query(GET_ORDERS,(err,result) => {
        if(err){
            return res.json(err)
        } else {
            if(result.length>0){
                console.log("Get ORDERS")
                console.log(result)
                var n = result.length;
                for(var i=0;i<n;i++){
                    orders.push(result[i])
                }
                return res.json(orders)
            } else {
                return res.json({error : 'No Previous Orders'})
            }
        }
    })
}

exports.getPendingOrders = (req,res) => {
    var consumer_id = req.consumer.consumer_id;

    var orders = []

    const GET_ORDERS = `SELECT order_cart.order_cart_id,order_cart.ordered_time,order_cart.consumer_id,order_cart.order_cart_total,ordered_items.payment_status,ordered_items.payment_mode,count(*) as total_items from order_cart 
    join ordered_items on ordered_items.delivery_status="pending" and order_cart.consumer_id=${consumer_id} and order_cart.order_cart_id=ordered_items.order_cart_id
    group by order_cart_id
    order by order_cart.ordered_time desc
     `

    connection.query(GET_ORDERS,(err,result) => {
        if(err){
            return res.json(err)
        } else {
            if(result.length>0){
                console.log("Get ORDERS")
                console.log(result)
                var n = result.length;
                for(var i=0;i<n;i++){
                    orders.push(result[i])
                }
                return res.json(orders)
            } else {
                return res.json([])
            }
        }
    })
}

exports.getOutForDeliveryOrders = (req,res) => {
    var consumer_id = req.consumer.consumer_id;

    var orders = []

    const GET_ORDERS = `SELECT order_cart.order_cart_id,order_cart.ordered_time,order_cart.consumer_id,order_cart.order_cart_total,ordered_items.payment_status,ordered_items.payment_mode,count(*) as total_items from order_cart 
    join ordered_items on ordered_items.delivery_status="Out For Delivery" and order_cart.consumer_id=${consumer_id} and order_cart.order_cart_id=ordered_items.order_cart_id
    group by order_cart_id
    order by order_cart.ordered_time desc
     `

    connection.query(GET_ORDERS,(err,result) => {
        if(err){
            return res.json(err)
        } else {
            if(result.length>0){
                console.log("Get ORDERS")
                console.log(result)
                var n = result.length;
                for(var i=0;i<n;i++){
                    orders.push(result[i])
                }
                return res.json(orders)
            } else {
                return res.json([])
            }
        }
    })
}

exports.getDeliveredOrders = (req,res) => {
    var consumer_id = req.consumer.consumer_id;

    var orders = []

    const GET_ORDERS = `SELECT order_cart.order_cart_id,order_cart.ordered_time,order_cart.consumer_id,order_cart.order_cart_total,ordered_items.payment_status,ordered_items.payment_mode,count(*) as total_items from order_cart 
    join ordered_items on ordered_items.delivery_status="Delivered" and order_cart.consumer_id=${consumer_id} and order_cart.order_cart_id=ordered_items.order_cart_id
    group by order_cart_id
    order by order_cart.ordered_time desc
     `

    connection.query(GET_ORDERS,(err,result) => {
        if(err){
            return res.json(err)
        } else {
            if(result.length>0){
                console.log("Get ORDERS")
                console.log(result)
                var n = result.length;
                for(var i=0;i<n;i++){
                    orders.push(result[i])
                }
                return res.json(orders)
            } else {
                return res.json([])
            }
        }
    })
}

exports.getPreviousOrderDetails = (req,res) => {
    var order_cart_id = req.params.order_cart_id

    var products = []

    const GET_ORDER = `SELECT ordered_items.*,products.product_image,products.product_name,shop.shop_name FROM test_schema.ordered_items
    inner join products on ordered_items.order_cart_id=${order_cart_id} and ordered_items.product_id=products.product_id
    inner join shop where ordered_items.shop_id=shop.shop_id
    `

    connection.query(GET_ORDER,(err,result) => {
        if(err){
            return res.json(err)
        } else {
            if(result.length > 0){
                var n = result.length
                for(var i=0;i<n;i++){
                    products.push(result[i])
                }
                return res.json(products)
            } else {
                return res.json([])
            }
        }
    })
}

exports.getCartItems = (req,res) => {
    var consumer_id = req.consumer.consumer_id;

    var products = [];

    const GET_PRODUCTS = `SELECT cart.cart_id,cart_items.cart_item_id,cart_items.product_id,cart_items.product_price,cart_items.quantity,cart_items.shop_id,cart_items.total,cart.cart_total,shop.shop_contact,shop.shop_name,shop.shop_image,products.product_image,products.product_name FROM test_schema.cart_items 
    inner join cart on cart_items.consumer_id=${consumer_id} and cart.consumer_id=${consumer_id}
    inner join products on products.product_id=cart_items.product_id
    inner join shop on shop.shop_id = cart_items.shop_id`

    connection.query(GET_PRODUCTS,(err,result) => {
        if(err) {
            return res.json([])
        } else {
            if(result.length>0){
                var n = result.length;
                var n = result.length
                for(var i=0;i<n;i++){
                    products.push(result[i])
                }
                return res.json(products)
            } else {
                return res.json([])
            }
        }
    })
}