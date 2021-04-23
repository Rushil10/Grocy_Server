require('dotenv').config()
const {connection} = require('../util/connect')


module.exports = async(req,res,next) => {
    var consumer_id = req.consumer.consumer_id;
    var products = []
    var order_cart_id;
    var stop=0;

    const GET_CART_PRODUCTS = `SELECT product_id,shop_id,product_price,quantity,total FROM cart_items WHERE consumer_id=${consumer_id}`

    await connection.query(GET_CART_PRODUCTS,async(err,result) => {
        var n = result.length;
        var total = 0;
        for(var i=0;i<n;i++){
            products.push(result[i])
            total+=parseFloat(result[i].total)
        }
        for(var i=0;i<n;i++) {
            var product = products[i];
            const GET_PRODUCT_DETAILS = `Select * from products where product_id=${product.product_id}`
            await connection.query(GET_PRODUCT_DETAILS,(err,result) => {
                if(err){
                    console.log(err)
                } else {
                    console.log("Not Good ! ",i)
                    var total_quantity = result[0].product_quantity;
                    if(product.quantity>total_quantity){
                        const order_details = {
                            products:[],
                            message:`Max Quantity in Stock for ${result[0].product_name} is ${result[0].product_quantity}`
                        }
                        stop=1
                        console.log("stop",stop)
                        return res.json(order_details);
                    }
                    if(i==n){
                        console.log("Hi ;;;;;")
                        next();
                    }
                }
                //console.log("stop",stop)
            })
        }
        //console.log("stop",stop)
    })
    if(products!=[]){
    console.log("stop",stop)
    }
}