import type { Product } from './types';
export function selectedPhotoViews(product: Product, imageUrl: (path: string) => string) {
  const { image_assets, gallery_ids } = product.definition;
  if (!image_assets || !gallery_ids) return undefined;
  const photos = gallery_ids.map(id => image_assets.find(a => a.id === id)).filter(a => !!a);
  return {before: photos[0] ? imageUrl(photos[0].url) : '', after: photos[1] ? imageUrl(photos[1].url) : ''};
}
