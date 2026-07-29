import type {Collection,Customer} from './types';

export const seedCollections: Collection[] = [
  {
    "id": "c1",
    "handle": "new-arrivals",
    "title": "Hàng mới về",
    "description": "Những thiết kế mới nhất được TimeForge tuyển chọn.",
    "type": "automatic",
    "status": "active",
    "image": "https://cdn.shopify.com/s/files/1/0862/7906/1824/files/VE5F00126_1.png?v=1781717691",
    "productIds": [],
    "conditions": [
      {
        "field": "status",
        "operator": "equals",
        "value": "active"
      }
    ]
  },
  {
    "id": "c2",
    "handle": "versace",
    "title": "Versace",
    "description": "Thiết kế Ý táo bạo và nhận diện biểu tượng.",
    "type": "automatic",
    "status": "active",
    "image": "https://cdn.shopify.com/s/files/1/0862/7906/1824/files/VE5F00226_1.png?v=1781717698",
    "productIds": [],
    "conditions": [
      {
        "field": "vendor",
        "operator": "equals",
        "value": "Versace"
      }
    ]
  },
  {
    "id": "c3",
    "handle": "dong-ho-nu",
    "title": "Đồng hồ nữ",
    "description": "Những thiết kế thanh lịch dành cho nữ.",
    "type": "manual",
    "status": "active",
    "image": "https://cdn.shopify.com/s/files/1/0862/7906/1824/files/VE5F00326_1.png?v=1781717704",
    "productIds": [
      "p1",
      "p2",
      "p3",
      "p4",
      "p5",
      "p6",
      "p7",
      "p8"
    ],
    "conditions": []
  }
];

export const seedCustomers: Customer[] = [
  {
    "id": "u1",
    "name": "Nguyễn Minh Anh",
    "email": "minhanh@example.com",
    "phone": "0901234567",
    "ordersCount": 3,
    "totalSpent": 48500000,
    "tags": [
      "VIP"
    ],
    "createdAt": "2026-07-10T09:00:00.000Z"
  },
  {
    "id": "u2",
    "name": "Trần Gia Huy",
    "email": "giahuy@example.com",
    "phone": "0912345678",
    "ordersCount": 1,
    "totalSpent": 12800000,
    "tags": [
      "Newsletter"
    ],
    "createdAt": "2026-07-12T10:30:00.000Z"
  }
];
