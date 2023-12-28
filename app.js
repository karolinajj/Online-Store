const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path')
const app = express();
app.use(express.static('views'));
const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb://localhost/sklep', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

const Product = mongoose.model('Product', {
  name: String,
  description: String,
  price: Number,
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//Views
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'))
});

app.get('/anon', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/anon.html'))
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/admin.html'))
});

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

//Anonimous user
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


//Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
