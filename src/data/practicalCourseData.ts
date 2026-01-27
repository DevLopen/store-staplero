export interface CourseDate {
  id: string;
  startDate: string;
  endDate: string;
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
    id: "loc1",
    city: "Berlin",
    address: "Industriestraße 42, 12345 Berlin",
    isActive: true,
    price: 299,
    dates: [
      {
        id: "d1",
        startDate: "2025-02-15",
        endDate: "2025-02-15",
        time: "08:00 - 16:00",
        availableSpots: 10
      }
    ]
  }
];
