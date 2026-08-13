export type AdminRole='owner'|'admin'|'manager'|'staff'|'content';
export type Permission=
  |'dashboard.view'|'orders.view'|'orders.manage'|'products.view'|'products.manage'
  |'customers.view'|'customers.manage'|'marketing.manage'|'analytics.view'
  |'content.manage'|'store.manage'|'imports.manage'|'settings.manage'|'team.manage';

export const roleLabels:Record<AdminRole,string>={owner:'Chủ cửa hàng',admin:'Quản trị viên',manager:'Quản lý',staff:'Nhân viên vận hành',content:'Biên tập nội dung'};
export const rolePermissions:Record<AdminRole,Permission[]>={
 owner:['dashboard.view','orders.view','orders.manage','products.view','products.manage','customers.view','customers.manage','marketing.manage','analytics.view','content.manage','store.manage','imports.manage','settings.manage','team.manage'],
 admin:['dashboard.view','orders.view','orders.manage','products.view','products.manage','customers.view','customers.manage','marketing.manage','analytics.view','content.manage','store.manage','imports.manage','settings.manage'],
 manager:['dashboard.view','orders.view','orders.manage','products.view','products.manage','customers.view','customers.manage','marketing.manage','analytics.view','content.manage'],
 staff:['dashboard.view','orders.view','orders.manage','products.view','customers.view'],
 content:['dashboard.view','products.view','content.manage','store.manage','analytics.view'],
};
export const hasPermission=(role:AdminRole|undefined,permission:Permission)=>Boolean(role&&rolePermissions[role]?.includes(permission));
export const routePermission=(pathname:string):Permission=>{
 if(pathname.startsWith('/admin/settings/team'))return'team.manage';
 if(pathname.startsWith('/admin/settings'))return'settings.manage';
 if(pathname.startsWith('/admin/online-store'))return'store.manage';
 if(pathname.startsWith('/admin/import-export'))return'imports.manage';
 if(pathname.startsWith('/admin/blogs')||pathname.startsWith('/admin/pages'))return'content.manage';
 if(pathname.startsWith('/admin/analytics'))return'analytics.view';
 if(pathname.startsWith('/admin/discounts')||pathname.startsWith('/admin/marketing'))return'marketing.manage';
 if(pathname.startsWith('/admin/customers')||pathname.startsWith('/admin/customer-segments'))return'customers.view';
 if(pathname.startsWith('/admin/products')||pathname.startsWith('/admin/collections')||pathname.startsWith('/admin/product-groups')||pathname.startsWith('/admin/inventory'))return'products.view';
 if(pathname.startsWith('/admin/orders')||pathname.startsWith('/admin/draft-orders')||pathname.startsWith('/admin/returns'))return'orders.view';
 return'dashboard.view';
};
