import { faker } from '@faker-js/faker';

const random = {
  int: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
};

export function generateFakeProducts(num = 10) {
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const materials = ['Cotton', 'Polyester', 'Silk', 'Wool', 'Linen'];

  let products = [];

  for (let i = 0; i < num; i++) {
    const productName = faker.commerce.productName();
    const basePrice = faker.number.int({ min: 100, max: 200 });
    const productMaterial = faker.helpers.arrayElement(materials);

    const sizeDetails = sizes.reduce((acc, size, index) => {
      acc[size] = {
        price: basePrice + index * random.int(1, 5),
        stock: random.int(0, 100),
      };
      return acc;
    }, {});


    const description = faker.commerce.productDescription();

    const imageUrl = faker.image.urlLoremFlickr({ category: 'fashion' });

    products.push({
      id: faker.string.uuid(),
      name: productName,
      material: productMaterial,
      basePrice: `Base Price: $${basePrice}`,
      sizeDetails,
      description,
      imageUrl
    });
  }

  return products;
}
