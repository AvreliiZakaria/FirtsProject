export const COINS_PER_GENERATION=5;
export interface Package{id:string;generations:number;price:number;oldPrice?:number;popular?:boolean;}
export const PACKAGES:Package[]=[{id:"p1",generations:1,price:119},{id:"p3",generations:3,price:259,oldPrice:357,popular:true},{id:"p5",generations:5,price:399}];
export function getPackageById(id:string){return PACKAGES.find(p=>p.id===id);}
export function coinsFor(pkg:Package){return pkg.generations*COINS_PER_GENERATION;}
