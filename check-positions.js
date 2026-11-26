const { getHomeProducts } = require('./lib/products');

async function checkPositions() {
  const products = await getHomeProducts();
  console.log('Home positions:');
  products.forEach(p => {
    console.log(`${p.name}: homeX=${p.homeX}, homeY=${p.homeY}`);
  });
}

checkPositions();