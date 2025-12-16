export interface CourseDate {
  id: string;
  date: string;
  time: string;
  availableSpots: number;
}

export interface Location {
  id: string;
  city: string;
  address: string;
  isActive: boolean;
  dates: CourseDate[];
  price: number;
}

export const mockLocations: Location[] = [
  {
    id: 'berlin',
    city: 'Berlin',
    address: 'Industriestraße 42, 12345 Berlin',
    isActive: true,
    price: 299,
    dates: [
      { id: 'b1', date: '2025-01-15', time: '08:00 - 16:00', availableSpots: 8 },
      { id: 'b2', date: '2025-01-22', time: '08:00 - 16:00', availableSpots: 5 },
      { id: 'b3', date: '2025-02-05', time: '08:00 - 16:00', availableSpots: 12 },
      { id: 'b4', date: '2025-02-12', time: '08:00 - 16:00', availableSpots: 10 },
    ]
  },
  {
    id: 'gorlitz',
    city: 'Zgorzelec/Görlitz',
    address: 'Logistikzentrum Ost, Bahnhofstraße 15, 02826 Görlitz',
    isActive: true,
    price: 249,
    dates: [
      { id: 'g1', date: '2025-01-18', time: '08:00 - 16:00', availableSpots: 6 },
      { id: 'g2', date: '2025-01-25', time: '08:00 - 16:00', availableSpots: 10 },
      { id: 'g3', date: '2025-02-08', time: '08:00 - 16:00', availableSpots: 8 },
    ]
  },
  {
    id: 'munich',
    city: 'München',
    address: 'Messestraße 88, 80331 München',
    isActive: false,
    price: 349,
    dates: []
  }
];
