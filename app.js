const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path')
const app = express();
app.use(express.static('views'));
const PORT = process.env.PORT || 5000; //Hanna
//const PORT = process.env.PORT || 3000; //Karolina

mongoose.connect('mongodb://127.0.0.1/sklep', { useNewUrlParser: true, useUnifiedTopology: true });
//mongoose.connect('mongodb://localhost/sklep', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

const Product = mongoose.model('Product', {
  name: String,
  description: String,
  price: Number,
});

const User = mongoose.model('User', {
  username: String,
  password: String,
})

const Order = mongoose.model('Order',{
  username: String,
  productName: String,
  productPrice: Number
})

const CartItem = mongoose.model('CartItem',{
  name: String,
  price: Number
})

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


//Views
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'))
});

app.get('/anon', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/anon.html'))
});

app.get('/sign-in', async (req, res) => {
  res.sendFile(path.join(__dirname, '/views/sign-in.html'))
})

app.get('/sign-in-admin', async (req, res) => {
  res.sendFile(path.join(__dirname, '/views/sign-in-admin.html'))
})

app.get('/admin', async (req, res) => {
  res.sendFile(path.join(__dirname, '/views/admin.html'))
});

app.get('/user', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/user.html'))
});

app.get('/payment', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/payment.html'))
});

app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/cart.html'))
});

app.get('/show-users', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/users.html'))
})

app.get('/show-orders', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/orders.html'))
})

app.get('/place-order', async (req, res) => {
  res.sendFile(path.join(__dirname, '/views/place-order.html'))
})


app.get('/admin/product-edit', async (req, res) => {
  const productId = req.query.productId;
  try {
    const product = await Product.findOne({  _id: productId } );
    res.sendFile(path.join(__dirname, '/views/edit.html'));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//Anonymous user
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/products/search', async (req, res) => {
  const { query } = req.query;
  try {
    const products = await Product.find({ $or: [{ name: { $regex: query, $options: 'i' } }, { description: { $regex: query, $options: 'i' } }] });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/products/:productId', async (req, res) => {
  const productId = req.params.productId
  try {
    const product = await Product.findOne({  _id: productId });
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//User
app.get('/current-cart', async (req, res) => {
  try {
    const cart = await CartItem.find();
    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/current-cart/delete', async (req, res) => {
  const cartItemId = req.body.cartItemId;

  if (!cartItemId) {
    return res.status(400).json({ error: 'Item ID is required.' });
  }
  console.log(cartItemId)

  try {
    const deletedItem = await CartItem.findByIdAndDelete(cartItemId);

    if (!deletedItem) {
      return res.status(404).json({ error: 'Cart item not found.' });
    }

    res.status(200).json({ message: 'Cart item deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/current-cart/add', async (req, res) => {
  const { name, price } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const newCartItem = new CartItem({
      name,
      price
    });

    const savedItem = await newCartItem.save();

    res.status(201).json(savedItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//Admin
app.post('/products/add', async (req, res) => {
  const { name, description, price } = req.body;

  if (!name || !description || !price) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const newProduct = new Product({
      name,
      description,
      price
    });

    const savedProduct = await newProduct.save();

    res.status(201).json(savedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/products/modify', async (req, res) => {
  const { name, description, price, _id } = req.body;

  if (!name || !description || !price || !_id) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const updatedProduct = await Product.findByIdAndUpdate(_id, {
        name: name, 
        description: description,
        price: price
      })

    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/products/delete', async (req, res) => {
  const productId = req.body.productId;

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required.' });
  }
  console.log(productId)

  try {
    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.status(200).json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.post('/users/delete', async (req, res) => {
  const userId = req.body.userId;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }
  console.log(userId)

  try {
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/users', async (req, res) => {
  try {
    const users = await User.find();

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find();

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/orders/add', async (req, res) => {
  const { username, productName, productPrice } = req.body;

  if (!username || !productName || !productPrice) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const newOrder = new Order({
      username,
      productName,
      productPrice
    });

    const savedOrder = await newOrder.save();

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/orders/delete', async (req, res) => {
  const orderId = req.body.orderId;

  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required.' });
  }
  console.log(orderId)

  try {
    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    res.status(200).json({ message: 'Order deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//some example tests

/*let name = "nazwa produktu do koszyka"
let price = 5
const newCartItem = new CartItem({
  name,
  price
});
newCartItem.save()

for (let i=0; i<3; i++){
  var username = "username" + i;
  var password = "PSWD";
  var productName = "product name "  + i;
  var productPrice =  i;
  
  const newUser = new User({
    username, password
  });
  
  newUser.save();
  
  const newOrder = new Order({
    username, productName, productPrice
  });
  newOrder.save();
}*/

//Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
