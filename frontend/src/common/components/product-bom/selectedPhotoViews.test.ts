import { expect, it } from 'vitest';
import { selectedPhotoViews } from './selectedPhotoViews';
import type { Product } from './types';
it('uses saved gallery order', () => {
 const p = {definition:{image_assets:[{id:'a',url:'/a.png'},{id:'b',url:'/b.png'}],gallery_ids:['b','a']}} as Product;
 expect(selectedPhotoViews(p, path=>'https://admake.vn'+path)).toEqual({before:'https://admake.vn/b.png',after:'https://admake.vn/a.png'});
});
it('supports empty and legacy gallery settings', () => {
 expect(selectedPhotoViews({definition:{}} as Product, x=>x)).toBeUndefined();
 expect(selectedPhotoViews({definition:{image_assets:[],gallery_ids:[]}} as unknown as Product, x=>x)).toEqual({before:'',after:''});
});
