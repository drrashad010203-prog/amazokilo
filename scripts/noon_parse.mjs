fetch('https://www.noon.com/egypt-en/search/?q=iPhone', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept': 'text/html',
  }
}).then(r => r.text()).then(html => {
  const hitsIdx = html.indexOf('\\\"hits\\\":[');
  if (hitsIdx === -1) {
    console.log('No hits found');
    return;
  }

  const section = html.slice(hitsIdx);

  // Split by product boundaries (each starts with offer_code)
  const productBlocks = section.split('\\\"offer_code\\\":');

  console.log('Product blocks:', productBlocks.length - 1);

  for (let i = 1; i < Math.min(4, productBlocks.length); i++) {
    const block = productBlocks[i];

    const name = block.match(/\\\"name\\\":\\\"([^\\]{15,}?)\\\"/);
    const sku = block.match(/\\\"sku\\\":\\\"(N[A-Z0-9]+)\\\"/);
    const imgUrl = block.match(/\\\"image_url\\\":\\\"(https:[^\\]+\.jpg)/);
    const price = block.match(/\\\"price\\\":(\d{4,})/);
    const salePrice = block.match(/\\\"sale_price\\\":(\d{4,})/);
    const slug = block.match(/\\\"url\\\":\\\"([a-z0-9][a-z0-9-]{10,}[a-z0-9])\\\"/);

    console.log('\n--- Product', i, '---');
    console.log('Name:', name ? name[1] : 'N/A');
    console.log('SKU:', sku ? sku[1] : 'N/A');
    console.log('Image:', imgUrl ? imgUrl[1].replace(/\\\//g, '/') : 'N/A');
    console.log('Price:', price ? price[1] : 'N/A');
    console.log('Sale:', salePrice ? salePrice[1] : 'N/A');
    console.log('Slug:', slug ? slug[1] : 'N/A');
  }
}).catch(e => console.error('Error:', e.message));
