export type FoodPlatform = "Swiggy" | "Zomato";

export interface OrderItem {
  name: string;
  cuisine: string;
  quantity: number;
  price: number;
}

export interface OrderRecord {
  id: string;
  platform: FoodPlatform;
  restaurant: string;
  orderedAt: string;
  deliveredInMinutes: number;
  total: number;
  items: OrderItem[];
}

export const orderHistory: OrderRecord[] = [
  {
    id: "ord-001",
    platform: "Swiggy",
    restaurant: "Paradise Biryani",
    orderedAt: "2026-03-20T20:27:00+05:30",
    deliveredInMinutes: 42,
    total: 430,
    items: [
      { name: "Chicken Dum Biryani", cuisine: "Biryani", quantity: 1, price: 320 },
      { name: "Double Ka Meetha", cuisine: "Dessert", quantity: 1, price: 110 }
    ]
  },
  {
    id: "ord-002",
    platform: "Zomato",
    restaurant: "Mehfil",
    orderedAt: "2026-03-13T20:29:00+05:30",
    deliveredInMinutes: 36,
    total: 390,
    items: [
      { name: "Chicken 65 Biryani", cuisine: "Biryani", quantity: 1, price: 310 },
      { name: "Raita", cuisine: "Sides", quantity: 1, price: 80 }
    ]
  },
  {
    id: "ord-003",
    platform: "Swiggy",
    restaurant: "Bowl Company",
    orderedAt: "2026-03-16T20:20:00+05:30",
    deliveredInMinutes: 29,
    total: 280,
    items: [{ name: "Paneer Rice Bowl", cuisine: "Healthy", quantity: 1, price: 280 }]
  },
  {
    id: "ord-004",
    platform: "Zomato",
    restaurant: "FreshMenu",
    orderedAt: "2026-03-09T20:16:00+05:30",
    deliveredInMinutes: 31,
    total: 260,
    items: [{ name: "Grilled Chicken Salad", cuisine: "Healthy", quantity: 1, price: 260 }]
  },
  {
    id: "ord-005",
    platform: "Swiggy",
    restaurant: "Paradise Biryani",
    orderedAt: "2026-03-06T20:33:00+05:30",
    deliveredInMinutes: 34,
    total: 450,
    items: [
      { name: "Chicken Dum Biryani", cuisine: "Biryani", quantity: 1, price: 330 },
      { name: "Apollo Fish", cuisine: "Andhra", quantity: 1, price: 120 }
    ]
  },
  {
    id: "ord-006",
    platform: "Swiggy",
    restaurant: "Bowl Company",
    orderedAt: "2026-03-02T20:24:00+05:30",
    deliveredInMinutes: 28,
    total: 290,
    items: [{ name: "Peri Peri Chicken Bowl", cuisine: "Healthy", quantity: 1, price: 290 }]
  },
  {
    id: "ord-007",
    platform: "Zomato",
    restaurant: "NIC Ice Creams",
    orderedAt: "2026-03-01T20:55:00+05:30",
    deliveredInMinutes: 22,
    total: 180,
    items: [{ name: "Tender Coconut Ice Cream", cuisine: "Dessert", quantity: 2, price: 90 }]
  },
  {
    id: "ord-008",
    platform: "Swiggy",
    restaurant: "Paradise Biryani",
    orderedAt: "2026-02-27T20:26:00+05:30",
    deliveredInMinutes: 37,
    total: 415,
    items: [
      { name: "Chicken Dum Biryani", cuisine: "Biryani", quantity: 1, price: 320 },
      { name: "Mirchi Ka Salan", cuisine: "Sides", quantity: 1, price: 95 }
    ]
  }
];
