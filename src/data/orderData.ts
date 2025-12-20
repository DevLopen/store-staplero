export interface OrderItem {
  id: string;
  type: 'online_course' | 'practical_course' | 'plastic_card';
  name: string;
  price: number;
  courseId?: string;
  locationId?: string;
  dateId?: string;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'paid' | 'completed' | 'cancelled';
  createdAt: Date;
  paidAt?: Date;
  customerInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    postalCode?: string;
  };
}

export const mockOrders: Order[] = [
  {
    id: "order1",
    userId: "user1",
    userEmail: "max@example.de",
    userName: "Max Mustermann",
    items: [
      {
        id: "item1",
        type: "online_course",
        name: "Staplerschein Theorie - Online Kurs",
        price: 49,
        courseId: "1"
      }
    ],
    total: 49,
    status: "paid",
    createdAt: new Date("2024-01-15"),
    paidAt: new Date("2024-01-15"),
    customerInfo: {
      firstName: "Max",
      lastName: "Mustermann",
      email: "max@example.de",
      phone: "+49 170 1234567"
    }
  },
  {
    id: "order2",
    userId: "user1",
    userEmail: "max@example.de",
    userName: "Max Mustermann",
    items: [
      {
        id: "item2",
        type: "practical_course",
        name: "Praktischer Kurs - Berlin",
        price: 299,
        locationId: "loc1",
        dateId: "date1"
      },
      {
        id: "item3",
        type: "plastic_card",
        name: "Plastikkarte (Bedienerausweis)",
        price: 14.99
      }
    ],
    total: 313.99,
    status: "completed",
    createdAt: new Date("2024-01-20"),
    paidAt: new Date("2024-01-20"),
    customerInfo: {
      firstName: "Max",
      lastName: "Mustermann",
      email: "max@example.de",
      phone: "+49 170 1234567",
      address: "Musterstraße 1",
      city: "Berlin",
      postalCode: "10115"
    }
  },
  {
    id: "order3",
    userId: "user2",
    userEmail: "anna@example.de",
    userName: "Anna Schmidt",
    items: [
      {
        id: "item4",
        type: "online_course",
        name: "Staplerschein Theorie - Online Kurs",
        price: 49,
        courseId: "1"
      }
    ],
    total: 49,
    status: "pending",
    createdAt: new Date("2024-02-01"),
    customerInfo: {
      firstName: "Anna",
      lastName: "Schmidt",
      email: "anna@example.de",
      phone: "+49 171 9876543"
    }
  }
];

export const getOrderStatusLabel = (status: Order['status']): string => {
  const labels = {
    pending: 'Ausstehend',
    paid: 'Bezahlt',
    completed: 'Abgeschlossen',
    cancelled: 'Storniert'
  };
  return labels[status];
};

export const getOrderStatusColor = (status: Order['status']): string => {
  const colors = {
    pending: 'bg-warning/10 text-warning',
    paid: 'bg-success/10 text-success',
    completed: 'bg-primary/10 text-primary',
    cancelled: 'bg-destructive/10 text-destructive'
  };
  return colors[status];
};
